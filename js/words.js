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
    { key: "buta", hira: "ぶた", tts: "豚", romaji: "buta", pic: "🐷", label: "豬", category: "animals" },
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
    { key: "niwatori", hira: "にわとり", romaji: "niwatori", pic: "🐔", label: "雞", category: "animals" },
    { key: "ahiru", hira: "あひる", romaji: "ahiru", pic: "🦆", label: "鴨", category: "animals" },
    { key: "kame", hira: "かめ", romaji: "kame", pic: "🐢", label: "烏龜", category: "animals" },
    { key: "kani", hira: "かに", romaji: "kani", pic: "🦀", label: "螃蟹", category: "animals" },
    { key: "ebi", hira: "えび", tts: "エビ", romaji: "ebi", pic: "🦐", label: "蝦", category: "animals" },
    { key: "ari", hira: "あり", romaji: "ari", pic: "🐜", label: "螞蟻", category: "animals" },
    { key: "chou", hira: "ちょう", romaji: "chou", pic: "🦋", label: "蝴蝶", category: "animals" },
    { key: "semi", hira: "せみ", romaji: "semi", pic: "🦗", label: "蟬", category: "animals" },
    { key: "iruka", hira: "いるか", romaji: "iruka", pic: "🐬", label: "海豚", category: "animals" },
    { key: "kujira", hira: "くじら", romaji: "kujira", pic: "🐋", label: "鯨魚", category: "animals" },
    { key: "tora", hira: "とら", romaji: "tora", pic: "🐯", label: "老虎", category: "animals" },

    // 食物
    { key: "ringo", hira: "りんご", romaji: "ringo", pic: "🍎", label: "蘋果", category: "food" },
    { key: "banana", hira: "バナナ", romaji: "banana", pic: "🍌", label: "香蕉", category: "food" },
    { key: "gohan", hira: "ごはん", tts: "ご飯", romaji: "gohan", pic: "🍚", label: "飯", category: "food" },
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
    { key: "gyuunyuu", hira: "ぎゅうにゅう", romaji: "gyuunyuu", pic: "🥛", label: "牛奶", category: "food" },
    { key: "koucha", hira: "こうちゃ", romaji: "koucha", pic: "🫖", label: "紅茶", category: "food" },
    { key: "koohii", hira: "コーヒー", romaji: "koohii", pic: "☕", label: "咖啡", category: "food" },
    { key: "juusu", hira: "ジュース", romaji: "juusu", pic: "🧃", label: "果汁", category: "food" },
    { key: "udon", hira: "うどん", romaji: "udon", pic: "🍲", label: "烏龍麵", category: "food" },
    { key: "soba", hira: "そば", romaji: "soba", pic: "🍝", label: "蕎麥麵", category: "food" },
    { key: "misoshiru", hira: "みそしる", romaji: "misoshiru", pic: "🥣", label: "味噌湯", category: "food" },
    { key: "kudamono", hira: "くだもの", romaji: "kudamono", pic: "🥝", label: "水果", category: "food" },
    { key: "budou", hira: "ぶどう", romaji: "budou", pic: "🍇", label: "葡萄", category: "food" },
    { key: "nashi", hira: "なし", romaji: "nashi", pic: "🍐", label: "梨", category: "food" },
    { key: "momo", hira: "もも", romaji: "momo", pic: "🍑", label: "桃子", category: "food" },
    { key: "keeki", hira: "ケーキ", romaji: "keeki", pic: "🍰", label: "蛋糕", category: "food" },
    { key: "aisu", hira: "アイス", romaji: "aisu", pic: "🍦", label: "冰淇淋", category: "food" },
    { key: "okashi", hira: "おかし", romaji: "okashi", pic: "🍬", label: "點心", category: "food" },
    { key: "osake", hira: "おさけ", romaji: "osake", pic: "🍶", label: "酒", category: "food" },
    { key: "biiru", hira: "ビール", romaji: "biiru", pic: "🍺", label: "啤酒", category: "food" },
    { key: "kome", hira: "こめ", tts: "米", romaji: "kome", pic: "🌾", label: "米", category: "food" },
    { key: "onigiri", hira: "おにぎり", romaji: "onigiri", pic: "🍙", label: "飯糰", category: "food" },

    // 顏色
    { key: "aka", hira: "あか", romaji: "aka", pic: "🔴", label: "紅色", category: "colors" },
    { key: "ao", hira: "あお", romaji: "ao", pic: "🔵", label: "藍色", category: "colors" },
    { key: "kiiro", hira: "きいろ", romaji: "kiiro", pic: "🟡", label: "黃色", category: "colors" },
    { key: "midori", hira: "みどり", romaji: "midori", pic: "🟢", label: "綠色", category: "colors" },
    { key: "shiro", hira: "しろ", romaji: "shiro", pic: "⚪", label: "白色", category: "colors" },
    { key: "kuro", hira: "くろ", romaji: "kuro", pic: "⚫", label: "黑色", category: "colors" },
    { key: "murasaki", hira: "むらさき", romaji: "murasaki", pic: "🟣", label: "紫色", category: "colors" },
    { key: "orenji", hira: "オレンジ", romaji: "orenji", pic: "🟠", label: "橘色", category: "colors" },
    { key: "pinku", hira: "ピンク", romaji: "pinku", pic: "🩷", label: "粉紅色", category: "colors" },
    { key: "haiiro", hira: "はいいろ", romaji: "haiiro", pic: "🩶", label: "灰色", category: "colors" },
    { key: "kiniro", hira: "きんいろ", romaji: "kiniro", pic: "🥇", label: "金色", category: "colors" },
    { key: "giniro", hira: "ぎんいろ", romaji: "giniro", pic: "🥈", label: "銀色", category: "colors" },

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
    { key: "densha", hira: "でんしゃ", tts: "電車", romaji: "densha", pic: "🚆", label: "電車", category: "daily" },
    { key: "hon", hira: "ほん", romaji: "hon", pic: "📖", label: "書", category: "daily" },
    { key: "kasa", hira: "かさ", romaji: "kasa", pic: "☂️", label: "傘", category: "daily" },
    { key: "tokei", hira: "とけい", romaji: "tokei", pic: "🕒", label: "鐘", category: "daily" },
    { key: "gakkou", hira: "がっこう", romaji: "gakkou", pic: "🏫", label: "學校", category: "daily" },
    { key: "eki", hira: "えき", romaji: "eki", pic: "🚉", label: "車站", category: "daily" },
    { key: "byouin", hira: "びょういん", tts: "病院", romaji: "byouin", pic: "🏥", label: "醫院", category: "daily" },
    { key: "kouen", hira: "こうえん", romaji: "kouen", pic: "🏞️", label: "公園", category: "daily" },
    { key: "mise", hira: "みせ", romaji: "mise", pic: "🏪", label: "店", category: "daily" },
    { key: "tegami", hira: "てがみ", romaji: "tegami", pic: "✉️", label: "信", category: "daily" },
    { key: "kutsu", hira: "くつ", romaji: "kutsu", pic: "👟", label: "鞋子", category: "daily" },
    { key: "fuku", hira: "ふく", romaji: "fuku", pic: "👕", label: "衣服", category: "daily" },
    { key: "kagi", hira: "かぎ", romaji: "kagi", pic: "🔑", label: "鑰匙", category: "daily" },
    { key: "okane", hira: "おかね", romaji: "okane", pic: "💰", label: "錢", category: "daily" },
    { key: "pasupooto", hira: "パスポート", romaji: "pasupooto", pic: "🛂", label: "護照", category: "daily" },
    { key: "basu", hira: "バス", romaji: "basu", pic: "🚌", label: "公車", category: "daily" },
    { key: "takushii", hira: "タクシー", romaji: "takushii", pic: "🚕", label: "計程車", category: "daily" },
    { key: "hikouki", hira: "ひこうき", romaji: "hikouki", pic: "✈️", label: "飛機", category: "daily" },
    { key: "fune", hira: "ふね", romaji: "fune", pic: "🚢", label: "船", category: "daily" },
    { key: "michi", hira: "みち", romaji: "michi", pic: "🛣️", label: "路", category: "daily" },
    { key: "hashi", hira: "はし", romaji: "hashi", pic: "🌉", label: "橋", category: "daily" },

    // 家裡物品：只收 Fluent Emoji 有清楚彩色貼圖的單字（風格統一）
    { key: "terebi", hira: "テレビ", romaji: "terebi", pic: "assets/icons/home/terebi.png", label: "電視", category: "home", picKind: "img" },
    { key: "beddo", hira: "ベッド", tts: "ベッド", romaji: "beddo", pic: "assets/icons/home/beddo.png", label: "床", category: "home", picKind: "img" },
    { key: "isu", hira: "いす", romaji: "isu", pic: "assets/icons/home/isu.png", label: "椅子", category: "home", picKind: "img" },
    { key: "sofaa", hira: "ソファー", romaji: "sofaa", pic: "assets/icons/home/sofaa.png", label: "沙發", category: "home", picKind: "img" },
    { key: "denki", hira: "でんき", romaji: "denki", pic: "assets/icons/home/denki.png", label: "電燈", category: "home", picKind: "img" },
    { key: "denwa", hira: "でんわ", romaji: "denwa", pic: "assets/icons/home/denwa.png", label: "電話", category: "home", picKind: "img" },
    { key: "keitai", hira: "けいたい", romaji: "keitai", pic: "assets/icons/home/keitai.png", label: "手機", category: "home", picKind: "img" },
    { key: "pasokon", hira: "パソコン", romaji: "pasokon", pic: "assets/icons/home/pasokon.png", label: "電腦", category: "home", picKind: "img" },
    { key: "kiiwaado", hira: "キーボード", romaji: "kiiwaado", pic: "assets/icons/home/kiiwaado.png", label: "鍵盤", category: "home", picKind: "img" },
    { key: "kamera", hira: "カメラ", romaji: "kamera", pic: "assets/icons/home/kamera.png", label: "相機", category: "home", picKind: "img" },
    { key: "rajio", hira: "ラジオ", romaji: "rajio", pic: "assets/icons/home/rajio.png", label: "收音機", category: "home", picKind: "img" },
    { key: "kagami", hira: "かがみ", romaji: "kagami", pic: "assets/icons/home/kagami.png", label: "鏡子", category: "home", picKind: "img" },
    { key: "mado", hira: "まど", romaji: "mado", pic: "assets/icons/home/mado.png", label: "窗戶", category: "home", picKind: "img" },
    { key: "doa", hira: "ドア", romaji: "doa", pic: "assets/icons/home/doa.png", label: "門", category: "home", picKind: "img" },
    { key: "ofuro", hira: "おふろ", romaji: "ofuro", pic: "assets/icons/home/ofuro.png", label: "浴缸", category: "home", picKind: "img" },
    { key: "shawaa", hira: "シャワー", romaji: "shawaa", pic: "assets/icons/home/shawaa.png", label: "淋浴", category: "home", picKind: "img" },
    { key: "toire", hira: "トイレ", romaji: "toire", pic: "assets/icons/home/toire.png", label: "廁所", category: "home", picKind: "img" },
    { key: "houki", hira: "ほうき", romaji: "houki", pic: "assets/icons/home/houki.png", label: "掃帚", category: "home", picKind: "img" },
    { key: "sekken", hira: "せっけん", romaji: "sekken", pic: "assets/icons/home/sekken.png", label: "肥皂", category: "home", picKind: "img" },
    { key: "meggane", hira: "めがね", romaji: "meggane", pic: "assets/icons/home/meggane.png", label: "眼鏡", category: "home", picKind: "img" },
    { key: "gomibako", hira: "ごみばこ", romaji: "gomibako", pic: "assets/icons/home/gomibako.png", label: "垃圾桶", category: "home", picKind: "img" },
    { key: "hasami", hira: "はさみ", romaji: "hasami", pic: "assets/icons/home/hasami.png", label: "剪刀", category: "home", picKind: "img" },
    { key: "denchi", hira: "でんち", tts: "電池", romaji: "denchi", pic: "assets/icons/home/denchi.png", label: "電池", category: "home", picKind: "img" },
    { key: "konsento", hira: "コンセント", romaji: "konsento", pic: "assets/icons/home/konsento.png", label: "插頭", category: "home", picKind: "img" },
    { key: "e", hira: "え", romaji: "e", pic: "assets/icons/home/e.png", label: "畫", category: "home", picKind: "img" },
    { key: "raito", hira: "ライト", romaji: "raito", pic: "assets/icons/home/raito.png", label: "手電筒", category: "home", picKind: "img" },

    // 月分・星期・一到十（圖案側用數字／曜日記號）
    { key: "ichi", hira: "いち", romaji: "ichi", pic: "1", label: "一", category: "calendar", picKind: "symbol" },
    { key: "ni", hira: "に", romaji: "ni", pic: "2", label: "二", category: "calendar", picKind: "symbol" },
    { key: "san", hira: "さん", romaji: "san", pic: "3", label: "三", category: "calendar", picKind: "symbol" },
    { key: "yon", hira: "よん", romaji: "yon", pic: "4", label: "四", category: "calendar", picKind: "symbol" },
    { key: "go", hira: "ご", romaji: "go", pic: "5", label: "五", category: "calendar", picKind: "symbol" },
    { key: "roku", hira: "ろく", romaji: "roku", pic: "6", label: "六", category: "calendar", picKind: "symbol" },
    { key: "nana", hira: "なな", romaji: "nana", pic: "7", label: "七", category: "calendar", picKind: "symbol" },
    { key: "hachi", hira: "はち", romaji: "hachi", pic: "8", label: "八", category: "calendar", picKind: "symbol" },
    { key: "kyuu", hira: "きゅう", romaji: "kyuu", pic: "9", label: "九", category: "calendar", picKind: "symbol" },
    { key: "juu", hira: "じゅう", romaji: "juu", pic: "10", label: "十", category: "calendar", picKind: "symbol" },

    { key: "getsuyoubi", hira: "げつようび", romaji: "getsuyoubi", pic: "月曜日", picSub: "（星期一）", label: "星期一", category: "calendar", picKind: "symbol" },
    { key: "kayoubi", hira: "かようび", romaji: "kayoubi", pic: "火曜日", picSub: "（星期二）", label: "星期二", category: "calendar", picKind: "symbol" },
    { key: "suiyoubi", hira: "すいようび", romaji: "suiyoubi", pic: "水曜日", picSub: "（星期三）", label: "星期三", category: "calendar", picKind: "symbol" },
    { key: "mokuyoubi", hira: "もくようび", romaji: "mokuyoubi", pic: "木曜日", picSub: "（星期四）", label: "星期四", category: "calendar", picKind: "symbol" },
    { key: "kinyoubi", hira: "きんようび", romaji: "kinyoubi", pic: "金曜日", picSub: "（星期五）", label: "星期五", category: "calendar", picKind: "symbol" },
    { key: "doyoubi", hira: "どようび", romaji: "doyoubi", pic: "土曜日", picSub: "（星期六）", label: "星期六", category: "calendar", picKind: "symbol" },
    { key: "nichiyoubi", hira: "にちようび", romaji: "nichiyoubi", pic: "日曜日", picSub: "（星期日）", label: "星期日", category: "calendar", picKind: "symbol" },

    { key: "ichigatsu", hira: "いちがつ", romaji: "ichigatsu", pic: "1月", label: "一月", category: "calendar", picKind: "symbol" },
    { key: "nigatsu", hira: "にがつ", romaji: "nigatsu", pic: "2月", label: "二月", category: "calendar", picKind: "symbol" },
    { key: "sangatsu", hira: "さんがつ", romaji: "sangatsu", pic: "3月", label: "三月", category: "calendar", picKind: "symbol" },
    { key: "shigatsu", hira: "しがつ", romaji: "shigatsu", pic: "4月", label: "四月", category: "calendar", picKind: "symbol" },
    { key: "gogatsu", hira: "ごがつ", tts: "五月", romaji: "gogatsu", pic: "5月", label: "五月", category: "calendar", picKind: "symbol" },
    { key: "rokugatsu", hira: "ろくがつ", romaji: "rokugatsu", pic: "6月", label: "六月", category: "calendar", picKind: "symbol" },
    { key: "shichigatsu", hira: "しちがつ", romaji: "shichigatsu", pic: "7月", label: "七月", category: "calendar", picKind: "symbol" },
    { key: "hachigatsu", hira: "はちがつ", romaji: "hachigatsu", pic: "8月", label: "八月", category: "calendar", picKind: "symbol" },
    { key: "kugatsu", hira: "くがつ", romaji: "kugatsu", pic: "9月", label: "九月", category: "calendar", picKind: "symbol" },
    { key: "juugatsu", hira: "じゅうがつ", romaji: "juugatsu", pic: "10月", label: "十月", category: "calendar", picKind: "symbol" },
    { key: "juuichigatsu", hira: "じゅういちがつ", romaji: "juuichigatsu", pic: "11月", label: "十一月", category: "calendar", picKind: "symbol" },
    { key: "juunigatsu", hira: "じゅうにがつ", romaji: "juunigatsu", pic: "12月", label: "十二月", category: "calendar", picKind: "symbol" },
  ];

  const CATEGORIES = [
    { id: "all", label: "全部" },
    { id: "animals", label: "動物" },
    { id: "food", label: "食物" },
    { id: "colors", label: "顏色" },
    { id: "daily", label: "日常" },
    { id: "home", label: "家裡物品" },
    { id: "calendar", label: "月・曜・數" },
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
      const picDisplay =
        word.picKind === "symbol"
          ? "symbol"
          : word.picKind === "img"
            ? "img"
            : "pic";
      cards.push({
        pairKey: word.key,
        side: sideA,
        text: word[sideA],
        kindLabel: mode.sideLabels[sideA],
        display: sideA === "pic" ? picDisplay : "text",
        voiceText: word.hira,
        voiceKey: word.key,
        label: word.label,
        picSub: sideA === "pic" ? word.picSub || "" : "",
      });
      cards.push({
        pairKey: word.key,
        side: sideB,
        text: word[sideB],
        kindLabel: mode.sideLabels[sideB],
        display: sideB === "pic" ? picDisplay : "text",
        voiceText: word.hira,
        voiceKey: word.key,
        label: word.label,
        picSub: sideB === "pic" ? word.picSub || "" : "",
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
