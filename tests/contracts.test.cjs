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
  for (const filename of ["js/kana.js", "js/words.js"]) {
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

test("all kana and word deck modes preserve pair invariants", () => {
  const { JPMatchData: kana, JPMatchWords: words } = loadData();
  for (let iteration = 0; iteration < 25; iteration += 1) {
    for (const mode of Object.keys(kana.PAIR_MODES)) {
      assertDeck(kana.buildDeck(mode, 25, { fromRow: "a", toRow: "pya" }), 25);
    }
    for (const mode of Object.keys(words.PAIR_MODES)) {
      assertDeck(words.buildDeck(mode, 25, { category: "all" }), 25);
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
  const actionPins = [...workflow.matchAll(/uses:\s+[^\s]+@([a-f0-9]{40})/g)];
  assert.equal(actionPins.length, 5);
});
