const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadKana() {
  const context = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, "js/kana.js"), "utf8"),
    context,
    { filename: "js/kana.js" }
  );
  return context.window.JPMatchData;
}

for (const [modeId, visibleSide, visibleField] of [
  ["audio-hira", "hira", "hira"],
  ["audio-kata", "kata", "kata"],
]) {
  test(`${modeId} pairs one blank audio card with one visible kana card`, () => {
    const kana = loadKana();
    const deck = kana.buildDeck(modeId, 6, { fromRow: "a", toRow: "ka" });
    const entries = new Map(
      kana.getKanaInRange("a", "ka").map((entry) => [entry.key, entry])
    );
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
        ["audio", visibleSide].sort()
      );

      const audioCard = cards.find((card) => card.side === "audio");
      const kanaCard = cards.find((card) => card.side === visibleSide);
      assert.equal(audioCard.text, "");
      assert.equal(audioCard.kindLabel, "純聲音卡");
      assert.ok(audioCard.audioKey);
      assert.equal(kanaCard.text, entries.get(kanaCard.pairKey)[visibleField]);
      assert.equal(kanaCard.audioKey, audioCard.audioKey);
    }
  });
}
