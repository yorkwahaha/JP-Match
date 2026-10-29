const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const game = fs.readFileSync(path.join(ROOT, "js/game.js"), "utf8");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

function extractFunction(name) {
  const start = game.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  let depth = 0;
  for (let index = game.indexOf("{", start); index < game.length; index += 1) {
    if (game[index] === "{") depth += 1;
    if (game[index] === "}") {
      depth -= 1;
      if (depth === 0) return game.slice(start, index + 1);
    }
  }
  throw new Error("unterminated " + name);
}

test("pasting a full invite link into the room field keeps the room code", () => {
  const context = { URL };
  vm.runInNewContext(extractFunction("extractRoomCode") + "; this.extractRoomCode = extractRoomCode;", context);
  const { extractRoomCode } = context;
  assert.equal(extractRoomCode("https://yorkwahaha.github.io/jp-match/?room=AB2C3D"), "AB2C3D");
  assert.equal(extractRoomCode("http://192.168.1.20:5173/?kind=words&room=xy9z8w"), "XY9Z8W");
  assert.equal(extractRoomCode("ab2c3d"), "AB2C3D");
  assert.equal(extractRoomCode("AB 2C 3D"), "AB2C3D");
  const input = /<input id="online-room-code"[^>]*>/.exec(html)[0];
  assert.doesNotMatch(input, /maxlength="6"/);
});

test("online create/join locks the play-mode buttons and late room states respect the chosen mode", () => {
  assert.match(game, /btn\.disabled = configuringRematch \|\| state\.onlineRequestPending/);
  assert.match(extractFunction("handleOnlineState"), /state\.playMode !== "online"[\s\S]*Online\.leave\(\)/);
  assert.match(extractFunction("initializeOnlineGame"), /state\.playMode = "online"/);
});

test("leaving a local game invalidates pending match and mismatch callbacks", () => {
  const abandon = extractFunction("abandonLocalGame");
  assert.match(abandon, /state\.runId \+= 1/);
  assert.match(abandon, /clearMismatchTimer\(\)/);
  assert.match(abandon, /state\.pendingClose = \[\]/);
  assert.equal((game.match(/abandonLocalGame\(\);/g) || []).length, 2);
  assert.match(extractFunction("leaveOnlineRoom"), /clearOnlineResultTimer\(\)/);
});

test("an opponent whose seat is released mid-round gets an explicit notice", () => {
  const handler = extractFunction("handleOnlineState");
  assert.match(handler, /previous\.phase === "playing"/);
  assert.match(handler, /!snapshot\.players\?\.\[opponentSeat\]/);
});

test("audio menu settings persist across reloads", () => {
  assert.match(game, /AUDIO_STORAGE_KEY = "jp-match-audio"/);
  assert.match(extractFunction("syncAudioSettings"), /localStorage\.setItem\(\s*AUDIO_STORAGE_KEY/);
  assert.match(game, /restoreAudioSettings\(\);\s*syncAudioSettings\(\);/);
});
