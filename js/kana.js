/**
 * 五十音資料（清音＋濁音＋半濁音＋拗音）
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
    { key: "kya", romaji: "kya", hira: "きゃ", kata: "キャ" },
    { key: "kyu", romaji: "kyu", hira: "きゅ", kata: "キュ" },
    { key: "kyo", romaji: "kyo", hira: "きょ", kata: "キョ" },
    { key: "sha", romaji: "sha", hira: "しゃ", kata: "シャ" },
    { key: "shu", romaji: "shu", hira: "しゅ", kata: "シュ" },
    { key: "sho", romaji: "sho", hira: "しょ", kata: "ショ" },
    { key: "cha", romaji: "cha", hira: "ちゃ", kata: "チャ" },
    { key: "chu", romaji: "chu", hira: "ちゅ", kata: "チュ" },
    { key: "cho", romaji: "cho", hira: "ちょ", kata: "チョ" },
    { key: "nya", romaji: "nya", hira: "にゃ", kata: "ニャ" },
    { key: "nyu", romaji: "nyu", hira: "にゅ", kata: "ニュ" },
    { key: "nyo", romaji: "nyo", hira: "にょ", kata: "ニョ" },
    { key: "hya", romaji: "hya", hira: "ひゃ", kata: "ヒャ" },
    { key: "hyu", romaji: "hyu", hira: "ひゅ", kata: "ヒュ" },
    { key: "hyo", romaji: "hyo", hira: "ひょ", kata: "ヒョ" },
    { key: "mya", romaji: "mya", hira: "みゃ", kata: "ミャ" },
    { key: "myu", romaji: "myu", hira: "みゅ", kata: "ミュ" },
    { key: "myo", romaji: "myo", hira: "みょ", kata: "ミョ" },
    { key: "rya", romaji: "rya", hira: "りゃ", kata: "リャ" },
    { key: "ryu", romaji: "ryu", hira: "りゅ", kata: "リュ" },
    { key: "ryo", romaji: "ryo", hira: "りょ", kata: "リョ" },
    { key: "gya", romaji: "gya", hira: "ぎゃ", kata: "ギャ" },
    { key: "gyu", romaji: "gyu", hira: "ぎゅ", kata: "ギュ" },
    { key: "gyo", romaji: "gyo", hira: "ぎょ", kata: "ギョ" },
    { key: "ja", romaji: "ja", hira: "じゃ", kata: "ジャ" },
    { key: "ju", romaji: "ju", hira: "じゅ", kata: "ジュ" },
    { key: "jo", romaji: "jo", hira: "じょ", kata: "ジョ" },
    { key: "bya", romaji: "bya", hira: "びゃ", kata: "ビャ" },
    { key: "byu", romaji: "byu", hira: "びゅ", kata: "ビュ" },
    { key: "byo", romaji: "byo", hira: "びょ", kata: "ビョ" },
    { key: "pya", romaji: "pya", hira: "ぴゃ", kata: "ピャ" },
    { key: "pyu", romaji: "pyu", hira: "ぴゅ", kata: "ピュ" },
    { key: "pyo", romaji: "pyo", hira: "ぴょ", kata: "ピョ" },
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

  const DEFAULT_GRID_ID = "8x4";

  /** 五十音「行」順序（清音→濁音／半濁音→拗音），用於出題範圍 */
  const ROWS = [
    { id: "a", label: "あ行", keys: ["a", "i", "u", "e", "o"] },
    { id: "ka", label: "か行", keys: ["ka", "ki", "ku", "ke", "ko"] },
    { id: "sa", label: "さ行", keys: ["sa", "shi", "su", "se", "so"] },
    { id: "ta", label: "た行", keys: ["ta", "chi", "tsu", "te", "to"] },
    { id: "na", label: "な行", keys: ["na", "ni", "nu", "ne", "no"] },
    { id: "ha", label: "は行", keys: ["ha", "hi", "fu", "he", "ho"] },
    { id: "ma", label: "ま行", keys: ["ma", "mi", "mu", "me", "mo"] },
    { id: "ya", label: "や行", keys: ["ya", "yu", "yo"] },
    { id: "ra", label: "ら行", keys: ["ra", "ri", "ru", "re", "ro"] },
    { id: "wa", label: "わ行", keys: ["wa", "wo", "n"] },
    { id: "ga", label: "が行", keys: ["ga", "gi", "gu", "ge", "go"] },
    { id: "za", label: "ざ行", keys: ["za", "ji", "zu", "ze", "zo"] },
    { id: "da", label: "だ行", keys: ["da", "de", "do"] },
    { id: "ba", label: "ば行", keys: ["ba", "bi", "bu", "be", "bo"] },
    { id: "pa", label: "ぱ行", keys: ["pa", "pi", "pu", "pe", "po"] },
    { id: "kya", label: "きゃ行", keys: ["kya", "kyu", "kyo"] },
    { id: "sha", label: "しゃ行", keys: ["sha", "shu", "sho"] },
    { id: "cha", label: "ちゃ行", keys: ["cha", "chu", "cho"] },
    { id: "nya", label: "にゃ行", keys: ["nya", "nyu", "nyo"] },
    { id: "hya", label: "ひゃ行", keys: ["hya", "hyu", "hyo"] },
    { id: "mya", label: "みゃ行", keys: ["mya", "myu", "myo"] },
    { id: "rya", label: "りゃ行", keys: ["rya", "ryu", "ryo"] },
    { id: "gya", label: "ぎゃ行", keys: ["gya", "gyu", "gyo"] },
    { id: "ja", label: "じゃ行", keys: ["ja", "ju", "jo"] },
    { id: "bya", label: "びゃ行", keys: ["bya", "byu", "byo"] },
    { id: "pya", label: "ぴゃ行", keys: ["pya", "pyu", "pyo"] },
  ];

  /** 預設只出清音（あ行～わ行） */
  const DEFAULT_ROW_FROM = "a";
  const DEFAULT_ROW_TO = "wa";

  const RANGE_PRESETS = {
    seion: { id: "seion", label: "清音", from: "a", to: "wa" },
    dakuon: { id: "dakuon", label: "＋濁音", from: "a", to: "pa" },
    youon: { id: "youon", label: "＋拗音", from: "a", to: "pya" },
  };
  const DEFAULT_RANGE_PRESET = "seion";

  function rowIndex(rowId) {
    return ROWS.findIndex((r) => r.id === rowId);
  }

  function normalizeRowRange(fromId, toId) {
    let from = rowIndex(fromId);
    let to = rowIndex(toId);
    if (from < 0) from = 0;
    if (to < 0) to = ROWS.length - 1;
    if (from > to) {
      const tmp = from;
      from = to;
      to = tmp;
    }
    return { from, to, fromId: ROWS[from].id, toId: ROWS[to].id };
  }

  function getKanaInRange(fromId, toId) {
    const { from, to } = normalizeRowRange(fromId, toId);
    const keys = new Set();
    for (let i = from; i <= to; i += 1) {
      ROWS[i].keys.forEach((k) => keys.add(k));
    }
    return KANA.filter((kana) => keys.has(kana.key));
  }

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

  function buildDeck(pairModeId, pairCount, options) {
    const mode = PAIR_MODES[pairModeId];
    if (!mode) throw new Error("未知配對模式：" + pairModeId);

    const opts = options || {};
    const pool = getKanaInRange(
      opts.fromRow || DEFAULT_ROW_FROM,
      opts.toRow || DEFAULT_ROW_TO
    );
    if (!pool.length) throw new Error("出題範圍沒有可用假名");

    const count = Math.min(Math.max(1, pairCount), pool.length);
    const selected = shuffle(pool).slice(0, count);
    const sideA = mode.sides[0];
    const sideB = mode.sides[1];

    const cards = [];
    selected.forEach((kana) => {
      cards.push({
        pairKey: kana.key,
        audioKey: kana.romaji,
        side: sideA,
        text: kana[sideA],
        kindLabel: mode.sideLabels[sideA],
      });
      cards.push({
        pairKey: kana.key,
        audioKey: kana.romaji,
        side: sideB,
        text: kana[sideB],
        kindLabel: mode.sideLabels[sideB],
      });
    });

    return shuffle(cards);
  }

  return {
    PAIR_MODES,
    GRID_PRESETS,
    DEFAULT_GRID_ID,
    ROWS,
    DEFAULT_ROW_FROM,
    DEFAULT_ROW_TO,
    RANGE_PRESETS,
    DEFAULT_RANGE_PRESET,
    getKanaInRange,
    normalizeRowRange,
    buildDeck,
  };
})();
