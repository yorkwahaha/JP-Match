const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadWords() {
  const context = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, "js/words.js"), "utf8"),
    context,
    { filename: "js/words.js" }
  );
  return context.window.JPMatchWords;
}

test("audio-pic pairs one blank audio card with one picture card", () => {
  const words = loadWords();
  const deck = words.buildDeck("audio-pic", 6, { category: "animals" });
  const entries = new Map(words.WORDS.map((entry) => [entry.key, entry]));
  assert.equal(deck.length, 12);

  const pairs = new Map();
  for (const card of deck) {
    const cards = pairs.get(card.pairKey) || [];
    cards.push(card);
    pairs.set(card.pairKey, cards);
  }

  assert.equal(pairs.size, 6);
  for (const cards of pairs.values()) {
    assert.deepEqual(
      cards.map((card) => card.side).sort(),
      ["audio", "pic"]
    );

    const audioCard = cards.find((card) => card.side === "audio");
    const pictureCard = cards.find((card) => card.side === "pic");
    const entry = entries.get(audioCard.pairKey);
    assert.equal(audioCard.text, "");
    assert.equal(audioCard.kindLabel, "純聲音卡");
    assert.equal(audioCard.display, "text");
    assert.equal(audioCard.voiceKey, entry.key);
    assert.equal(audioCard.voiceText, entry.hira);
    assert.equal(pictureCard.text, entry.pic);
    assert.equal(pictureCard.kindLabel, "圖片");
    assert.ok(["pic", "symbol", "img"].includes(pictureCard.display));
    assert.equal(pictureCard.voiceKey, audioCard.voiceKey);
  }
});
