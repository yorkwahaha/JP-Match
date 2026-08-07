export const MATCH_HOLD_MS = 280;
export const MISMATCH_HOLD_MS = 900;
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
export const RECONNECT_GRACE_MS = 2 * 60 * 1000;

const MAX_NAME_LENGTH = 16;
const MAX_TEXT_LENGTH = 80;
const ALLOWED_CARD_FIELDS = [
  "pairKey",
  "side",
  "text",
  "kindLabel",
  "display",
  "voiceText",
  "voiceKey",
  "audioKey",
  "label",
  "picSub",
];

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function sanitizePlayerName(value, fallback = "玩家") {
  const name = cleanText(value, MAX_NAME_LENGTH).replace(/[<>\u0000-\u001f]/g, "");
  return name || fallback;
}

export function sanitizeRoomCode(value) {
  return cleanText(value, 8).toUpperCase().replace(/[^A-Z2-9]/g, "");
}

export function sanitizeConfig(input = {}) {
  const kind = input.kind === "words" ? "words" : "kana";
  return {
    kind,
    pairMode: cleanText(input.pairMode, 32),
    pairModeLabel: cleanText(input.pairModeLabel, 40),
    gridId: cleanText(input.gridId, 16),
    gridLabel: cleanText(input.gridLabel, 40),
    rowFrom: cleanText(input.rowFrom, 16),
    rowTo: cleanText(input.rowTo, 16),
    rangeLabel: cleanText(input.rangeLabel, 80),
    wordCategory: cleanText(input.wordCategory, 32),
    wordCategoryLabel: cleanText(input.wordCategoryLabel, 60),
    pairCount: Number(input.pairCount),
  };
}

function sanitizeCard(input) {
  const card = {};
  for (const field of ALLOWED_CARD_FIELDS) {
    if (input?.[field] == null) continue;
    card[field] = cleanText(input[field]);
  }
  if (!card.pairKey || !card.side) throw new Error("INVALID_CARD");
  if (card.display === "img" && !/^assets\/[a-z0-9_./-]+$/i.test(card.text || "")) {
    throw new Error("INVALID_CARD_ASSET");
  }
  return card;
}

export function shuffle(items, random = Math.random) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function prepareDeck(input, random = Math.random) {
  if (!Array.isArray(input) || input.length < 12 || input.length > 50 || input.length % 2) {
    throw new Error("INVALID_DECK_SIZE");
  }
  const cards = input.map(sanitizeCard);
  const pairs = new Map();
  for (const card of cards) {
    const pair = pairs.get(card.pairKey) || [];
    pair.push(card);
    pairs.set(card.pairKey, pair);
  }
  if (pairs.size * 2 !== cards.length) throw new Error("INVALID_PAIR_COUNT");
  for (const pair of pairs.values()) {
    if (pair.length !== 2 || pair[0].side === pair[1].side) {
      throw new Error("INVALID_PAIR");
    }
  }
  return shuffle(cards, random);
}

function newSlots(length) {
  return Array.from({ length }, () => ({ state: "down", owner: null }));
}

function bump(room, now) {
  room.version += 1;
  room.lastActiveAt = now;
}

function startRound(room, now, random = Math.random) {
  room.deck = shuffle(room.deck, random);
  room.slots = newSlots(room.deck.length);
  room.phase = "playing";
  room.currentPlayer = 0;
  room.scores = [0, 0];
  room.flipped = [];
  room.pending = null;
  room.moves = 0;
  room.matchTraces = [];
  room.startedAt = now;
  room.completedAt = null;
  room.players.forEach((player) => {
    if (player) player.ready = false;
  });
}

export function createRoomState({ roomCode, hostName, hostToken, config, deck, now = Date.now(), random = Math.random }) {
  const cleanConfig = sanitizeConfig(config);
  const cleanDeck = prepareDeck(deck, random);
  if (!Number.isInteger(cleanConfig.pairCount) || cleanConfig.pairCount * 2 !== cleanDeck.length) {
    throw new Error("INVALID_CONFIG_PAIR_COUNT");
  }
  return {
    roomCode: sanitizeRoomCode(roomCode),
    phase: "lobby",
    version: 1,
    config: cleanConfig,
    players: [
      {
        seat: 0,
        name: sanitizePlayerName(hostName, "玩家 1"),
        token: cleanText(hostToken, 128),
        ready: false,
        connected: false,
        disconnectedAt: null,
        leftAt: null,
      },
      null,
    ],
    deck: cleanDeck,
    slots: newSlots(cleanDeck.length),
    currentPlayer: 0,
    scores: [0, 0],
    flipped: [],
    pending: null,
    moves: 0,
    matchTraces: [],
    createdAt: now,
    lastActiveAt: now,
    startedAt: null,
    completedAt: null,
  };
}

export function seatForToken(room, token) {
  if (!room || !token) return -1;
  return room.players.findIndex((player) => player?.token === token);
}

export function joinRoom(room, { name, token, now = Date.now() }) {
  if (!room || room.phase !== "lobby") return { ok: false, error: "ROOM_ALREADY_STARTED" };
  const existingSeat = seatForToken(room, token);
  if (existingSeat >= 0) return { ok: true, seat: existingSeat, reconnected: true };
  if (room.players[1]) return { ok: false, error: "ROOM_FULL" };
  room.players[1] = {
    seat: 1,
    name: sanitizePlayerName(name, "玩家 2"),
    token: cleanText(token, 128),
    ready: false,
    connected: false,
    disconnectedAt: null,
    leftAt: null,
  };
  bump(room, now);
  return { ok: true, seat: 1, reconnected: false };
}

export function setConnected(room, seat, connected, now = Date.now()) {
  const player = room?.players?.[seat];
  if (!player) return false;
  player.connected = Boolean(connected);
  player.disconnectedAt = connected ? null : now;
  if (connected) player.leftAt = null;
  bump(room, now);
  return true;
}

export function leaveRoom(room, seat, now = Date.now()) {
  const player = room?.players?.[seat];
  if (!player) return { ok: false, error: "INVALID_SESSION" };
  player.connected = false;
  player.ready = false;
  player.disconnectedAt = now;
  player.leftAt = now;
  bump(room, now);
  return { ok: true };
}

export function setReady(room, seat, ready, now = Date.now(), random = Math.random) {
  const player = room?.players?.[seat];
  if (!player || (room.phase !== "lobby" && room.phase !== "complete")) {
    return { ok: false, error: "NOT_IN_READY_PHASE" };
  }
  if (!player.connected || player.leftAt) return { ok: false, error: "PLAYER_NOT_CONNECTED" };
  player.ready = Boolean(ready);
  bump(room, now);
  if (room.players.every((entry) => entry?.ready && entry.connected)) {
    startRound(room, now, random);
    bump(room, now);
    return { ok: true, started: true };
  }
  return { ok: true, started: false };
}

export function applyFlip(room, seat, index, now = Date.now()) {
  if (!room || room.phase !== "playing") return { ok: false, error: "GAME_NOT_ACTIVE" };
  if (seat !== room.currentPlayer) return { ok: false, error: "NOT_YOUR_TURN" };
  if (!room.players.every((player) => player?.connected && !player.leftAt)) {
    return { ok: false, error: "OPPONENT_UNAVAILABLE" };
  }
  if (room.pending) return { ok: false, error: "BOARD_LOCKED" };
  if (!Number.isInteger(index) || index < 0 || index >= room.deck.length) {
    return { ok: false, error: "INVALID_CARD_INDEX" };
  }
  if (room.slots[index].state !== "down" || room.flipped.includes(index)) {
    return { ok: false, error: "CARD_UNAVAILABLE" };
  }

  room.slots[index].state = "up";
  room.flipped.push(index);
  bump(room, now);
  if (room.flipped.length < 2) return { ok: true, pending: false };

  room.moves += 1;
  const [a, b] = room.flipped;
  const cardA = room.deck[a];
  const cardB = room.deck[b];
  const matched = cardA.pairKey === cardB.pairKey && cardA.side !== cardB.side;
  room.pending = {
    type: matched ? "match" : "mismatch",
    indices: [a, b],
    dueAt: now + (matched ? MATCH_HOLD_MS : MISMATCH_HOLD_MS),
  };
  bump(room, now);
  return { ok: true, pending: true, dueAt: room.pending.dueAt, resolution: room.pending.type };
}

export function resolvePending(room, now = Date.now()) {
  if (!room?.pending || room.pending.dueAt > now) return { ok: false, error: "NOT_DUE" };
  const { type, indices } = room.pending;
  const [a, b] = indices;
  if (type === "match") {
    const player = room.currentPlayer;
    room.slots[a] = { state: "matched", owner: player };
    room.slots[b] = { state: "matched", owner: player };
    room.scores[player] += 1;
    room.matchTraces.push({
      a,
      b,
      pairKey: room.deck[a].pairKey,
      player,
      createdAt: now,
    });
  } else {
    room.slots[a] = { state: "down", owner: null };
    room.slots[b] = { state: "down", owner: null };
    room.currentPlayer = 1 - room.currentPlayer;
  }
  room.flipped = [];
  room.pending = null;
  if (room.slots.every((slot) => slot.state === "matched")) {
    room.phase = "complete";
    room.completedAt = now;
    room.players.forEach((player) => {
      if (player) player.ready = false;
    });
  }
  bump(room, now);
  return { ok: true, resolution: type, complete: room.phase === "complete" };
}

export function publicRoomState(room, forSeat = -1, now = Date.now()) {
  const revealAll = room.phase === "complete";
  const deck = room.slots.map((slot, index) => ({
    state: slot.state,
    owner: slot.owner,
    card: revealAll || slot.state !== "down" ? room.deck[index] : null,
  }));
  const winner = room.phase !== "complete"
    ? null
    : room.scores[0] === room.scores[1]
      ? "tie"
      : room.scores[0] > room.scores[1]
        ? 0
        : 1;
  return {
    roomCode: room.roomCode,
    phase: room.phase,
    version: room.version,
    youSeat: forSeat,
    config: room.config,
    players: room.players.map((player) => player && ({
      seat: player.seat,
      name: player.name,
      ready: player.ready,
      connected: player.connected,
      left: Boolean(player.leftAt),
      reconnectRemainingMs: player.connected || !player.disconnectedAt
        ? null
        : Math.max(0, RECONNECT_GRACE_MS - (now - player.disconnectedAt)),
    })),
    deck,
    currentPlayer: room.currentPlayer,
    scores: room.scores,
    flipped: room.flipped,
    pending: room.pending && { type: room.pending.type, dueAt: room.pending.dueAt },
    moves: room.moves,
    matchTraces: room.matchTraces,
    startedAt: room.startedAt,
    completedAt: room.completedAt,
    winner,
  };
}

export function roomExpired(room, now = Date.now()) {
  return !room || now - room.lastActiveAt >= ROOM_TTL_MS;
}
