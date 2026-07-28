/**
 * 五十音資料（清音＋濁音＋半濁音）
 */
window.JPMatchData = (() => {
  const KANA = [
    { key: "a", romaji: "a", hira: "あ", kata: "ア" },
    { key: "i", romaji: "i", hira: "い", kata: "イ" },
    { key: "u", romaji: "u", hira: "う", kata: "ウ" },
    { key: "e", romaji: "e", hira: "え", kata: "エ" },
    { key: "o", romaji: "o", hira: "お", kata: "オ" },
    { key: "ka", romaji: "ka", hira: "か", kata: "カ" },
    { key: "ki", romaji: "ki", hira: "き", kata: "キ" },
    { key: "ku", romaji: "ku", hira: "く", kata: "ク" },
    { key: "ke", romaji: "ke", hira: "け", kata: "ケ" },
    { key: "ko", romaji: "ko", hira: "こ", kata: "コ" },
    { key: "sa", romaji: "sa", hira: "さ", kata: "サ" },
    { key: "shi", romaji: "shi", hira: "し", kata: "シ" },
    { key: "su", romaji: "su", hira: "す", kata: "ス" },
    { key: "se", romaji: "se", hira: "せ", kata: "セ" },
    { key: "so", romaji: "so", hira: "そ", kata: "ソ" },
    { key: "ta", romaji: "ta", hira: "た", kata: "タ" },
    { key: "chi", romaji: "chi", hira: "ち", kata: "チ" },
    { key: "tsu", romaji: "tsu", hira: "つ", kata: "ツ" },
    { key: "te", romaji: "te", hira: "て", kata: "テ" },
    { key: "to", romaji: "to", hira: "と", kata: "ト" },
    { key: "na", romaji: "na", hira: "な", kata: "ナ" },
    { key: "ni", romaji: "ni", hira: "に", kata: "ニ" },
    { key: "nu", romaji: "nu", hira: "ぬ", kata: "ヌ" },
    { key: "ne", romaji: "ne", hira: "ね", kata: "ネ" },
    { key: "no", romaji: "no", hira: "の", kata: "ノ" },
    { key: "ha", romaji: "ha", hira: "は", kata: "ハ" },
    { key: "hi", romaji: "hi", hira: "ひ", kata: "ヒ" },
    { key: "fu", romaji: "fu", hira: "ふ", kata: "フ" },
    { key: "he", romaji: "he", hira: "へ", kata: "ヘ" },
    { key: "ho", romaji: "ho", hira: "ほ", kata: "ホ" },
    { key: "ma", romaji: "ma", hira: "ま", kata: "マ" },
    { key: "mi", romaji: "mi", hira: "み", kata: "ミ" },
    { key: "mu", romaji: "mu", hira: "む", kata: "ム" },
    { key: "me", romaji: "me", hira: "め", kata: "メ" },
    { key: "mo", romaji: "mo", hira: "も", kata: "モ" },
    { key: "ya", romaji: "ya", hira: "や", kata: "ヤ" },
    { key: "yu", romaji: "yu", hira: "ゆ", kata: "ユ" },
    { key: "yo", romaji: "yo", hira: "よ", kata: "ヨ" },
    { key: "ra", romaji: "ra", hira: "ら", kata: "ラ" },
    { key: "ri", romaji: "ri", hira: "り", kata: "リ" },
    { key: "ru", romaji: "ru", hira: "る", kata: "ル" },
    { key: "re", romaji: "re", hira: "れ", kata: "レ" },
    { key: "ro", romaji: "ro", hira: "ろ", kata: "ロ" },
    { key: "wa", romaji: "wa", hira: "わ", kata: "ワ" },
    { key: "wo", romaji: "wo", hira: "を", kata: "ヲ" },
    { key: "n", romaji: "n", hira: "ん", kata: "ン" },
    { key: "ga", romaji: "ga", hira: "が", kata: "ガ" },
    { key: "gi", romaji: "gi", hira: "ぎ", kata: "ギ" },
    { key: "gu", romaji: "gu", hira: "ぐ", kata: "グ" },
    { key: "ge", romaji: "ge", hira: "げ", kata: "ゲ" },
    { key: "go", romaji: "go", hira: "ご", kata: "ゴ" },
    { key: "za", romaji: "za", hira: "ざ", kata: "ザ" },
    { key: "ji", romaji: "ji", hira: "じ", kata: "ジ" },
    { key: "zu", romaji: "zu", hira: "ず", kata: "ズ" },
    { key: "ze", romaji: "ze", hira: "ぜ", kata: "ゼ" },
    { key: "zo", romaji: "zo", hira: "ぞ", kata: "ゾ" },
    { key: "da", romaji: "da", hira: "だ", kata: "ダ" },
    { key: "di", romaji: "ji", hira: "ぢ", kata: "ヂ" },
    { key: "du", romaji: "zu", hira: "づ", kata: "ヅ" },
    { key: "de", romaji: "de", hira: "で", kata: "デ" },
    { key: "do", romaji: "do", hira: "ど", kata: "ド" },
    { key: "ba", romaji: "ba", hira: "ば", kata: "バ" },
    { key: "bi", romaji: "bi", hira: "び", kata: "ビ" },
    { key: "bu", romaji: "bu", hira: "ぶ", kata: "ブ" },
    { key: "be", romaji: "be", hira: "べ", kata: "ベ" },
    { key: "bo", romaji: "bo", hira: "ぼ", kata: "ボ" },
    { key: "pa", romaji: "pa", hira: "ぱ", kata: "パ" },
    { key: "pi", romaji: "pi", hira: "ぴ", kata: "ピ" },
    { key: "pu", romaji: "pu", hira: "ぷ", kata: "プ" },
    { key: "pe", romaji: "pe", hira: "ぺ", kata: "ペ" },
    { key: "po", romaji: "po", hira: "ぽ", kata: "ポ" },
  ];

  const PAIR_MODES = {
    "romaji-hira": {
      id: "romaji-hira",
      label: "羅馬拼音 ↔ 平假名",
      sides: ["romaji", "hira"],
      sideLabels: { romaji: "羅馬拼音", hira: "平假名" },
    },
    "hira-kata": {
      id: "hira-kata",
      label: "平假名 ↔ 片假名",
      sides: ["hira", "kata"],
      sideLabels: { hira: "平假名", kata: "片假名" },
    },
    "romaji-kata": {
      id: "romaji-kata",
      label: "羅馬拼音 ↔ 片假名",
      sides: ["romaji", "kata"],
      sideLabels: { romaji: "羅馬拼音", kata: "片假名" },
    },
  };

  const GRID_PRESETS = [
    { id: "4x3", cols: 4, rows: 3, label: "4×3（6 組）" },
    { id: "4x4", cols: 4, rows: 4, label: "4×4（8 組）" },
    { id: "6x4", cols: 6, rows: 4, label: "6×4（12 組）" },
    { id: "8x4", cols: 8, rows: 4, label: "8×4（16 組）" },
    { id: "8x5", cols: 8, rows: 5, label: "8×5（20 組）" },
    { id: "10x5", cols: 10, rows: 5, label: "10×5（25 組）" },
  ];

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function buildDeck(pairModeId, pairCount) {
    const mode = PAIR_MODES[pairModeId];
    if (!mode) throw new Error("未知配對模式：" + pairModeId);

    const count = Math.min(Math.max(1, pairCount), KANA.length);
    const selected = shuffle(KANA).slice(0, count);
    const sideA = mode.sides[0];
    const sideB = mode.sides[1];

    const cards = [];
    selected.forEach((kana) => {
      cards.push({
        id: kana.key + "-" + sideA,
        pairKey: kana.key,
        audioKey: kana.romaji,
        side: sideA,
        text: kana[sideA],
        kindLabel: mode.sideLabels[sideA],
      });
      cards.push({
        id: kana.key + "-" + sideB,
        pairKey: kana.key,
        audioKey: kana.romaji,
        side: sideB,
        text: kana[sideB],
        kindLabel: mode.sideLabels[sideB],
      });
    });

    return shuffle(cards);
  }

  return { KANA, PAIR_MODES, GRID_PRESETS, shuffle, buildDeck };
})();
