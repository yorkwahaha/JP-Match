/**
 * 批次產生單字 Google TTS 音檔（走 JPAPP proxy）
 * 用法：node scripts/gen-word-audio.js
 * 限流：proxy 每分鐘約 30 次，本腳本預設間隔 2.2 秒
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ORIGIN = "https://yorkwahaha.github.io";
const SESSION_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/session";
const TTS_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/tts";
const VOICE = "ja-JP-Neural2-B";
const OUT_DIR = path.join("assets", "audio", "words");
const DELAY_MS = 2200;
const FORCE = process.argv.includes("--force");

function loadWords() {
  const src = fs.readFileSync(path.join("js", "words.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.JPMatchWords.WORDS;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getToken() {
  const res = await fetch(SESSION_URL, { headers: { Origin: ORIGIN } });
  if (!res.ok) throw new Error("session " + res.status);
  const data = await res.json();
  return data;
}

async function fetchMp3(token, text) {
  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "X-Session-Token": token,
    },
    body: JSON.stringify({
      text: text,
      voice: VOICE,
      rate: "1.0",
      pitch: "default",
    }),
  });
  if (res.status === 401) return { kind: "auth" };
  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After") || "20");
    return { kind: "rate", retry: Math.max(5, retry) };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { kind: "error", status: res.status, body: body.slice(0, 120) };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { kind: "ok", buf: buf };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const words = loadWords();
  const unique = [];
  const seen = new Set();
  words.forEach((w) => {
    if (!w.key || !w.hira || seen.has(w.key)) return;
    seen.add(w.key);
    unique.push(w);
  });

  const todo = unique.filter((w) => {
    const dest = path.join(OUT_DIR, w.key + ".mp3");
    return FORCE || !fs.existsSync(dest) || fs.statSync(dest).size < 500;
  });

  console.log(
    "words:",
    unique.length,
    "to generate:",
    todo.length,
    FORCE ? "(force)" : "(skip existing)"
  );

  let session = await getToken();
  let done = 0;
  let fail = 0;

  for (let i = 0; i < todo.length; i++) {
    const w = todo[i];
    const dest = path.join(OUT_DIR, w.key + ".mp3");
    process.stdout.write(
      "[" + (i + 1) + "/" + todo.length + "] " + w.key + " " + w.hira + " ... "
    );

    if (session.exp < Date.now() + 15000) {
      session = await getToken();
    }

    let result = await fetchMp3(session.token, w.hira);
    if (result.kind === "auth") {
      session = await getToken();
      result = await fetchMp3(session.token, w.hira);
    }
    while (result.kind === "rate") {
      console.log("rate-limited, wait " + result.retry + "s");
      await sleep(result.retry * 1000 + 500);
      result = await fetchMp3(session.token, w.hira);
    }

    if (result.kind !== "ok") {
      fail += 1;
      console.log("FAIL", result.status || result.kind, result.body || "");
      await sleep(DELAY_MS);
      continue;
    }

    fs.writeFileSync(dest, result.buf);
    done += 1;
    console.log(result.buf.length + " bytes");
    if (i < todo.length - 1) await sleep(DELAY_MS);
  }

  console.log("done:", done, "fail:", fail, "dir:", OUT_DIR);
  if (fail) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
