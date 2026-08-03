/**
 * 家電・傢俱圖示：填色剪影，盡量一眼可辨
 * 用法：node scripts/gen-home-icons.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join("assets", "icons", "home");
fs.mkdirSync(dir, { recursive: true });

const INK = "#2a3f4f";
const BLUE = "#6aa8d1";
const LIGHT = "#c8e0ef";
const WOOD = "#c4a574";
const WOOD_D = "#a8845a";
const GRAY = "#8fa0ad";
const GRAY_L = "#d5dde3";
const CREAM = "#f3ebe0";
const WARM = "#e8b86d";

function svg(body) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">' +
    body +
    "</svg>"
  );
}

function s(attrs) {
  return ' stroke="' + INK + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
}

const icons = {
  // 電視：螢幕＋底座
  terebi:
    '<rect x="6" y="12" width="52" height="34" rx="4" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<rect x="10" y="16" width="44" height="26" rx="2" fill="' +
    BLUE +
    '" stroke="none"/>' +
    '<path d="M24 46h16l4 8H20z" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<path d="M18 54h28" ' +
    s().trim() +
    "/>",

  // 床：枕頭＋被褥＋床架
  beddo:
    '<rect x="6" y="34" width="52" height="12" rx="2" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<rect x="8" y="22" width="30" height="14" rx="3" fill="' +
    CREAM +
    '"' +
    s() +
    "/>" +
    '<rect x="38" y="18" width="18" height="18" rx="3" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<path d="M8 46v6M56 46v6M10 52h12M42 52h12" ' +
    s().trim() +
    "/>",

  // 桌子：寬桌面＋四腳（明顯不同於椅子）
  tsukue:
    '<rect x="6" y="24" width="52" height="7" rx="2" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<path d="M14 31v22M50 31v22M22 31v22M42 31v22" ' +
    s().trim() +
    "/>" +
    '<path d="M10 53h12M42 53h12" ' +
    s().trim() +
    "/>",

  // 椅子：靠背＋座面＋四腳
  isu:
    '<rect x="18" y="8" width="28" height="20" rx="3" fill="' +
    WOOD_D +
    '"' +
    s() +
    "/>" +
    '<rect x="16" y="28" width="32" height="8" rx="2" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<path d="M20 36v20M44 36v20M18 56h8M38 56h8" ' +
    s().trim() +
    "/>",

  // 架子：開放層板
  tana:
    '<rect x="12" y="8" width="40" height="48" rx="2" fill="' +
    CREAM +
    '"' +
    s() +
    "/>" +
    '<path d="M12 22h40M12 36h40M12 50h40" ' +
    s().trim() +
    "/>" +
    '<rect x="18" y="12" width="12" height="6" rx="1" fill="' +
    BLUE +
    '" stroke="none"/>' +
    '<rect x="34" y="26" width="12" height="6" rx="1" fill="' +
    WARM +
    '" stroke="none"/>',

  // 衣櫃：門縫＋把手
  tansu:
    '<rect x="10" y="6" width="44" height="52" rx="3" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<path d="M32 6v52" ' +
    s().trim() +
    "/>" +
    '<circle cx="28" cy="32" r="2" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="36" cy="32" r="2" fill="' +
    INK +
    '" stroke="none"/>',

  // 冰箱：雙門＋把手
  reizouko:
    '<rect x="14" y="4" width="36" height="56" rx="4" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<path d="M14 24h36" ' +
    s().trim() +
    "/>" +
    '<rect x="18" y="8" width="12" height="4" rx="1" fill="' +
    BLUE +
    '" stroke="none"/>' +
    '<path d="M44 14v6M44 34v14" ' +
    s().trim() +
    "/>",

  // 洗衣機：圓窗＋旋鈕
  sentakuki:
    '<rect x="12" y="6" width="40" height="52" rx="4" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="34" r="14" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="34" r="8" fill="' +
    BLUE +
    '" stroke="none" opacity="0.55"/>' +
    '<circle cx="20" cy="14" r="2.5" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="28" cy="14" r="2.5" fill="' +
    INK +
    '" stroke="none"/>',

  // 吸塵器：機身＋軟管＋吸頭
  soujiki:
    '<rect x="30" y="8" width="20" height="26" rx="6" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<circle cx="40" cy="18" r="3" fill="' +
    WARM +
    '" stroke="none"/>' +
    '<path d="M30 26H14c-4 0-6 3-6 6v10c0 3 2 5 6 5h10" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<path d="M36 34v18" ' +
    s().trim() +
    "/>" +
    '<rect x="30" y="50" width="12" height="6" rx="2" fill="' +
    INK +
    '" stroke="none"/>',

  // 冷氣：壁掛機＋出風
  eakon:
    '<rect x="4" y="16" width="56" height="24" rx="5" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<rect x="10" y="22" width="36" height="4" rx="1" fill="' +
    BLUE +
    '" stroke="none"/>' +
    '<path d="M12 40v8M24 40v10M36 40v8M48 40v6" ' +
    s().trim() +
    "/>" +
    '<circle cx="52" cy="28" r="2" fill="' +
    INK +
    '" stroke="none"/>',

  // 電燈：燈泡＋底座
  denki:
    '<path d="M32 4c-9 0-16 7-16 16 0 7 4 12 10 15v6h12v-6c6-3 10-8 10-15 0-9-7-16-16-16z" fill="' +
    WARM +
    '"' +
    s() +
    "/>" +
    '<rect x="24" y="41" width="16" height="6" rx="1" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<path d="M26 51h12M28 55h8" ' +
    s().trim() +
    "/>",

  // 電話：復古話機
  denwa:
    '<rect x="10" y="28" width="44" height="24" rx="4" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<path d="M16 28c0-10 8-16 16-16s16 6 16 16" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<circle cx="22" cy="40" r="2" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="32" cy="40" r="2" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="42" cy="40" r="2" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="27" cy="48" r="2" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="37" cy="48" r="2" fill="' +
    INK +
    '" stroke="none"/>',

  // 手機
  keitai:
    '<rect x="18" y="4" width="28" height="56" rx="5" fill="' +
    INK +
    '"' +
    s() +
    "/>" +
    '<rect x="22" y="10" width="20" height="38" rx="2" fill="' +
    BLUE +
    '" stroke="none"/>' +
    '<circle cx="32" cy="54" r="2.5" fill="' +
    GRAY_L +
    '" stroke="none"/>',

  // 筆電／電腦
  pasokon:
    '<rect x="8" y="10" width="48" height="30" rx="3" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<rect x="12" y="14" width="40" height="22" rx="1" fill="' +
    BLUE +
    '" stroke="none"/>' +
    '<path d="M4 44h56l-6 10H10z" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>",

  // 相機
  kamera:
    '<rect x="6" y="20" width="52" height="30" rx="6" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="35" r="11" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="35" r="6" fill="' +
    INK +
    '" stroke="none"/>' +
    '<path d="M20 20l5-8h14l5 8" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<circle cx="50" cy="26" r="2.5" fill="' +
    WARM +
    '" stroke="none"/>',

  // 收音機
  rajio:
    '<rect x="6" y="18" width="52" height="34" rx="4" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<circle cx="24" cy="35" r="10" fill="' +
    CREAM +
    '"' +
    s() +
    "/>" +
    '<circle cx="24" cy="35" r="4" fill="' +
    INK +
    '" stroke="none"/>' +
    '<path d="M40 26h12M40 35h12M40 44h8" ' +
    s().trim() +
    "/>" +
    '<path d="M14 10l14 10" ' +
    s().trim() +
    "/>",

  // 電風扇：葉片＋支柱＋底座
  senpuuki:
    '<circle cx="32" cy="26" r="18" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="26" r="4" fill="' +
    INK +
    '" stroke="none"/>' +
    '<path d="M32 10c8 5 10 12 7 16-5-2-10-2-14 0-3-4 0-11 7-16z" fill="' +
    BLUE +
    '" stroke="none" opacity="0.75"/>' +
    '<path d="M48 34c-5 8-12 10-17 7 2-5 2-10 0-14 5-2 12 0 17 7z" fill="' +
    BLUE +
    '" stroke="none" opacity="0.75"/>' +
    '<path d="M16 34c5 8 12 10 17 7-2-5-2-10 0-14-5-2-12 0-17 7z" fill="' +
    BLUE +
    '" stroke="none" opacity="0.75"/>' +
    '<path d="M32 44v8" ' +
    s().trim() +
    "/>" +
    '<ellipse cx="32" cy="56" rx="12" ry="4" fill="' +
    GRAY +
    '"' +
    s() +
    "/>",

  // 鏡子：橢圓＋座
  kagami:
    '<ellipse cx="32" cy="28" rx="18" ry="22" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<ellipse cx="32" cy="28" rx="13" ry="17" fill="' +
    BLUE +
    '" stroke="none" opacity="0.35"/>' +
    '<rect x="26" y="50" width="12" height="8" rx="2" fill="' +
    WOOD +
    '"' +
    s() +
    "/>",

  // 窗戶：窗框＋玻璃
  mado:
    '<rect x="8" y="6" width="48" height="52" rx="2" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<rect x="12" y="10" width="18" height="20" fill="' +
    LIGHT +
    '" stroke="none"/>' +
    '<rect x="34" y="10" width="18" height="20" fill="' +
    LIGHT +
    '" stroke="none"/>' +
    '<rect x="12" y="34" width="18" height="20" fill="' +
    LIGHT +
    '" stroke="none"/>' +
    '<rect x="34" y="34" width="18" height="20" fill="' +
    LIGHT +
    '" stroke="none"/>' +
    '<path d="M32 6v52M8 32h48" ' +
    s().trim() +
    "/>",

  // 門：門板＋把手
  doa:
    '<rect x="14" y="4" width="36" height="56" rx="2" fill="' +
    WOOD +
    '"' +
    s() +
    "/>" +
    '<rect x="18" y="8" width="28" height="20" rx="1" fill="' +
    WOOD_D +
    '" stroke="none" opacity="0.45"/>' +
    '<circle cx="42" cy="34" r="3" fill="' +
    WARM +
    '"' +
    s() +
    "/>" +
    '<path d="M10 60h44" ' +
    s().trim() +
    "/>",

  // 被褥：摺疊被
  futon:
    '<rect x="6" y="30" width="52" height="20" rx="6" fill="' +
    BLUE +
    '"' +
    s() +
    "/>" +
    '<path d="M10 30c6-14 38-14 44 0" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<path d="M6 50h52v6H6z" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>",

  // 枕頭
  makura:
    '<ellipse cx="32" cy="34" rx="26" ry="14" fill="' +
    CREAM +
    '"' +
    s() +
    "/>" +
    '<path d="M12 34c4-6 16-10 20-10s16 4 20 10" ' +
    s().trim() +
    "/>" +
    '<ellipse cx="32" cy="34" rx="10" ry="5" fill="' +
    LIGHT +
    '" stroke="none" opacity="0.5"/>',

  // 浴缸
  ofuro:
    '<path d="M8 26h48v12c0 10-10 18-24 18S8 48 8 38V26z" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<path d="M6 26h52" ' +
    s().trim() +
    "/>" +
    '<path d="M18 14c0 5 3 8 5 10M32 10c0 6 3 10 5 12M46 14c0 5 2 8 4 10" ' +
    s().trim() +
    "/>" +
    '<ellipse cx="32" cy="36" rx="14" ry="5" fill="' +
    BLUE +
    '" stroke="none" opacity="0.45"/>',

  // 馬桶
  toire:
    '<ellipse cx="32" cy="42" rx="18" ry="12" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<path d="M18 42V26c0-5 5-10 14-10s14 5 14 10v16" fill="' +
    CREAM +
    '"' +
    s() +
    "/>" +
    '<rect x="24" y="6" width="16" height="12" rx="3" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<ellipse cx="32" cy="42" rx="8" ry="5" fill="' +
    BLUE +
    '" stroke="none" opacity="0.4"/>',

  // 水槽
  nagashidai:
    '<rect x="4" y="22" width="56" height="10" rx="2" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<path d="M10 32v18h44V32" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="42" r="5" fill="' +
    BLUE +
    '"' +
    s() +
    "/>" +
    '<path d="M32 12v12M26 18h12" ' +
    s().trim() +
    "/>",

  // 電鍋／炊飯機
  suihanki:
    '<ellipse cx="32" cy="16" rx="18" ry="7" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<rect x="14" y="16" width="36" height="36" rx="6" fill="' +
    GRAY_L +
    '"' +
    s() +
    "/>" +
    '<circle cx="32" cy="38" r="5" fill="' +
    WARM +
    '"' +
    s() +
    "/>" +
    '<path d="M20 26h24" ' +
    s().trim() +
    "/>",

  // 微波爐：明確門窗＋按鈕
  renji:
    '<rect x="4" y="12" width="56" height="40" rx="4" fill="' +
    GRAY +
    '"' +
    s() +
    "/>" +
    '<rect x="10" y="18" width="32" height="24" rx="2" fill="' +
    LIGHT +
    '"' +
    s() +
    "/>" +
    '<rect x="14" y="22" width="24" height="16" rx="1" fill="' +
    BLUE +
    '" stroke="none" opacity="0.45"/>' +
    '<circle cx="52" cy="24" r="3" fill="' +
    INK +
    '" stroke="none"/>' +
    '<circle cx="52" cy="34" r="3" fill="' +
    INK +
    '" stroke="none"/>' +
    '<rect x="48" y="42" width="8" height="4" rx="1" fill="' +
    WARM +
    '" stroke="none"/>',
};

Object.keys(icons).forEach((name) => {
  fs.writeFileSync(path.join(dir, name + ".svg"), svg(icons[name]));
});

console.log("wrote", Object.keys(icons).length, "icons to", dir);
