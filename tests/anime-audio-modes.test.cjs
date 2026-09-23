const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadAnime() {
  const context = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, "js/anime.js"), "utf8"),
    context,
    { filename: "js/anime.js" },
  );
  return context.window.JPMatchAnime;
}

function pairsByKey(deck) {
  const pairs = new Map();
  for (const card of deck) {
    const cards = pairs.get(card.pairKey) || [];
    cards.push(card);
    pairs.set(card.pairKey, cards);
  }
  return pairs;
}

test("Dragon Ball kana uses katakana except the Son family readings", () => {
  const anime = loadAnime();
  const entries = anime.ENTRIES.filter((entry) => entry.series === "db");
  const sonFamily = new Set(["db_goku", "db_gohan", "db_goten"]);
  assert.equal(entries.length, 30);
  for (const entry of entries) {
    if (sonFamily.has(entry.key)) {
      assert.match(entry.hira, /^[ぁ-ゖー]+$/, entry.key);
    } else {
      assert.match(entry.hira, /^[ァ-ヺー・]+$/, entry.key);
    }
  }
  assert.equal(entries.find((entry) => entry.key === "db_chaozu").hira, "チャオズ");
  assert.equal(entries.find((entry) => entry.key === "db_shenron").hira, "シェンロン");
});

test("all documented anime series are visible and have a playable pool", () => {
  const anime = loadAnime();
  assert.equal(
    anime.SERIES.map((series) => series.id).join(","),
    "jjk,db,frieren,op",
  );
  for (const series of anime.SERIES) {
    assert.ok(anime.getEntriesInSeries(series.id).length >= 25, `${series.id} needs >= 25 entries`);
  }
});

test("anime audio-picture mode pairs a blank audio card with an image", () => {
  const anime = loadAnime();
  const deck = anime.buildDeck("audio-pic", 6, { series: "db" });
  const entries = new Map(anime.ENTRIES.map((entry) => [entry.key, entry]));
  assert.equal(deck.length, 12);
  for (const cards of pairsByKey(deck).values()) {
    assert.deepEqual(
      cards.map((card) => card.side).sort(),
      ["audio", "pic"],
    );
    const audioCard = cards.find((card) => card.side === "audio");
    const pictureCard = cards.find((card) => card.side === "pic");
    const entry = entries.get(audioCard.pairKey);
    assert.equal(audioCard.text, "");
    assert.equal(audioCard.kindLabel, "純聲音卡");
    assert.equal(audioCard.display, "text");
    assert.equal(audioCard.voiceKey, entry.key);
    assert.equal(audioCard.voicePack, "anime");
    assert.equal(audioCard.voiceText, entry.tts || entry.hira);
    assert.equal(audioCard.matchLabel, entry.hira);
    assert.equal(pictureCard.text, entry.pic);
    assert.equal(pictureCard.kindLabel, "圖片");
    assert.equal(pictureCard.display, "img");
  }
});

test("anime audio-text mode pairs a blank audio card with the written name", () => {
  const anime = loadAnime();
  const deck = anime.buildDeck("audio-text", 6, { series: "db" });
  const entries = new Map(anime.ENTRIES.map((entry) => [entry.key, entry]));
  assert.equal(deck.length, 12);
  for (const cards of pairsByKey(deck).values()) {
    assert.deepEqual(
      cards.map((card) => card.side).sort(),
      ["audio", "kanji"],
    );
    const audioCard = cards.find((card) => card.side === "audio");
    const textCard = cards.find((card) => card.side === "kanji");
    const entry = entries.get(audioCard.pairKey);
    assert.equal(audioCard.text, "");
    assert.equal(audioCard.voiceKey, entry.key);
    assert.equal(audioCard.voicePack, "anime");
    assert.equal(audioCard.matchLabel, entry.hira);
    assert.equal(textCard.text, entry.kanji);
    assert.equal(textCard.kindLabel, "文字");
    assert.equal(textCard.display, "text");
    assert.equal(textCard.voiceKey, audioCard.voiceKey);
  }
});
