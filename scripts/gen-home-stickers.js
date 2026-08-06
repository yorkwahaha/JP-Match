/**
 * 家裡用品圖示：一律 Fluent Emoji（MIT，彩色貼圖風格統一）
 * 原則：有清楚圖才收單字；不硬湊單色／錯圖
 * 用法：node scripts/gen-home-stickers.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const OUT = path.join("assets", "icons", "home");
const SIZE = 256;

const MAP = {
  terebi: "fluent-emoji:television",
  beddo: "fluent-emoji:bed",
  isu: "fluent-emoji:chair",
  sofaa: "fluent-emoji:couch-and-lamp",
  denki: "fluent-emoji:light-bulb",
  denwa: "fluent-emoji:telephone",
  keitai: "fluent-emoji:mobile-phone",
  pasokon: "fluent-emoji:laptop",
  kiiboodo: "fluent-emoji:keyboard",
  kamera: "fluent-emoji:camera",
  rajio: "fluent-emoji:radio",
  kagami: "fluent-emoji:mirror",
  mado: "fluent-emoji:window",
  doa: "fluent-emoji:door",
  ofuro: "fluent-emoji:bathtub",
  shawaa: "fluent-emoji:shower",
  toire: "fluent-emoji:toilet",
  houki: "fluent-emoji:broom",
  sekken: "fluent-emoji:soap",
  megane: "fluent-emoji:glasses",
  gomibako: "fluent-emoji:wastebasket",
  hasami: "fluent-emoji:scissors",
  denchi: "fluent-emoji:battery",
  konsento: "fluent-emoji:electric-plug",
  e: "fluent-emoji:framed-picture",
  raito: "fluent-emoji:flashlight",
};

async function fetchSvg(iconId) {
  const url = "https://api.iconify.design/" + iconId + ".svg?height=" + SIZE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(iconId + " HTTP " + res.status);
  return Buffer.from(await res.arrayBuffer());
}

function svgToPng(svgBuf) {
  const resvg = new Resvg(svgBuf, {
    fitTo: { mode: "width", value: SIZE },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "jp-match-home-"));

  let ok = 0;
  try {
    for (const [name, iconId] of Object.entries(MAP)) {
      process.stdout.write(name + " <- " + iconId + " ... ");
      try {
        const svg = await fetchSvg(iconId);
        const png = svgToPng(svg);
        fs.writeFileSync(path.join(stagingDir, name + ".png"), png);
        console.log(png.length + " bytes");
        ok += 1;
      } catch (e) {
        console.log("FAIL " + e.message);
      }
    }

    if (ok !== Object.keys(MAP).length) {
      throw new Error("generation incomplete; existing icons were preserved");
    }

    const expected = new Set(Object.keys(MAP).map((name) => name + ".png"));
    expected.forEach((filename) => {
      fs.copyFileSync(path.join(stagingDir, filename), path.join(OUT, filename));
    });
    for (const filename of fs.readdirSync(OUT)) {
      if (
        (filename.endsWith(".svg") || filename.endsWith(".png")) &&
        !expected.has(filename)
      ) {
        fs.unlinkSync(path.join(OUT, filename));
      }
    }
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }

  console.log("done", ok + "/" + Object.keys(MAP).length);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
