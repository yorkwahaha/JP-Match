import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../js/online.js", import.meta.url), "utf8");

function harness() {
  const sockets = [];
  const timers = new Map();
  let timerId = 0;

  class FakeWebSocket {
    static OPEN = 1;

    constructor(url) {
      this.url = url;
      this.readyState = 0;
      this.listeners = new Map();
      this.sent = [];
      sockets.push(this);
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }

    emit(type, event = {}) {
      if (type === "open") this.readyState = FakeWebSocket.OPEN;
      for (const listener of this.listeners.get(type) || []) listener(event);
    }

    send(payload) {
      this.sent.push(JSON.parse(payload));
    }

    close() {
      this.readyState = 3;
    }
  }

  const localStorage = new Map([
    ["jp-match-online-session:AB2C3D", JSON.stringify({ roomCode: "AB2C3D", token: "host-token", playerName: "Host" })],
  ]);
  const location = new URL("https://example.test/?room=AB2C3D");
  const window = {
    location,
    history: { replaceState() {} },
    localStorage: {
      getItem: (key) => localStorage.get(key) || null,
      setItem: (key, value) => localStorage.set(key, value),
      removeItem: (key) => localStorage.delete(key),
    },
    setTimeout(callback, delay) {
      timerId += 1;
      timers.set(timerId, { callback, delay });
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  const context = vm.createContext({
    URL,
    WebSocket: FakeWebSocket,
    document: { querySelector: () => ({ content: "https://api.example.test" }) },
    fetch: async () => { throw new Error("not used"); },
    navigator: { clipboard: { writeText: async () => {} } },
    window,
  });
  vm.runInContext(source, context);

  return {
    online: window.JPMatchOnline,
    sockets,
    runTimer(delay) {
      const match = [...timers.entries()].find(([, timer]) => timer.delay === delay);
      assert.ok(match, `missing ${delay}ms timer`);
      timers.delete(match[0]);
      match[1].callback();
    },
  };
}

test("a stale socket close cannot discard the current connection", () => {
  const { online, sockets } = harness();
  online.resume("AB2C3D");
  online.resume("AB2C3D");
  assert.equal(sockets.length, 2);

  sockets[0].emit("close", { code: 4001, reason: "superseded" });
  sockets[1].emit("open");
  sockets[1].emit("message", {
    data: JSON.stringify({
      type: "state",
      room: { roomCode: "AB2C3D", version: 2, players: [{ connected: true }, null] },
    }),
  });

  assert.equal(online.ready(true), true);
  assert.deepEqual(sockets[1].sent.map((message) => message.type), ["sync", "ready"]);
});

test("a websocket error without close schedules a replacement connection", () => {
  const { online, sockets, runTimer } = harness();
  online.resume("AB2C3D");
  sockets[0].emit("error");
  runTimer(250);
  runTimer(500);
  assert.equal(sockets.length, 2);
});
