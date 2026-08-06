import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const API_URL = "https://api.fish.audio/v1/tts";
const API_KEY = process.env.FISH_AUDIO_API_KEY;
const REFERENCE_ID = "962b6d7385574187bbf4b73bb1ec49f6";
const PACK_ID = "fish-962b6d73";
const modelArg = process.argv.find((arg) => arg.startsWith("--model="));
const MODEL = modelArg ? modelArg.slice("--model=".length) : "s2.1-pro-free";
const outDirArg = process.argv.find((arg) => arg.startsWith("--out-dir="));
const OUT_DIR = outDirArg
  ? path.resolve(outDirArg.slice("--out-dir=".length))
  : path.join("assets", "audio", "word-voices", PACK_ID);
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
const FORCE = process.argv.includes("--force");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 1) : Infinity;
const DELAY_MS = 750;
const MAX_RETRIES = 4;

if (!API_KEY) throw new Error("FISH_AUDIO_API_KEY is not set");

function loadWords() {
  const source = fs.readFileSync(path.join("js", "words.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.JPMatchWords.WORDS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMp3(buffer) {
  if (!buffer || buffer.length < 1_000) return false;
  const hasId3 = buffer.subarray(0, 3).toString("ascii") === "ID3";
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  return hasId3 || hasFrameSync;
}

function hasValidExistingFile(filename) {
  if (!fs.existsSync(filename)) return false;
  try {
    const file = fs.readFileSync(filename);
    return isMp3(file);
  } catch {
    return false;
  }
}

function retryDelayMs(response, attempt) {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter && /^\d+(\.\d+)?$/.test(retryAfter)) {
    return Math.max(1_000, Number(retryAfter) * 1_000);
  }
  return Math.min(30_000, 2_000 * 2 ** attempt);
}

async function synthesize(text) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    let response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          model: MODEL,
        },
        body: JSON.stringify({
          text,
          reference_id: REFERENCE_ID,
          format: "mp3",
          sample_rate: 44100,
          mp3_bitrate: 128,
          latency: "normal",
          normalize: true,
          temperature: 0.2,
          top_p: 0.5,
          max_new_tokens: 128,
          repetition_penalty: 1.4,
          min_chunk_length: 0,
          condition_on_previous_chunks: false,
          early_stop_threshold: 0.8,
          prosody: {
            speed: 1,
            volume: 0,
            normalize_loudness: true,
          },
        }),
      });
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await sleep(2_000 * 2 ** attempt);
      continue;
    }

    if (response.ok) {
      const audio = Buffer.from(await response.arrayBuffer());
      if (!isMp3(audio)) throw new Error(`Unexpected MP3 response (${audio.length} bytes)`);
      return audio;
    }

    const detail = (await response.text()).slice(0, 300);
    if ([401, 402, 403].includes(response.status)) {
      throw new Error(`Fish Audio authorization ${response.status}: ${detail}`);
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Fish Audio ${response.status}: ${detail}`);
    }
    if (attempt === MAX_RETRIES - 1) {
      throw new Error(`Fish Audio ${response.status} after ${MAX_RETRIES} attempts: ${detail}`);
    }
    await sleep(retryDelayMs(response, attempt));
  }

  throw new Error("Fish Audio retry loop ended unexpectedly");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const words = loadWords();
const uniqueWords = [];
const seen = new Set();
for (const word of words) {
  if (!word.key || !word.hira || seen.has(word.key)) continue;
  seen.add(word.key);
  uniqueWords.push(word);
}

const pending = uniqueWords
  .filter((word) => !REQUESTED_KEYS.size || REQUESTED_KEYS.has(word.key))
  .filter((word) => FORCE || !hasValidExistingFile(path.join(OUT_DIR, `${word.key}.mp3`)))
  .slice(0, LIMIT);

if (REQUESTED_KEYS.size) {
  const knownKeys = new Set(uniqueWords.map((word) => word.key));
  const unknownKeys = [...REQUESTED_KEYS].filter((key) => !knownKeys.has(key));
  if (unknownKeys.length) throw new Error(`Unknown word keys: ${unknownKeys.join(", ")}`);
}

process.stdout.write(
  `pack=${PACK_ID} words=${uniqueWords.length} pending=${pending.length}${FORCE ? " force" : ""}\n`,
);

let completed = 0;
let failed = 0;
let consecutiveFailures = 0;
const generatedRecords = [];

for (let index = 0; index < pending.length; index += 1) {
  const word = pending[index];
  const destination = path.join(OUT_DIR, `${word.key}.mp3`);
  try {
    const spokenText = `${word.fishTts || word.tts || word.hira}。`;
    const audio = await synthesize(spokenText);
    fs.writeFileSync(destination, audio);
    generatedRecords.push({
      key: word.key,
      reading: word.hira,
      written: word.tts || word.hira,
      prompt: spokenText,
      filename: `${word.key}.mp3`,
      source: "generated-rerecord",
      bytes: audio.length,
      status: "ok",
    });
    completed += 1;
    consecutiveFailures = 0;
    process.stdout.write(
      `[${index + 1}/${pending.length}] ${word.key} ${spokenText} ${audio.length} bytes\n`,
    );
  } catch (error) {
    failed += 1;
    consecutiveFailures += 1;
    process.stderr.write(
      `[${index + 1}/${pending.length}] ${word.key} ${word.hira} FAIL ${error.message}\n`,
    );
    if (consecutiveFailures >= 3) {
      throw new Error("Stopped after three consecutive generation failures");
    }
  }
  if (index < pending.length - 1) await sleep(DELAY_MS);
}

const generatedFiles = fs
  .readdirSync(OUT_DIR)
  .filter((filename) => filename.endsWith(".mp3"))
  .sort();

const manifestPath = path.join(OUT_DIR, "pack.json");
let existingManifest = null;
try {
  existingManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch {}

const generatedByKey = new Map(generatedRecords.map((record) => [record.key, record]));
const manifest =
  existingManifest && Array.isArray(existingManifest.words)
    ? {
        ...existingManifest,
        model: MODEL,
        referenceId: REFERENCE_ID,
        generatedAt: new Date().toISOString(),
        words: existingManifest.words.map((record) => generatedByKey.get(record.key) || record),
      }
    : {
        id: PACK_ID,
        provider: "Fish Audio",
        model: MODEL,
        referenceId: REFERENCE_ID,
        generatedAt: new Date().toISOString(),
        expectedWords: uniqueWords.length,
        generatedFiles: generatedFiles.length,
      };

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

process.stdout.write(
  `done=${completed} failed=${failed} totalFiles=${generatedFiles.length} dir=${OUT_DIR}\n`,
);
if (failed > 0) process.exitCode = 1;
