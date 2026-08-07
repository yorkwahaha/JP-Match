window.JPMatchOnline = (() => {
  const meta = document.querySelector('meta[name="jp-match-online-api"]');
  const localHost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const API_BASE = String(
    (localHost ? "http://127.0.0.1:8787" : meta?.content) ||
      "https://jp-match-online.yorkwahaha.workers.dev",
  ).replace(/\/$/, "");
  const SESSION_PREFIX = "jp-match-online-session:";
  const MAX_RECONNECT_DELAY_MS = 8000;
  const MAX_RECONNECT_ATTEMPTS = 8;

  let socket = null;
  let room = null;
  let token = "";
  let roomCode = "";
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let intentionalClose = false;
  let handlers = {
    onState() {},
    onConnection() {},
    onError() {},
  };

  const ERROR_MESSAGES = {
    ROOM_NOT_FOUND: "找不到這個房間，請確認房號是否正確。",
    ROOM_FULL: "這個房間已經有兩位玩家。",
    ROOM_ALREADY_STARTED: "這局已經開始，無法加入。",
    INVALID_SESSION: "匿名連線憑證已失效，請重新加入房間。",
    NOT_YOUR_TURN: "現在是對手的回合。",
    BOARD_LOCKED: "請等這兩張牌完成判定。",
    CARD_UNAVAILABLE: "這張牌目前不能翻開。",
    STALE_STATE: "盤面剛剛更新，已替你同步到最新狀態。",
    PLAYER_NOT_CONNECTED: "連線尚未完成，請稍候再準備。",
    OPPONENT_UNAVAILABLE: "對手目前不在線上，牌局已暫停。",
    ORIGIN_NOT_ALLOWED: "目前的網站來源尚未獲准使用線上房間。",
  };

  function emitConnection(status, detail = "") {
    handlers.onConnection({ status, detail, attempts: reconnectAttempts });
  }

  function emitError(code, fallback) {
    handlers.onError({ code, message: ERROR_MESSAGES[code] || fallback || "線上房間發生錯誤。" });
  }

  function sessionKey(code) {
    return SESSION_PREFIX + String(code || "").toUpperCase();
  }

  function saveSession(playerName) {
    try {
      window.localStorage.setItem(
        sessionKey(roomCode),
        JSON.stringify({ roomCode, token, playerName: String(playerName || "") }),
      );
    } catch (_) {}
  }

  function loadSession(code) {
    try {
      const value = JSON.parse(window.localStorage.getItem(sessionKey(code)) || "null");
      return value?.token ? value : null;
    } catch (_) {
      return null;
    }
  }

  function forgetSession(code = roomCode) {
    try {
      window.localStorage.removeItem(sessionKey(code));
    } catch (_) {}
  }

  function requestUrl(path) {
    return API_BASE + path;
  }

  async function request(path, init) {
    let response;
    try {
      response = await fetch(requestUrl(path), {
        ...init,
        headers: { "content-type": "application/json", ...(init?.headers || {}) },
      });
    } catch (_) {
      throw new Error("NETWORK_UNAVAILABLE");
    }
    let data = {};
    try {
      data = await response.json();
    } catch (_) {}
    if (!response.ok) throw new Error(data.error || `HTTP_${response.status}`);
    return data;
  }

  function websocketUrl() {
    const base = API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    return `${base}/rooms/${encodeURIComponent(roomCode)}/ws?token=${encodeURIComponent(token)}`;
  }

  function clearReconnectTimer() {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function scheduleReconnect() {
    if (intentionalClose || reconnectTimer || !roomCode || !token) return;
    reconnectAttempts += 1;
    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      intentionalClose = true;
      emitConnection("closed");
      emitError("INVALID_SESSION", "多次重新接線仍失敗，請回到首頁重新加入房間。");
      return;
    }
    const delay = Math.min(MAX_RECONNECT_DELAY_MS, 500 * 2 ** Math.min(4, reconnectAttempts - 1));
    emitConnection("reconnecting", `第 ${reconnectAttempts} 次重新接線`);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function connect() {
    clearReconnectTimer();
    intentionalClose = false;
    emitConnection(reconnectAttempts ? "reconnecting" : "connecting");
    try {
      socket = new WebSocket(websocketUrl());
    } catch (_) {
      scheduleReconnect();
      return;
    }
    socket.addEventListener("open", () => {
      reconnectAttempts = 0;
      emitConnection("connected");
      socket.send(JSON.stringify({ type: "sync" }));
    });
    socket.addEventListener("message", (event) => {
      if (intentionalClose) return;
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (_) {
        return;
      }
      if (message.room && (!room || message.room.version >= room.version)) {
        room = message.room;
        handlers.onState(room);
      }
      if (message.type === "error" && message.code !== "STALE_STATE") {
        emitError(message.code);
      }
    });
    socket.addEventListener("close", (event) => {
      socket = null;
      if (intentionalClose) {
        emitConnection("closed");
        return;
      }
      if (event.code === 4000 || event.code === 4001) {
        intentionalClose = true;
        emitConnection("closed");
        emitError(event.code === 4000 ? "ROOM_NOT_FOUND" : "INVALID_SESSION", event.reason);
        return;
      }
      scheduleReconnect();
    });
    socket.addEventListener("error", () => {
      emitConnection("disconnected");
    });
  }

  function acceptSession(data, playerName) {
    room = data.room;
    roomCode = data.room.roomCode;
    token = data.token;
    saveSession(playerName);
    handlers.onState(room);
    connect();
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomCode);
    window.history.replaceState({}, "", url);
    return room;
  }

  async function create({ playerName, config, deck }) {
    emitConnection("creating");
    try {
      const data = await request("/rooms", {
        method: "POST",
        body: JSON.stringify({ playerName, config, deck }),
      });
      return acceptSession(data, playerName);
    } catch (error) {
      emitConnection("idle");
      emitError(error.message, "目前無法建立房間，請稍後再試。 ");
      throw error;
    }
  }

  async function join({ playerName, code }) {
    const cleanCode = String(code || "").toUpperCase().replace(/[^A-Z2-9]/g, "");
    emitConnection("joining");
    try {
      const data = await request(`/rooms/${encodeURIComponent(cleanCode)}/join`, {
        method: "POST",
        body: JSON.stringify({ playerName }),
      });
      return acceptSession(data, playerName);
    } catch (error) {
      emitConnection("idle");
      emitError(error.message, "目前無法加入房間，請稍後再試。 ");
      throw error;
    }
  }

  function resume(code) {
    const saved = loadSession(code);
    if (!saved) return false;
    roomCode = saved.roomCode;
    token = saved.token;
    room = null;
    connect();
    return true;
  }

  function send(type, payload = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN || !room) {
      emitError("NETWORK_UNAVAILABLE", "尚未接上房間，請稍候。 ");
      return false;
    }
    socket.send(JSON.stringify({
      type,
      ...payload,
      version: room.version,
      actionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    }));
    return true;
  }

  function leave(options = {}) {
    const activeSocket = socket;
    const activeRoom = room;
    const activeCode = roomCode;
    const activeToken = token;
    intentionalClose = true;
    clearReconnectTimer();
    if (activeSocket?.readyState === WebSocket.OPEN && activeRoom) {
      activeSocket.send(JSON.stringify({
        type: "leave",
        version: activeRoom.version,
        actionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
      }));
    }
    if (activeCode && activeToken) {
      void request(`/rooms/${encodeURIComponent(activeCode)}/leave`, {
        method: "POST",
        body: JSON.stringify({ token: activeToken }),
        keepalive: true,
      }).catch(() => {});
    }
    if (activeSocket) {
      window.setTimeout(() => activeSocket.close(1000, "Left room"), 160);
    }
    socket = null;
    if (options.forget !== false) forgetSession(activeCode);
    room = null;
    token = "";
    roomCode = "";
    reconnectAttempts = 0;
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    window.history.replaceState({}, "", url);
    emitConnection("idle");
  }

  async function copyInvite() {
    if (!roomCode) return false;
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomCode);
    try {
      await navigator.clipboard.writeText(url.toString());
      return true;
    } catch (_) {
      return false;
    }
  }

  return {
    apiBase: API_BASE,
    init(nextHandlers) {
      handlers = { ...handlers, ...(nextHandlers || {}) };
    },
    create,
    join,
    resume,
    ready(ready = true) {
      return send("ready", { ready });
    },
    flip(index) {
      return send("flip", { index });
    },
    leave,
    copyInvite,
    getRoom() {
      return room;
    },
    loadSession,
  };
})();
