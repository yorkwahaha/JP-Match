/**
 * 批次產生動漫題目 Google TTS 音檔（走 JPAPP proxy）
 * 用法：node scripts/gen-anime-audio.js
 * 只更新經典聲線；活力聲線由 gen-fish-word-audio.mjs --dataset=anime 產生。
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const ORIGIN = "https://yorkwahaha.github.io";
const SESSION_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/session";
const TTS_URL = "https://jpapp-tts-proxy.yorkwahaha.workers.dev/tts";
const VOICE = "ja-JP-Neural2-B";
const OUT_DIR = path.join("assets", "audio", "anime");
const DELAY_MS = 2200;
const MAX_RATE_RETRIES = 5;
const FORCE = process.argv.includes("--force");
const keysArg = process.argv.find((arg) => arg.startsWith("--keys="));
const REQUESTED_KEYS = new Set(
  keysArg
    ? keysArg
        .slice("--keys=".length)
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean)
    : [],
);

function loadEntries() {
  const src = fs.readFileSync(path.join("js", "anime.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.JPMatchAnime.ENTRIES;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isMp3(buffer) {
  if (!buffer || buffer.length < 4) return false;
  if (buffer.subarray(0, 3).toString("ascii") === "ID3") return true;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
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
    const parsedRetry = Number(res.headers.get("Retry-After") || "20");
    const retry = Number.isFinite(parsedRetry) ? parsedRetry : 20;
    return { kind: "rate", retry: Math.min(60, Math.max(5, retry)) };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { kind: "error", status: res.status, body: body.slice(0, 120) };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!isMp3(buf)) {
    return { kind: "error", status: "invalid-audio", body: "response is not an MP3" };
  }
  return { kind: "ok", buf: buf };
}

async function main() {
  const entries = loadEntries();
  const unique = [];
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.key)) continue;
    seen.add(entry.key);
    unique.push(entry);
  }

  if (REQUESTED_KEYS.size) {
    const knownKeys = new Set(unique.map((entry) => entry.key));
    const unknownKeys = [...REQUESTED_KEYS].filter((key) => !knownKeys.has(key));
    if (unknownKeys.length) throw new Error("unknown keys: " + unknownKeys.join(", "));
  }

  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "jp-match-anime-audio-"));
  let tokenData = null;
  let done = 0;
  let skipped = 0;

  try {
    for (const entry of unique) {
      const currentPath = path.join(OUT_DIR, entry.key + ".mp3");
      const stagedPath = path.join(stagingDir, entry.key + ".mp3");
      const shouldGenerate =
        (!REQUESTED_KEYS.size || REQUESTED_KEYS.has(entry.key)) &&
        (FORCE || !fs.existsSync(currentPath) || !isMp3(fs.readFileSync(currentPath)));
      if (!shouldGenerate && fs.existsSync(currentPath) && isMp3(fs.readFileSync(currentPath))) {
        fs.copyFileSync(currentPath, stagedPath);
        skipped += 1;
        process.stdout.write("skip " + entry.key + "\n");
        continue;
      }

      const text = entry.tts || entry.hira;
      let attempt = 0;
      while (true) {
        if (!tokenData || tokenData.exp < Date.now() + 5000) {
          tokenData = await getToken();
        }
        process.stdout.write("gen " + entry.key + " (" + text + ") ... ");
        const result = await fetchMp3(tokenData.token, text);
        if (result.kind === "ok") {
          fs.writeFileSync(stagedPath, result.buf);
          console.log(result.buf.length + " bytes");
          done += 1;
          break;
        }
        if (result.kind === "auth") {
          tokenData = await getToken();
          attempt += 1;
          if (attempt > MAX_RATE_RETRIES) throw new Error("auth failed for " + entry.key);
          continue;
        }
        if (result.kind === "rate") {
          attempt += 1;
          if (attempt > MAX_RATE_RETRIES) throw new Error("rate limited for " + entry.key);
          console.log("rate-limit, wait " + result.retry + "s");
          await sleep(result.retry * 1000);
          continue;
        }
        throw new Error("tts " + entry.key + " " + result.status + " " + (result.body || ""));
      }
      await sleep(DELAY_MS);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const expectedFiles = new Set(unique.map((entry) => entry.key + ".mp3"));
    for (const entry of unique) {
      fs.copyFileSync(
        path.join(stagingDir, entry.key + ".mp3"),
        path.join(OUT_DIR, entry.key + ".mp3"),
      );
    }
    for (const filename of fs.readdirSync(OUT_DIR)) {
      if (filename.endsWith(".mp3") && !expectedFiles.has(filename)) {
        fs.unlinkSync(path.join(OUT_DIR, filename));
      }
    }

    console.log("done generated=" + done + " skipped=" + skipped + " total=" + unique.length);
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
