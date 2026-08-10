/**
 * 動漫題庫（圖案 ↔ 假名／羅馬拼音／漢字名）
 * 先收《咒術迴戰》知名人物與招式；之後可再加其他作品（series）。
 * 圖示為原創象徵符號，非官方立繪。
 */
window.JPMatchAnime = (() => {
  const ENTRIES = [
    // —— 人物 ——
    {
      key: "jjk_itadori",
      series: "jjk",
      hira: "いたどりゆうじ",
      romaji: "itadoriyuuji",
      pic: "assets/icons/anime/jjk/itadori.png",
      label: "虎杖悠仁",
      kanji: "虎杖悠仁",
      picKind: "img",
      tts: "いたどりゆうじ",
    },
    {
      key: "jjk_fushiguro",
      series: "jjk",
      hira: "ふしぐろめぐみ",
      romaji: "fushiguromegumi",
      pic: "assets/icons/anime/jjk/fushiguro.png",
      label: "伏黒恵",
      kanji: "伏黒恵",
      picKind: "img",
      tts: "ふしぐろめぐみ",
    },
    {
      key: "jjk_kugisaki",
      series: "jjk",
      hira: "くぎさきのばら",
      romaji: "kugisakinobara",
      pic: "assets/icons/anime/jjk/kugisaki.png",
      label: "釘崎野薔薇",
      kanji: "釘崎野薔薇",
      picKind: "img",
      tts: "くぎさきのばら",
    },
    {
      key: "jjk_gojou",
      series: "jjk",
      hira: "ごじょうさとる",
      romaji: "gojousatoru",
      pic: "assets/icons/anime/jjk/gojou.png",
      label: "五条悟",
      kanji: "五条悟",
      picKind: "img",
      tts: "ごじょうさとる",
    },
    {
      key: "jjk_getou",
      series: "jjk",
      hira: "げとうすぐる",
      romaji: "getousuguru",
      pic: "assets/icons/anime/jjk/getou.png",
      label: "夏油傑",
      kanji: "夏油傑",
      picKind: "img",
      tts: "げとうすぐる",
    },
    {
      key: "jjk_sukuna",
      series: "jjk",
      hira: "りょうめんすくな",
      romaji: "ryoumensukuna",
      pic: "assets/icons/anime/jjk/sukuna.png",
      label: "両面宿儺",
      kanji: "両面宿儺",
      picKind: "img",
      tts: "りょうめんすくな",
    },
    {
      key: "jjk_maki",
      series: "jjk",
      hira: "ぜんいんまき",
      romaji: "zeninmaki",
      pic: "assets/icons/anime/jjk/maki.png",
      label: "禪院真希",
      kanji: "禅院真希",
      picKind: "img",
      tts: "ぜんいんまき",
    },
    {
      key: "jjk_inumaki",
      series: "jjk",
      hira: "いぬまきとげ",
      romaji: "inumakitoge",
      pic: "assets/icons/anime/jjk/inumaki.png",
      label: "狗巻棘",
      kanji: "狗巻棘",
      picKind: "img",
      tts: "いぬまきとげ",
    },
    {
      key: "jjk_panda",
      series: "jjk",
      hira: "パンダ",
      romaji: "panda",
      pic: "assets/icons/anime/jjk/panda.png",
      label: "熊貓",
      kanji: "パンダ",
      picKind: "img",
      tts: "パンダ",
    },
    {
      key: "jjk_nanami",
      series: "jjk",
      hira: "ななみけんと",
      romaji: "nanamikento",
      pic: "assets/icons/anime/jjk/nanami.png",
      label: "七海建人",
      kanji: "七海建人",
      picKind: "img",
      tts: "ななみけんと",
    },
    {
      key: "jjk_toudou",
      series: "jjk",
      hira: "とうどうあおい",
      romaji: "toudouaoi",
      pic: "assets/icons/anime/jjk/toudou.png",
      label: "東堂葵",
      kanji: "東堂葵",
      picKind: "img",
      tts: "とうどうあおい",
    },
    {
      key: "jjk_okkotsu",
      series: "jjk",
      hira: "おっこつゆうた",
      romaji: "okkotsuyuuta",
      pic: "assets/icons/anime/jjk/okkotsu.png",
      label: "乙骨憂太",
      kanji: "乙骨憂太",
      picKind: "img",
      tts: "おっこつゆうた",
    },
    {
      key: "jjk_rika",
      series: "jjk",
      hira: "りか",
      romaji: "rika",
      pic: "assets/icons/anime/jjk/rika.png",
      label: "里香",
      kanji: "里香",
      picKind: "img",
      tts: "りか",
    },
    {
      key: "jjk_meimei",
      series: "jjk",
      hira: "めいめい",
      romaji: "meimei",
      pic: "assets/icons/anime/jjk/meimei.png",
      label: "冥冥",
      kanji: "冥冥",
      picKind: "img",
      tts: "めいめい",
    },
    {
      key: "jjk_ieiri",
      series: "jjk",
      hira: "いえいりしょうこ",
      romaji: "ieirishouko",
      pic: "assets/icons/anime/jjk/ieiri.png",
      label: "家入硝子",
      kanji: "家入硝子",
      picKind: "img",
      tts: "いえいりしょうこ",
    },
    {
      key: "jjk_chousou",
      series: "jjk",
      hira: "ちょうそう",
      romaji: "chousou",
      pic: "assets/icons/anime/jjk/chousou.png",
      label: "脹相",
      kanji: "脹相",
      picKind: "img",
      tts: "ちょうそう",
    },
    {
      key: "jjk_mahito",
      series: "jjk",
      hira: "まひと",
      romaji: "mahito",
      pic: "assets/icons/anime/jjk/mahito.png",
      label: "真人",
      kanji: "真人",
      picKind: "img",
      tts: "まひと",
    },
    {
      key: "jjk_jougo",
      series: "jjk",
      hira: "じょうご",
      romaji: "jougo",
      pic: "assets/icons/anime/jjk/jougo.png",
      label: "漏瑚",
      kanji: "漏瑚",
      picKind: "img",
      tts: "じょうご",
    },
    {
      key: "jjk_hanami",
      series: "jjk",
      hira: "はなみ",
      romaji: "hanami",
      pic: "assets/icons/anime/jjk/hanami.png",
      label: "花御",
      kanji: "花御",
      picKind: "img",
      tts: "はなみ",
    },

    // —— 招式／術語 ——
    {
      key: "jjk_ryouiki",
      series: "jjk",
      hira: "りょういきてんかい",
      romaji: "ryouikitenkai",
      pic: "assets/icons/anime/jjk/ryouiki.png",
      label: "領域展開",
      kanji: "領域展開",
      picKind: "img",
      tts: "りょういきてんかい",
    },
    {
      key: "jjk_muryoukuusho",
      series: "jjk",
      hira: "むりょうくうしょ",
      romaji: "muryoukuusho",
      pic: "assets/icons/anime/jjk/muryoukuusho.png",
      label: "無量空処",
      kanji: "無量空処",
      picKind: "img",
      tts: "むりょうくうしょ",
    },
    {
      key: "jjk_fukumamizushi",
      series: "jjk",
      hira: "ふくまみづし",
      romaji: "fukumamizushi",
      pic: "assets/icons/anime/jjk/fukumamizushi.png",
      label: "伏魔御厨子",
      kanji: "伏魔御厨子",
      picKind: "img",
      tts: "ふくまみづし",
    },
    {
      key: "jjk_tokusa",
      series: "jjk",
      hira: "とくさのかげぼうじゅつ",
      romaji: "tokusanokageboujutsu",
      pic: "assets/icons/anime/jjk/tokusa.png",
      label: "十種影法術",
      kanji: "十種影法術",
      picKind: "img",
      tts: "とくさのかげぼうじゅつ",
    },
    {
      key: "jjk_kokusen",
      series: "jjk",
      hira: "こくせん",
      romaji: "kokusen",
      pic: "assets/icons/anime/jjk/kokusen.png",
      label: "黒閃",
      kanji: "黒閃",
      picKind: "img",
      tts: "こくせん",
    },
    {
      key: "jjk_ao",
      series: "jjk",
      hira: "あお",
      romaji: "ao",
      pic: "assets/icons/anime/jjk/ao.png",
      label: "蒼",
      kanji: "蒼",
      picKind: "img",
      tts: "あお",
    },
    {
      key: "jjk_aka",
      series: "jjk",
      hira: "あか",
      romaji: "aka",
      pic: "assets/icons/anime/jjk/aka.png",
      label: "赫",
      kanji: "赫",
      picKind: "img",
      tts: "あか",
    },
    {
      key: "jjk_murasaki",
      series: "jjk",
      hira: "むらさき",
      romaji: "murasaki",
      pic: "assets/icons/anime/jjk/murasaki.png",
      label: "茈",
      kanji: "茈",
      picKind: "img",
      tts: "むらさき",
    },
    {
      key: "jjk_toji",
      series: "jjk",
      hira: "ふしぐろとうじ",
      romaji: "fushigurotoji",
      pic: "assets/icons/anime/jjk/toji.png",
      label: "伏黑甚爾",
      kanji: "伏黒甚爾",
      picKind: "img",
      tts: "ふしぐろとうじ",
    },
    {
      key: "jjk_higuruma",
      series: "jjk",
      hira: "ひぐるまひろみ",
      romaji: "higurumahiromi",
      pic: "assets/icons/anime/jjk/higuruma.png",
      label: "日車寬見",
      kanji: "日車寛見",
      picKind: "img",
      tts: "ひぐるまひろみ",
    },
    {
      key: "jjk_naoya",
      series: "jjk",
      hira: "ぜんいんなおや",
      romaji: "zeninnaoya",
      pic: "assets/icons/anime/jjk/naoya.png",
      label: "禪院直哉",
      kanji: "禅院直哉",
      picKind: "img",
      tts: "ぜんいんなおや",
    },
    {
      key: "jjk_tobari",
      series: "jjk",
      hira: "とばり",
      romaji: "tobari",
      pic: "assets/icons/anime/jjk/tobari.png",
      label: "帳",
      kanji: "帳",
      picKind: "img",
      tts: "とばり",
    },
  ];

  const SERIES = [{ id: "jjk", label: "咒術迴戰" }];

  const DEFAULT_SERIES = "jjk";

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
    "kanji-hira": {
      id: "kanji-hira",
      label: "漢字名 ↔ 假名",
      sides: ["kanji", "hira"],
      sideLabels: { kanji: "漢字名", hira: "假名" },
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

  function getEntriesInSeries(seriesId) {
    if (!seriesId) return ENTRIES.slice();
    return ENTRIES.filter((entry) => entry.series === seriesId);
  }

  function buildDeck(pairModeId, pairCount, options) {
    const mode = PAIR_MODES[pairModeId];
    if (!mode) throw new Error("未知動漫配對模式：" + pairModeId);

    const opts = options || {};
    const pool = getEntriesInSeries(opts.series || DEFAULT_SERIES);
    if (!pool.length) throw new Error("動漫作品沒有可用題目");

    const count = Math.min(Math.max(1, pairCount), pool.length);
    const selected = shuffle(pool).slice(0, count);
    const sideA = mode.sides[0];
    const sideB = mode.sides[1];

    const cards = [];
    selected.forEach((entry) => {
      const picDisplay =
        entry.picKind === "symbol"
          ? "symbol"
          : entry.picKind === "img"
            ? "img"
            : "pic";
      cards.push({
        pairKey: entry.key,
        side: sideA,
        text: entry[sideA],
        kindLabel: mode.sideLabels[sideA],
        display: sideA === "pic" ? picDisplay : "text",
        voiceText: entry.hira,
        voiceKey: entry.key,
        voicePack: "anime",
        label: entry.label,
        picSub: sideA === "pic" ? entry.picSub || "" : "",
      });
      cards.push({
        pairKey: entry.key,
        side: sideB,
        text: entry[sideB],
        kindLabel: mode.sideLabels[sideB],
        display: sideB === "pic" ? picDisplay : "text",
        voiceText: entry.hira,
        voiceKey: entry.key,
        voicePack: "anime",
        label: entry.label,
        picSub: sideB === "pic" ? entry.picSub || "" : "",
      });
    });

    return shuffle(cards);
  }

  return {
    ENTRIES,
    SERIES,
    DEFAULT_SERIES,
    PAIR_MODES,
    getEntriesInSeries,
    buildDeck,
  };
})();
