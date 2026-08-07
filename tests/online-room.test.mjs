import test from "node:test";
import assert from "node:assert/strict";
import {
  MATCH_HOLD_MS,
  MISMATCH_HOLD_MS,
  applyFlip,
  createRoomState,
  joinRoom,
  leaveRoom,
  publicRoomState,
  resolvePending,
  seatForToken,
  setConnected,
  setReady,
} from "../worker/src/room-core.mjs";

function deck() {
  return [
    { pairKey: "a", side: "romaji", text: "a", kindLabel: "羅馬拼音", audioKey: "a" },
    { pairKey: "a", side: "hira", text: "あ", kindLabel: "平假名", audioKey: "a" },
    { pairKey: "i", side: "romaji", text: "i", kindLabel: "羅馬拼音", audioKey: "i" },
    { pairKey: "i", side: "hira", text: "い", kindLabel: "平假名", audioKey: "i" },
    { pairKey: "u", side: "romaji", text: "u", kindLabel: "羅馬拼音", audioKey: "u" },
    { pairKey: "u", side: "hira", text: "う", kindLabel: "平假名", audioKey: "u" },
    { pairKey: "e", side: "romaji", text: "e", kindLabel: "羅馬拼音", audioKey: "e" },
    { pairKey: "e", side: "hira", text: "え", kindLabel: "平假名", audioKey: "e" },
    { pairKey: "o", side: "romaji", text: "o", kindLabel: "羅馬拼音", audioKey: "o" },
    { pairKey: "o", side: "hira", text: "お", kindLabel: "平假名", audioKey: "o" },
    { pairKey: "ka", side: "romaji", text: "ka", kindLabel: "羅馬拼音", audioKey: "ka" },
    { pairKey: "ka", side: "hira", text: "か", kindLabel: "平假名", audioKey: "ka" },
  ];
}

function room() {
  return createRoomState({
    roomCode: "AB2C3D",
    hostName: "小春",
    hostToken: "host-token",
    config: { kind: "kana", pairMode: "romaji-hira", pairCount: 6, gridId: "4x3" },
    deck: deck(),
    now: 1000,
    random: () => 0.999,
  });
}

test("anonymous seats can join, reconnect, and start only when both are connected and ready", () => {
  const state = room();
  assert.equal(seatForToken(state, "host-token"), 0);
  assert.deepEqual(joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 }), {
    ok: true,
    seat: 1,
    reconnected: false,
  });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  assert.equal(setReady(state, 0, true, 1300).started, false);
  assert.equal(setReady(state, 1, true, 1400, () => 0.999).started, true);
  assert.equal(state.phase, "playing");
});

test("hidden cards stay secret until an authoritative reveal", () => {
  const state = room();
  const before = publicRoomState(state, 0, 1000);
  assert.ok(before.deck.every((slot) => slot.card === null));
  joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  setReady(state, 0, true, 1300);
  setReady(state, 1, true, 1400, () => 0.999);
  applyFlip(state, 0, 0, 1500);
  const after = publicRoomState(state, 0, 1500);
  assert.equal(after.deck[0].card.text, "a");
  assert.equal(after.deck[1].card, null);
});

test("a match scores for the active player and preserves the turn", () => {
  const state = room();
  joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  setReady(state, 0, true, 1300);
  setReady(state, 1, true, 1400, () => 0.999);
  assert.equal(state.deck[0].pairKey, state.deck[1].pairKey);
  applyFlip(state, 0, 0, 1500);
  const second = applyFlip(state, 0, 1, 1510);
  assert.equal(second.resolution, "match");
  assert.equal(resolvePending(state, 1510 + MATCH_HOLD_MS).resolution, "match");
  assert.deepEqual(state.scores, [1, 0]);
  assert.equal(state.currentPlayer, 0);
  assert.equal(state.slots[0].owner, 0);
});

test("a mismatch remains visible, then closes and switches the turn", () => {
  const state = room();
  joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  setReady(state, 0, true, 1300);
  setReady(state, 1, true, 1400, () => 0.999);
  applyFlip(state, 0, 0, 1500);
  const second = applyFlip(state, 0, 2, 1510);
  assert.equal(second.resolution, "mismatch");
  assert.equal(state.currentPlayer, 0);
  assert.equal(state.slots[0].state, "up");
  assert.equal(resolvePending(state, 1510 + MISMATCH_HOLD_MS).resolution, "mismatch");
  assert.equal(state.currentPlayer, 1);
  assert.equal(state.slots[0].state, "down");
});

test("stale, duplicate, and out-of-turn flips are rejected", () => {
  const state = room();
  joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  setReady(state, 0, true, 1300);
  setReady(state, 1, true, 1400, () => 0.999);
  assert.equal(applyFlip(state, 1, 0, 1500).error, "NOT_YOUR_TURN");
  assert.equal(applyFlip(state, 0, 0, 1510).ok, true);
  assert.equal(applyFlip(state, 0, 0, 1520).error, "CARD_UNAVAILABLE");
});

test("an intentional departure is announced, pauses play, and clears on reconnect", () => {
  const state = room();
  joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  setReady(state, 0, true, 1300);
  setReady(state, 1, true, 1400, () => 0.999);

  assert.equal(leaveRoom(state, 1, 1500).ok, true);
  assert.equal(state.players[1].ready, false);
  assert.equal(publicRoomState(state, 0, 1500).players[1].left, true);
  assert.equal(applyFlip(state, 0, 0, 1510).error, "OPPONENT_UNAVAILABLE");

  setConnected(state, 1, true, 1600);
  assert.equal(publicRoomState(state, 0, 1600).players[1].left, false);
  assert.equal(applyFlip(state, 0, 0, 1610).ok, true);
});

test("completion reveals the result and two rematch-ready seats start a clean round", () => {
  const state = room();
  joinRoom(state, { name: "太郎", token: "guest-token", now: 1100 });
  setConnected(state, 0, true, 1200);
  setConnected(state, 1, true, 1200);
  setReady(state, 0, true, 1300);
  setReady(state, 1, true, 1400, () => 0.999);
  let now = 1500;
  for (let index = 0; index < state.deck.length; index += 2) {
    applyFlip(state, 0, index, now);
    applyFlip(state, 0, index + 1, now + 1);
    resolvePending(state, now + MATCH_HOLD_MS + 1);
    now += 400;
  }
  assert.equal(state.phase, "complete");
  assert.equal(publicRoomState(state, 0, now).winner, 0);
  assert.equal(setReady(state, 0, true, now + 1).started, false);
  assert.equal(setReady(state, 1, true, now + 2, () => 0.999).started, true);
  assert.equal(state.phase, "playing");
  assert.deepEqual(state.scores, [0, 0]);
  assert.ok(state.slots.every((slot) => slot.state === "down"));
});
