import { DurableObject } from "cloudflare:workers";
import {
  ROOM_TTL_MS,
  applyFlip,
  configureNextRound,
  createRoomState,
  joinRoom,
  leaveRoom,
  publicRoomState,
  resolvePending,
  roomExpired,
  sanitizeRoomCode,
  seatForToken,
  setConnected,
  setReady,
} from "./room-core.mjs";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;

function randomString(length, alphabet = ROOM_ALPHABET) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function createToken() {
  return randomString(32, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_");
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

async function readJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 64 * 1024) throw new Error("PAYLOAD_TOO_LARGE");
  const text = await request.text();
  if (text.length > 64 * 1024) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text);
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function originAllowed(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return allowedOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin");
  return origin && originAllowed(request, env)
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        vary: "Origin",
      }
    : { vary: "Origin" };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders(request, env))) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function roomStub(env, code) {
  return env.ROOMS.getByName(code);
}

async function proxyRoomRequest(env, code, path, init) {
  return roomStub(env, code).fetch(`https://room.internal${path}`, init);
}

export class RoomObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.room = null;
    this.initialized = ctx.blockConcurrencyWhile(async () => {
      this.room = (await ctx.storage.get("room")) || null;
    });
  }

  async persist() {
    if (this.room) await this.ctx.storage.put("room", this.room);
  }

  async scheduleAlarm() {
    if (!this.room) return;
    const next = this.room.pending?.dueAt || this.room.lastActiveAt + ROOM_TTL_MS;
    await this.ctx.storage.setAlarm(next);
  }

  send(ws, payload) {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(payload));
    } catch (_) {
      // The close/error callback performs the durable connection cleanup.
    }
  }

  broadcast() {
    if (!this.room) return;
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() || {};
      this.send(ws, { type: "state", room: publicRoomState(this.room, attachment.seat) });
    }
  }

  async fetch(request) {
    await this.initialized;
    const url = new URL(request.url);

    if (url.pathname === "/create" && request.method === "POST") {
      if (this.room && !roomExpired(this.room)) return json({ error: "ROOM_EXISTS" }, 409);
      const body = await readJson(request);
      try {
        this.room = createRoomState({
          roomCode: body.roomCode,
          hostName: body.playerName,
          hostToken: body.token,
          config: body.config,
          deck: body.deck,
        });
      } catch (error) {
        return json({ error: error.message || "INVALID_ROOM" }, 400);
      }
      await this.persist();
      await this.scheduleAlarm();
      return json({
        token: body.token,
        seat: 0,
        room: publicRoomState(this.room, 0),
      }, 201);
    }

    if (!this.room || roomExpired(this.room)) return json({ error: "ROOM_NOT_FOUND" }, 404);

    if (url.pathname === "/join" && request.method === "POST") {
      const body = await readJson(request);
      const result = joinRoom(this.room, {
        name: body.playerName,
        token: body.token,
      });
      if (!result.ok) return json({ error: result.error }, result.error === "ROOM_FULL" ? 409 : 400);
      await this.persist();
      await this.scheduleAlarm();
      this.broadcast();
      return json({
        token: body.token,
        seat: result.seat,
        room: publicRoomState(this.room, result.seat),
      });
    }

    if (url.pathname === "/leave" && request.method === "POST") {
      const body = await readJson(request);
      const seat = seatForToken(this.room, body.token);
      if (seat < 0) return json({ error: "INVALID_SESSION" }, 401);
      const result = leaveRoom(this.room, seat);
      if (!result.ok) return json({ error: result.error }, 400);
      await this.persist();
      await this.scheduleAlarm();
      this.broadcast();
      return json({ ok: true, room: publicRoomState(this.room, seat) });
    }

    if (url.pathname === "/ws" && request.headers.get("upgrade") === "websocket") {
      const token = url.searchParams.get("token") || "";
      const seat = seatForToken(this.room, token);
      if (seat < 0) return json({ error: "INVALID_SESSION" }, 401);

      for (const previous of this.ctx.getWebSockets(`seat:${seat}`)) {
        try {
          previous.close(4001, "Reconnected from another tab");
        } catch (_) {}
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, [`seat:${seat}`]);
      server.serializeAttachment({ seat });
      setConnected(this.room, seat, true);
      await this.persist();
      await this.scheduleAlarm();
      this.broadcast();
      return new Response(null, { status: 101, webSocket: client });
    }

    return json({ error: "NOT_FOUND" }, 404);
  }

  async webSocketMessage(ws, message) {
    await this.initialized;
    if (!this.room || typeof message !== "string") return;
    const { seat } = ws.deserializeAttachment() || {};
    const player = this.room.players[seat];
    if (!player) return;

    let command;
    try {
      command = JSON.parse(message);
    } catch (_) {
      this.send(ws, { type: "error", code: "INVALID_MESSAGE" });
      return;
    }

    if (command.type === "sync") {
      this.send(ws, { type: "state", room: publicRoomState(this.room, seat) });
      return;
    }

    if (command.actionId && player.lastActionId === command.actionId) {
      this.send(ws, { type: "state", room: publicRoomState(this.room, seat) });
      return;
    }
    if (command.version !== this.room.version) {
      this.send(ws, {
        type: "error",
        code: "STALE_STATE",
        room: publicRoomState(this.room, seat),
      });
      return;
    }

    let result = { ok: false, error: "UNKNOWN_COMMAND" };
    if (command.type === "ready") {
      result = setReady(this.room, seat, command.ready !== false);
    } else if (command.type === "configure") {
      result = configureNextRound(this.room, seat, command.config, command.deck);
    } else if (command.type === "flip") {
      result = applyFlip(this.room, seat, Number(command.index));
    } else if (command.type === "leave") {
      result = leaveRoom(this.room, seat);
    }

    if (!result.ok) {
      this.send(ws, {
        type: "error",
        code: result.error,
        room: publicRoomState(this.room, seat),
      });
      return;
    }
    player.lastActionId = command.actionId || player.lastActionId || "";
    await this.persist();
    await this.scheduleAlarm();
    this.broadcast();
  }

  async markDisconnected(ws) {
    await this.initialized;
    if (!this.room) return;
    const { seat } = ws.deserializeAttachment() || {};
    const anotherOpenSocket = this.ctx
      .getWebSockets(`seat:${seat}`)
      .some((candidate) => candidate !== ws && candidate.readyState === WebSocket.OPEN);
    if (!anotherOpenSocket && setConnected(this.room, seat, false)) {
      await this.persist();
      await this.scheduleAlarm();
      this.broadcast();
    }
  }

  async webSocketClose(ws) {
    await this.markDisconnected(ws);
  }

  async webSocketError(ws) {
    await this.markDisconnected(ws);
  }

  async alarm() {
    await this.initialized;
    if (!this.room) return;
    const now = Date.now();
    if (roomExpired(this.room, now)) {
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.close(4000, "Room expired");
        } catch (_) {}
      }
      this.room = null;
      await this.ctx.storage.deleteAll();
      return;
    }
    if (this.room.pending?.dueAt <= now) {
      resolvePending(this.room, now);
      await this.persist();
      this.broadcast();
    }
    await this.scheduleAlarm();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return originAllowed(request, env)
        ? new Response(null, { status: 204, headers: cors })
        : json({ error: "ORIGIN_NOT_ALLOWED" }, 403, cors);
    }
    if (!originAllowed(request, env)) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403, cors);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "jp-match-online" }, 200, cors);
    }

    if (url.pathname === "/rooms" && request.method === "POST") {
      let body;
      try {
        body = await readJson(request);
      } catch (error) {
        return json({ error: error.message || "INVALID_JSON" }, 400, cors);
      }
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const roomCode = randomString(ROOM_CODE_LENGTH);
        const token = createToken();
        const response = await proxyRoomRequest(env, roomCode, "/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, roomCode, token }),
        });
        if (response.status !== 409) return withCors(response, request, env);
      }
      return json({ error: "ROOM_CODE_UNAVAILABLE" }, 503, cors);
    }

    const joinMatch = url.pathname.match(/^\/rooms\/([A-Z2-9]{6})\/join$/i);
    if (joinMatch && request.method === "POST") {
      const roomCode = sanitizeRoomCode(joinMatch[1]);
      let body;
      try {
        body = await readJson(request);
      } catch (error) {
        return json({ error: error.message || "INVALID_JSON" }, 400, cors);
      }
      const response = await proxyRoomRequest(env, roomCode, "/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, token: createToken() }),
      });
      return withCors(response, request, env);
    }

    const leaveMatch = url.pathname.match(/^\/rooms\/([A-Z2-9]{6})\/leave$/i);
    if (leaveMatch && request.method === "POST") {
      const roomCode = sanitizeRoomCode(leaveMatch[1]);
      let body;
      try {
        body = await readJson(request);
      } catch (error) {
        return json({ error: error.message || "INVALID_JSON" }, 400, cors);
      }
      const response = await proxyRoomRequest(env, roomCode, "/leave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: body.token }),
      });
      return withCors(response, request, env);
    }

    const wsMatch = url.pathname.match(/^\/rooms\/([A-Z2-9]{6})\/ws$/i);
    if (wsMatch && request.headers.get("upgrade") === "websocket") {
      const roomCode = sanitizeRoomCode(wsMatch[1]);
      return proxyRoomRequest(env, roomCode, `/ws?token=${encodeURIComponent(url.searchParams.get("token") || "")}`, {
        headers: { upgrade: "websocket" },
      });
    }

    return json({ error: "NOT_FOUND" }, 404, cors);
  },
};
