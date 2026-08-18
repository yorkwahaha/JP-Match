const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function loadData() {
  const context = { window: {} };
  vm.createContext(context);
  for (const filename of ["js/kana.js", "js/words.js", "js/anime.js"]) {
    vm.runInContext(read(filename), context, { filename });
  }
  return context.window;
}

function assertDeck(deck, pairCount) {
  assert.equal(deck.length, pairCount * 2);
  const groups = new Map();
  for (const card of deck) {
    const group = groups.get(card.pairKey) || [];
    group.push(card);
    groups.set(card.pairKey, group);
  }
  assert.equal(groups.size, pairCount);
  for (const cards of groups.values()) {
    assert.equal(cards.length, 2);
    assert.notEqual(cards[0].side, cards[1].side);
  }
}

function listMp3(relativeDir) {
  return new Set(
    fs
      .readdirSync(path.join(ROOT, relativeDir))
      .filter((filename) => filename.endsWith(".mp3"))
      .map((filename) => path.basename(filename, ".mp3")),
  );
}

function assertValidMp3(relativePath) {
  const buffer = fs.readFileSync(path.join(ROOT, relativePath));
  const hasId3 = buffer.subarray(0, 3).toString("ascii") === "ID3";
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  assert.ok(buffer.length >= 500 && (hasId3 || hasFrameSync), relativePath);
}

function imageDimensions(relativePath) {
  const buffer = fs.readFileSync(path.join(ROOT, relativePath));
  if (buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF", relativePath);
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP", relativePath);
  for (let offset = 12; offset + 8 <= buffer.length; ) {
    const type = buffer.subarray(offset, offset + 4).toString("ascii");
    const length = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (type === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(payload + 4, 3),
        height: 1 + buffer.readUIntLE(payload + 7, 3),
      };
    }
    if (type === "VP8L") {
      const bits = buffer.readUInt32LE(payload + 1);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >> 14) & 0x3fff),
      };
    }
    if (type === "VP8 ") {
      return {
        width: buffer.readUInt16LE(payload + 6) & 0x3fff,
        height: buffer.readUInt16LE(payload + 8) & 0x3fff,
      };
    }
    offset = payload + length + (length % 2);
  }
  assert.fail(`unsupported WebP structure: ${relativePath}`);
}

test("all kana and word deck modes preserve pair invariants", () => {
  const { JPMatchData: kana, JPMatchWords: words, JPMatchAnime: anime } = loadData();
  for (let iteration = 0; iteration < 25; iteration += 1) {
    for (const mode of Object.keys(kana.PAIR_MODES)) {
      assertDeck(kana.buildDeck(mode, 25, { fromRow: "a", toRow: "pya" }), 25);
    }
    for (const mode of Object.keys(words.PAIR_MODES)) {
      assertDeck(words.buildDeck(mode, 25, { category: "all" }), 25);
    }
    for (const series of anime.SERIES.map((item) => item.id)) {
      for (const mode of Object.keys(anime.PAIR_MODES)) {
        assertDeck(anime.buildDeck(mode, 25, { series }), 25);
      }
    }
  }
});

test("HTML ids are unique and every game id reference exists", () => {
  const html = read("index.html");
  const game = read("js/game.js");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const refs = [...game.matchAll(/(?:getElementById\("|qs\("#)([^"]+)/g)].map(
    (match) => match[1],
  );
  for (const id of refs) assert.ok(ids.includes(id), id);
});

test("word, icon, voice pack, and manifest keys stay aligned", () => {
  const { JPMatchWords: wordsApi } = loadData();
  const words = wordsApi.WORDS;
  const keys = new Set(words.map((word) => word.key));
  assert.equal(keys.size, words.length);
  assert.ok(!keys.has("meggane"));
  assert.ok(keys.has("megane"));

  for (const word of words) {
    if (word.picKind === "img") {
      assert.ok(fs.existsSync(path.join(ROOT, word.pic)), word.pic);
    }
  }

  for (const dir of [
    "assets/audio/words",
    "assets/audio/word-voices/fish-962b6d73",
  ]) {
    assert.deepEqual(listMp3(dir), keys);
    for (const key of keys) assertValidMp3(path.join(dir, `${key}.mp3`));
  }

  const manifest = JSON.parse(
    read("assets/audio/word-voices/fish-962b6d73/pack.json"),
  );
  assert.equal(manifest.expectedWords, words.length);
  assert.equal(manifest.generatedFiles, words.length);
  assert.deepEqual(new Set(manifest.words.map((word) => word.key)), keys);
});

test("anime entries, icons, and voice packs stay aligned", () => {
  const { JPMatchAnime: animeApi } = loadData();
  const entries = animeApi.ENTRIES;
  const keys = new Set(entries.map((entry) => entry.key));
  const seriesIds = new Set(animeApi.SERIES.map((item) => item.id));
  assert.equal(keys.size, entries.length);
  assert.deepEqual([...seriesIds].sort(), ["db", "jjk"]);
  for (const seriesId of seriesIds) {
    const count = entries.filter((entry) => entry.series === seriesId).length;
    assert.ok(count >= 25, `${seriesId} needs >= 25 entries`);
  }
  assert.ok(entries.some((entry) => entry.series === "op"));

  for (const entry of entries) {
    assert.equal(entry.picKind, "img");
    assert.ok(fs.existsSync(path.join(ROOT, entry.pic)), entry.pic);
    const dimensions = imageDimensions(entry.pic);
    assert.ok(dimensions.width <= 512 && dimensions.height <= 512, entry.pic);
  }

  for (const dir of ["assets/audio/anime", "assets/audio/anime-voices/fish-962b6d73"]) {
    assert.deepEqual(listMp3(dir), keys);
    for (const key of keys) assertValidMp3(path.join(dir, `${key}.mp3`));
  }

  const manifest = JSON.parse(
    read("assets/audio/anime-voices/fish-962b6d73/pack.json"),
  );
  assert.equal(manifest.expectedEntries, entries.length);
  assert.equal(manifest.generatedFiles, entries.length);
  assert.equal(manifest.provider, "Fish Audio");
  assert.equal(manifest.model, "s2.1-pro-free");
  assert.equal(manifest.referenceId, "962b6d7385574187bbf4b73bb1ec49f6");
  assert.deepEqual(new Set(manifest.words.map((word) => word.key)), keys);
  for (const word of manifest.words) {
    const audioPath = path.join(
      ROOT,
      "assets/audio/anime-voices/fish-962b6d73",
      word.filename,
    );
    assert.equal(fs.statSync(audioPath).size, word.bytes, word.key);
  }
  const aka = entries.find((entry) => entry.key === "jjk_aka");
  const ao = entries.find((entry) => entry.key === "jjk_ao");
  assert.equal(aka.kanji, "赫");
  assert.equal(ao.kanji, "蒼");
  assert.match(manifest.words.find((word) => word.key === "jjk_aka").prompt, /赤/);
  assert.match(manifest.words.find((word) => word.key === "jjk_ao").prompt, /青/);
  for (const key of keys) {
    const classic = fs.readFileSync(path.join(ROOT, "assets/audio/anime", `${key}.mp3`));
    const lively = fs.readFileSync(
      path.join(ROOT, "assets/audio/anime-voices/fish-962b6d73", `${key}.mp3`),
    );
    assert.notDeepEqual(lively, classic, `${key} lively voice must not mirror classic audio`);
  }
});

test("every kana reading has one valid local audio file", () => {
  const { JPMatchData: kana } = loadData();
  const keys = new Set(
    kana.getKanaInRange("a", "pya").map((entry) => entry.romaji),
  );
  assert.deepEqual(listMp3("assets/audio/kana"), keys);
  for (const key of keys) assertValidMp3(path.join("assets/audio/kana", `${key}.mp3`));
});

test("CSS has no orphan custom properties or retired card furniture", () => {
  const css = read("css/styles.css");
  const declared = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
  const used = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]));
  assert.deepEqual([...declared].filter((name) => !used.has(name)), []);
  assert.deepEqual([...used].filter((name) => !declared.has(name)), []);
  assert.doesNotMatch(css, /card-corners|seal-char|match-out|pulse-turn|edge-pulse/);
  assert.doesNotMatch(read("js/game.js"), /card-corners|seal-char/);
});

test("runtime fixes keep matched cards inert and audio failures bounded", () => {
  const game = read("js/game.js");
  const audio = read("js/audio.js");
  const generator = read("scripts/gen-word-audio.js");
  assert.doesNotMatch(game, /else if \(card\.voiceText\)/);
  assert.match(game, /elA\.disabled = true/);
  assert.match(game, /elB\.disabled = true/);
  assert.match(audio, /MAX_VOICE_BUFFER_CACHE = 64/);
  assert.match(audio, /reportAudioIssue\("Cloud TTS request"/);
  assert.match(generator, /MAX_RATE_RETRIES = 5/);
  assert.match(generator, /function isMp3\(buffer\)/);
  assert.match(game, /card-face card-front" aria-hidden="true" hidden/);
  assert.match(game, /front\.hidden = !revealed/);
});

test("matched pair cords connect only the two cards", () => {
  const game = read("js/game.js");
  assert.doesNotMatch(game, /const edge[XY] =/);
  assert.doesNotMatch(game, /" M " \+ mx \+ " " \+ my/);
});

test("matched word labels stay complete", () => {
  const game = read("js/game.js");
  assert.doesNotMatch(game, /chars\.slice\(0, 3\)/);
  assert.match(game, /card\.matchLabel \|\|/);
  assert.match(game, /const text = String\(raw \|\| "結"\)/);
  assert.match(game, /wrapReadingLines\(text, 4\)/);
});

test("generator dependency and staging behavior are reproducible", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const generator = read("scripts/gen-home-stickers.js");
  assert.equal(pkg.dependencies["@resvg/resvg-js"], "2.6.2");
  assert.equal(lock.packages[""].dependencies["@resvg/resvg-js"], "2.6.2");
  assert.equal(lock.packages["node_modules/@resvg/resvg-js"].version, "2.6.2");
  assert.doesNotThrow(() => require.resolve("@resvg/resvg-js", { paths: [ROOT] }));
  assert.match(generator, /require\("@resvg\/resvg-js"\)/);
  assert.match(generator, /mkdtempSync/);
  assert.match(generator, /existing icons were preserved/);
  assert.doesNotMatch(generator, /_tmp-resvg\/node_modules/);
  const animeGenerator = read("scripts/gen-anime-audio.js");
  assert.match(animeGenerator, /mkdtempSync/);
  assert.match(animeGenerator, /stagingDir/);
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /gen-anime-jjk-icons/);
  assert.match(read(".gitignore"), /^audio-candidates\/$/m);
});

test("security policy and Pages workflow retain least privilege gates", () => {
  const html = read("index.html");
  const workflow = read(".github/workflows/pages.yml");
  const csp = html.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
  );
  assert.ok(csp);
  for (const directive of [
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]) {
    assert.match(csp[1], new RegExp(directive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(html, /<meta name="referrer" content="no-referrer" \/>/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /npm ci --ignore-scripts/);
  assert.match(workflow, /npm test/);
  assert.doesNotMatch(workflow, /uses:\s+[^\s]+@v\d/);
  assert.match(read("css/styles.css"), /@media \(prefers-reduced-motion: reduce\)/);
  const actionPins = [...workflow.matchAll(/uses:\s+[^\s]+@([a-f0-9]{40})/g)];
  assert.equal(actionPins.length, 5);
});

test("online room UI, transport, CSP, and Durable Object configuration stay connected", () => {
  const html = read("index.html");
  const game = read("js/game.js");
  const online = read("js/online.js");
  const worker = read("worker/src/index.mjs");
  const wrangler = read("worker/wrangler.jsonc");

  for (const id of [
    "room-screen",
    "online-name",
    "online-room-code",
    "btn-join-room",
    "btn-room-ready",
    "btn-copy-invite",
    "online-connection",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /https:\/\/jp-match-online\.yorkwahaha\.workers\.dev/);
  assert.match(html, /wss:\/\/jp-match-online\.yorkwahaha\.workers\.dev/);
  assert.match(html, /<script src="\.\/js\/online\.js/);
  assert.match(html, /css\/styles\.css\?v=kotoba-musubi-10/);
  assert.match(html, /js\/online\.js\?v=online-room-4/);
  assert.match(html, /js\/anime\.js\?v=anime-op-1/);
  assert.match(html, /js\/audio\.js\?v=anime-op-1/);
  assert.match(html, /js\/game\.js\?v=anime-op-1/);
  assert.match(game, /Online\.flip\(index\)/);
  assert.match(game, /Online\.resume\(invitedRoomCode\)/);
  assert.match(game, /對手已離開房間/);
  assert.match(online, /version: room\.version/);
  assert.match(online, /jp-match-online-session:/);
  assert.match(online, /type: "sync"/);
  assert.match(online, /socket !== currentSocket/);
  assert.match(online, /6000/);
  assert.match(online, /keepalive: true/);
  assert.match(worker, /acceptWebSocket\(server/);
  assert.match(worker, /serializeAttachment\(\{ seat \}\)/);
  assert.match(worker, /url\.pathname === "\/leave"/);
  assert.match(worker, /command\.type === "sync"/);
  assert.match(worker, /async alarm\(\)/);
  assert.match(wrangler, /"storage": "sqlite"/);
  assert.match(wrangler, /"ALLOWED_ORIGINS": "https:\/\/yorkwahaha\.github\.io/);
  assert.doesNotMatch(wrangler, /"ALLOWED_ORIGINS": "\*"/);
});
