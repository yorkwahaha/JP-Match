/**
 * 為尚未替換成學習插圖的動漫題目產生暫用象徵 PNG。
 * 用法：node scripts/gen-anime-placeholder-icons.js [seriesId...]
 * 已存在的 PNG 預設跳過；加 --force 可覆寫。
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { Resvg } = require("@resvg/resvg-js");

const FORCE = process.argv.includes("--force");
const SERIES_FILTER = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith("--"));

const PALETTE = {
  db: { bg: "#1a2744", accent: "#f0c040", ink: "#fff8e8" },
  frieren: { bg: "#1e2a28", accent: "#8ec8b8", ink: "#f2f7f4" },
  jjk: { bg: "#2a2438", accent: "#c9a0ff", ink: "#f7f2ff" },
  op: { bg: "#162a44", accent: "#4aa8e8", ink: "#f0f7ff" },
};

function loadAnime() {
  const src = fs.readFileSync(path.join("js", "anime.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.JPMatchAnime;
}

function slugFromPic(pic) {
  return path.basename(pic, ".png");
}

function badgeText(entry) {
  const source = entry.kanji || entry.label || entry.hira || "?";
  const chars = Array.from(source);
  return chars.slice(0, chars[0] && chars[0].length > 1 ? 1 : 2).join("") || "?";
}

function svgFor(entry) {
  const colors = PALETTE[entry.series] || { bg: "#243040", accent: "#90b8d8", ink: "#f4f8fc" };
  const text = badgeText(entry);
  const fontSize = text.length > 1 ? 72 : 96;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="48" fill="${colors.bg}"/>
  <circle cx="256" cy="236" r="148" fill="${colors.accent}" opacity="0.22"/>
  <circle cx="256" cy="236" r="118" fill="none" stroke="${colors.accent}" stroke-width="10"/>
  <text x="256" y="258" text-anchor="middle" dominant-baseline="middle"
    font-family="Segoe UI, Yu Gothic, Meiryo, sans-serif" font-size="${fontSize}"
    font-weight="700" fill="${colors.ink}">${escapeXml(text)}</text>
  <text x="256" y="430" text-anchor="middle"
    font-family="Segoe UI, Yu Gothic, Meiryo, sans-serif" font-size="28"
    fill="${colors.accent}">${escapeXml(slugFromPic(entry.pic))}</text>
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  const anime = loadAnime();
  const entries = anime.ENTRIES.filter((entry) => {
    if (!SERIES_FILTER.length) return true;
    return SERIES_FILTER.includes(entry.series);
  });
  if (!entries.length) throw new Error("no entries matched");

  let written = 0;
  let skipped = 0;
  for (const entry of entries) {
    const outPath = path.join(entry.pic);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    if (!FORCE && fs.existsSync(outPath)) {
      skipped += 1;
      continue;
    }
    const resvg = new Resvg(svgFor(entry), {
      fitTo: { mode: "width", value: 512 },
    });
    fs.writeFileSync(outPath, resvg.render().asPng());
    written += 1;
    process.stdout.write("icon " + entry.pic + "\n");
  }
  console.log("done written=" + written + " skipped=" + skipped);
}

main();
