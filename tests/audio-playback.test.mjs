import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../js/audio.js", import.meta.url), "utf8");

function harness() {
  const audios = [];
  const ttsCalls = [];
  class FakeAudio {
    constructor(src = "") {
      this.src = src;
      this.paused = true;
      this.volume = 1;
      this.dataset = {};
      this.onerror = null;
      this.rejectPlay = null;
      audios.push(this);
    }
    play() {
      this.paused = false;
      return new Promise((resolve, reject) => {
        this.rejectPlay = reject;
      });
    }
    pause() {
      this.paused = true;
    }
    load() {}
    removeAttribute(name) {
      if (name === "src") this.src = "";
    }
  }
  const listeners = {};
  const window = {
    addEventListener() {},
    speechSynthesis: { cancel() {}, speak() {} },
  };
  const context = vm.createContext({
    window,
    document: { hidden: false, addEventListener: (type, fn) => (listeners[type] = fn) },
    Audio: FakeAudio,
    URL,
    console: { warn() {}, error() {}, log() {} },
    fetch: async (url) => {
      ttsCalls.push(String(url));
      throw new Error("offline");
    },
  });
  vm.runInContext(source, context);
  const sound = window.JPMatchAudio;
  const readingAudio = () => audios.find((audio) => /\/kana\//.test(audio.src) || audio.isReading);
  return { sound, audios, ttsCalls, readingAudio };
}

function abortError() {
  const error = new Error("The play() request was interrupted");
  error.name = "AbortError";
  return error;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("a stale kana play() abort cannot trigger cloud TTS over the next card", async () => {
  const { sound, audios, ttsCalls } = harness();
  const baseline = ttsCalls.length;
  sound.playKana("a", "あ");
  const el = audios.find((audio) => audio.src.endsWith("/kana/a.mp3"));
  const firstReject = el.rejectPlay;
  sound.playKana("ka", "か");
  assert.ok(el.src.endsWith("/kana/ka.mp3"));
  firstReject(abortError());
  await flush();
  assert.equal(ttsCalls.length, baseline, "old card must not fall back to TTS");
  assert.ok(el.src.endsWith("/kana/ka.mp3"), "second card keeps playing");
});

test("a missing kana file falls back to TTS exactly once", async () => {
  const { sound, audios, ttsCalls } = harness();
  const baseline = ttsCalls.length;
  sound.playKana("a", "あ");
  const el = audios.find((audio) => audio.src.endsWith("/kana/a.mp3"));
  const onerror = el.onerror;
  const reject = el.rejectPlay;
  onerror({ type: "error" });
  const notSupported = new Error("no source");
  notSupported.name = "NotSupportedError";
  reject(notSupported);
  await flush();
  await flush();
  const sessionCalls = ttsCalls.slice(baseline).filter((url) => url.endsWith("/session"));
  assert.equal(sessionCalls.length, 1);
});

test("turning BGM on mid-game starts the first track; on the setup screen it stays silent", () => {
  const { sound, audios } = harness();
  sound.setBgm(false);
  sound.startBgm();
  const before = audios.filter((audio) => audio.loop).length;
  assert.equal(before, 0, "no BGM element while BGM is off");
  sound.setBgm(true);
  const bgm = audios.find((audio) => audio.loop);
  assert.ok(bgm, "enabling BGM during a game creates and plays a track");
  assert.equal(bgm.paused, false);

  const other = harness();
  other.sound.setBgm(true);
  assert.equal(other.audios.some((audio) => audio.loop), false, "setup screen toggle does not start music");
  other.sound.startBgm();
  other.sound.stopBgm();
  other.sound.setBgm(true);
  assert.equal(other.audios.find((audio) => audio.loop).paused, true, "after leaving the game it stays stopped");
});
