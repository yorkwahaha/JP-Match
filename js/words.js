/**
 * 初學者單字題庫（圖案 ↔ 假名／羅馬拼音）
 * pic 使用 emoji 作為圖案，免額外圖檔。
 */
window.JPMatchWords = (() => {
  const WORDS = [
    // 動物
    { key: "neko", hira: "ねこ", romaji: "neko", pic: "🐱", label: "貓", category: "animals" },
    { key: "inu", hira: "いぬ", romaji: "inu", pic: "🐶", label: "狗", category: "animals" },
    { key: "usagi", hira: "うさぎ", romaji: "usagi", pic: "🐰", label: "兔子", category: "animals" },
    { key: "kuma", hira: "くま", romaji: "kuma", pic: "🐻", label: "熊", category: "animals" },
    { key: "tori", hira: "とり", romaji: "tori", pic: "🐦", label: "鳥", category: "animals" },
    { key: "sakana", hira: "さかな", romaji: "sakana", pic: "🐟", label: "魚", category: "animals" },
    { key: "uma", hira: "うま", romaji: "uma", pic: "🐴", label: "馬", category: "animals" },
    { key: "buta", hira: "ぶた", romaji: "buta", pic: "🐷", label: "豬", category: "animals" },
    { key: "ushi", hira: "うし", romaji: "ushi", pic: "🐮", label: "牛", category: "animals" },
    { key: "kaeru", hira: "かえる", romaji: "kaeru", pic: "🐸", label: "青蛙", category: "animals" },
    { key: "hebi", hira: "へび", romaji: "hebi", pic: "🐍", label: "蛇", category: "animals" },
    { key: "pengin", hira: "ペンギン", romaji: "pengin", pic: "🐧", label: "企鵝", category: "animals" },
    { key: "zou", hira: "ぞう", romaji: "zou", pic: "🐘", label: "大象", category: "animals" },
    { key: "kirin", hira: "きりん", romaji: "kirin", pic: "🦒", label: "長頸鹿", category: "animals" },
    { key: "raion", hira: "ライオン", romaji: "raion", pic: "🦁", label: "獅子", category: "animals" },
    { key: "nezumi", hira: "ねずみ", romaji: "nezumi", pic: "🐭", label: "老鼠", category: "animals" },
    { key: "hitsuji", hira: "ひつじ", romaji: "hitsuji", pic: "🐑", label: "羊", category: "animals" },
    { key: "saru", hira: "さる", romaji: "saru", pic: "🐵", label: "猴子", category: "animals" },

    // 食物
    { key: "ringo", hira: "りんご", romaji: "ringo", pic: "🍎", label: "蘋果", category: "food" },
    { key: "banana", hira: "バナナ", romaji: "banana", pic: "🍌", label: "香蕉", category: "food" },
    { key: "gohan", hira: "ごはん", romaji: "gohan", pic: "🍚", label: "飯", category: "food" },
    { key: "mizu", hira: "みず", romaji: "mizu", pic: "💧", label: "水", category: "food" },
    { key: "pan", hira: "パン", romaji: "pan", pic: "🍞", label: "麵包", category: "food" },
    { key: "tamago", hira: "たまご", romaji: "tamago", pic: "🥚", label: "蛋", category: "food" },
    { key: "ichigo", hira: "いちご", romaji: "ichigo", pic: "🍓", label: "草莓", category: "food" },
    { key: "suika", hira: "すいか", romaji: "suika", pic: "🍉", label: "西瓜", category: "food" },
    { key: "mikan", hira: "みかん", romaji: "mikan", pic: "🍊", label: "橘子", category: "food" },
    { key: "niku", hira: "にく", romaji: "niku", pic: "🥩", label: "肉", category: "food" },
    { key: "yasai", hira: "やさい", romaji: "yasai", pic: "🥬", label: "蔬菜", category: "food" },
    { key: "ramen", hira: "ラーメン", romaji: "ramen", pic: "🍜", label: "拉麵", category: "food" },
    { key: "sushi", hira: "すし", romaji: "sushi", pic: "🍣", label: "壽司", category: "food" },
    { key: "ocha", hira: "おちゃ", romaji: "ocha", pic: "🍵", label: "茶", category: "food" },

    // 顏色
    { key: "aka", hira: "あか", romaji: "aka", pic: "🔴", label: "紅色", category: "colors" },
    { key: "ao", hira: "あお", romaji: "ao", pic: "🔵", label: "藍色", category: "colors" },
    { key: "kiiro", hira: "きいろ", romaji: "kiiro", pic: "🟡", label: "黃色", category: "colors" },
    { key: "midori", hira: "みどり", romaji: "midori", pic: "🟢", label: "綠色", category: "colors" },
    { key: "shiro", hira: "しろ", romaji: "shiro", pic: "⚪", label: "白色", category: "colors" },
    { key: "kuro", hira: "くろ", romaji: "kuro", pic: "⚫", label: "黑色", category: "colors" },
    { key: "murasaki", hira: "むらさき", romaji: "murasaki", pic: "🟣", label: "紫色", category: "colors" },
    { key: "orenji", hira: "オレンジ", romaji: "orenji", pic: "🟠", label: "橘色", category: "colors" },

    // 日常／自然
    { key: "taiyou", hira: "たいよう", romaji: "taiyou", pic: "☀️", label: "太陽", category: "daily" },
    { key: "tsuki", hira: "つき", romaji: "tsuki", pic: "🌙", label: "月亮", category: "daily" },
    { key: "hana", hira: "はな", romaji: "hana", pic: "🌸", label: "花", category: "daily" },
    { key: "ki", hira: "き", romaji: "ki", pic: "🌳", label: "樹", category: "daily" },
    { key: "yama", hira: "やま", romaji: "yama", pic: "⛰️", label: "山", category: "daily" },
    { key: "umi", hira: "うみ", romaji: "umi", pic: "🌊", label: "海", category: "daily" },
    { key: "ame", hira: "あめ", romaji: "ame", pic: "🌧️", label: "雨", category: "daily" },
    { key: "yuki", hira: "ゆき", romaji: "yuki", pic: "❄️", label: "雪", category: "daily" },
    { key: "ie", hira: "いえ", romaji: "ie", pic: "🏠", label: "家", category: "daily" },
    { key: "kuruma", hira: "くるま", romaji: "kuruma", pic: "🚗", label: "車", category: "daily" },
    { key: "densha", hira: "でんしゃ", romaji: "densha", pic: "🚆", label: "電車", category: "daily" },
    { key: "hon", hira: "ほん", romaji: "hon", pic: "📖", label: "書", category: "daily" },
    { key: "kasa", hira: "かさ", romaji: "kasa", pic: "☂️", label: "傘", category: "daily" },
    { key: "tokei", hira: "とけい", romaji: "tokei", pic: "🕒", label: "鐘", category: "daily" },
  ];

  const CATEGORIES = [
    { id: "all", label: "全部" },
    { id: "animals", label: "動物" },
    { id: "food", label: "食物" },
    { id: "colors", label: "顏色" },
    { id: "daily", label: "日常" },
  ];

  const DEFAULT_CATEGORY = "animals";

  const PAIR_MODES = {
    "pic-hira": {
      id: "pic-hira",
      label: "圖案 ↔ 假名",
      sides: ["pic", "hira"],
      sideLabels: { pic: "圖案", hira: "假名" },
    },
    "pic-romaji": {
      id: "pic-romaji",
      label: "圖案 ↔ 羅馬拼音",
      sides: ["pic", "romaji"],
      sideLabels: { pic: "圖案", romaji: "羅馬拼音" },
    },
  };

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

  function getWordsInCategory(categoryId) {
    if (!categoryId || categoryId === "all") return WORDS.slice();
    return WORDS.filter((w) => w.category === categoryId);
  }

  function buildDeck(pairModeId, pairCount, options) {
    const mode = PAIR_MODES[pairModeId];
    if (!mode) throw new Error("未知單字配對模式：" + pairModeId);

    const opts = options || {};
    const pool = getWordsInCategory(opts.category || DEFAULT_CATEGORY);
    if (!pool.length) throw new Error("單字主題沒有可用單字");

    const count = Math.min(Math.max(1, pairCount), pool.length);
    const selected = shuffle(pool).slice(0, count);
    const sideA = mode.sides[0];
    const sideB = mode.sides[1];

    const cards = [];
    selected.forEach((word) => {
      cards.push({
        pairKey: word.key,
        side: sideA,
        text: word[sideA],
        kindLabel: mode.sideLabels[sideA],
        display: sideA === "pic" ? "pic" : "text",
        voiceText: word.hira,
        label: word.label,
      });
      cards.push({
        pairKey: word.key,
        side: sideB,
        text: word[sideB],
        kindLabel: mode.sideLabels[sideB],
        display: sideB === "pic" ? "pic" : "text",
        voiceText: word.hira,
        label: word.label,
      });
    });

    return shuffle(cards);
  }

  return {
    WORDS,
    CATEGORIES,
    DEFAULT_CATEGORY,
    PAIR_MODES,
    getWordsInCategory,
    buildDeck,
  };
})();
