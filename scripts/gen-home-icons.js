const fs = require("fs");
const path = require("path");

const dir = path.join("assets", "icons", "home");
fs.mkdirSync(dir, { recursive: true });

function wrap(body) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" ' +
    'stroke="#2a3f4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    body +
    "</svg>"
  );
}

const icons = {
  terebi:
    '<rect x="8" y="14" width="48" height="32" rx="3"/>' +
    '<rect x="12" y="18" width="40" height="24" rx="1.5" fill="#7eb6d9" stroke="none"/>' +
    '<path d="M24 46h16M32 46v6M22 52h20"/>',
  beddo:
    '<path d="M8 40h48v6H8z"/>' +
    '<path d="M10 40V28c0-3 3-6 8-6h12c4 0 6 2 6 5v13"/>' +
    '<rect x="36" y="24" width="18" height="16" rx="2"/>' +
    '<path d="M8 46v4M56 46v4"/>',
  tsukue: '<path d="M10 28h44v4H10z"/><path d="M16 32v18M48 32v18M12 50h8M44 50h8"/>',
  isu:
    '<path d="M20 18h24v16H20z"/><path d="M20 34h24v4H20z"/>' +
    '<path d="M22 38v14M42 38v14M18 52h8M38 52h8"/>',
  tana:
    '<rect x="14" y="10" width="36" height="46" rx="2"/>' +
    '<path d="M14 24h36M14 38h36M14 52h36"/>',
  tansu:
    '<rect x="12" y="10" width="40" height="46" rx="2"/>' +
    '<path d="M12 26h40M12 42h40"/>' +
    '<circle cx="32" cy="18" r="1.5" fill="#2a3f4f" stroke="none"/>' +
    '<circle cx="32" cy="34" r="1.5" fill="#2a3f4f" stroke="none"/>' +
    '<circle cx="32" cy="50" r="1.5" fill="#2a3f4f" stroke="none"/>',
  reizouko:
    '<rect x="16" y="8" width="32" height="50" rx="3"/>' +
    '<path d="M16 30h32"/>' +
    '<circle cx="40" cy="20" r="1.8" fill="#2a3f4f" stroke="none"/>' +
    '<circle cx="40" cy="42" r="1.8" fill="#2a3f4f" stroke="none"/>',
  sentakuki:
    '<rect x="14" y="10" width="36" height="46" rx="3"/>' +
    '<circle cx="32" cy="34" r="12"/><circle cx="32" cy="34" r="7"/>' +
    '<circle cx="22" cy="18" r="2"/><circle cx="30" cy="18" r="2"/>',
  soujiki:
    '<rect x="28" y="12" width="18" height="24" rx="4"/>' +
    '<path d="M28 28H16c-3 0-5 2-5 5v8c0 2 2 4 5 4h8"/>' +
    '<circle cx="37" cy="20" r="2"/><path d="M34 36v16"/>',
  eakon:
    '<rect x="8" y="18" width="48" height="22" rx="3"/>' +
    '<path d="M14 28h36M14 34h28"/><path d="M18 40v6M28 40v8M38 40v6"/>',
  denki:
    '<path d="M32 8c-8 0-14 6-14 14 0 6 3 10 8 13v7h12v-7c5-3 8-7 8-13 0-8-6-14-14-14z"/>' +
    '<path d="M26 48h12M28 52h8"/>',
  denwa:
    '<rect x="20" y="8" width="24" height="42" rx="4"/>' +
    '<path d="M26 14h12M24 22h16v18H24z"/><circle cx="32" cy="46" r="2"/>',
  keitai:
    '<rect x="20" y="6" width="24" height="52" rx="4"/>' +
    '<rect x="24" y="12" width="16" height="34" rx="1" fill="#7eb6d9" stroke="none"/>' +
    '<circle cx="32" cy="52" r="2"/>',
  pasokon:
    '<rect x="8" y="12" width="48" height="30" rx="2"/>' +
    '<rect x="12" y="16" width="40" height="22" fill="#7eb6d9" stroke="none"/>' +
    '<path d="M20 48h24l4 6H16z"/>',
  kamera:
    '<rect x="10" y="20" width="44" height="28" rx="4"/>' +
    '<circle cx="32" cy="34" r="9"/><circle cx="32" cy="34" r="5"/>' +
    '<path d="M22 20l4-6h12l4 6"/><circle cx="48" cy="26" r="2"/>',
  rajio:
    '<rect x="10" y="20" width="44" height="28" rx="3"/>' +
    '<circle cx="24" cy="34" r="8"/>' +
    '<path d="M36 28h12M36 34h12M36 40h8"/><path d="M18 12l10 8"/>',
  senpuuki:
    '<circle cx="32" cy="32" r="4" fill="#2a3f4f" stroke="none"/>' +
    '<path d="M32 14c6 4 8 10 6 14-4-2-8-2-12 0-2-4 0-10 6-14z"/>' +
    '<path d="M48 40c-4 6-10 8-14 6 2-4 2-8 0-12 4-2 10 0 14 6z"/>' +
    '<path d="M16 40c4 6 10 8 14 6-2-4-2-8 0-12-4-2-10 0-14 6z"/>' +
    '<path d="M32 48v8"/>',
  kagami:
    '<ellipse cx="32" cy="30" rx="16" ry="20"/>' +
    '<rect x="28" y="50" width="8" height="6" rx="1"/>',
  mado:
    '<rect x="12" y="10" width="40" height="44" rx="2"/>' +
    '<path d="M32 10v44M12 32h40"/>' +
    '<rect x="16" y="14" width="12" height="14" fill="#b8d4e8" stroke="none"/>' +
    '<rect x="36" y="14" width="12" height="14" fill="#b8d4e8" stroke="none"/>',
  doa:
    '<rect x="16" y="6" width="32" height="52" rx="2"/>' +
    '<circle cx="40" cy="34" r="2.5"/><path d="M16 58h32"/>',
  futon:
    '<rect x="8" y="28" width="48" height="18" rx="4"/>' +
    '<path d="M12 28c4-10 36-10 40 0"/><path d="M8 46h48v4H8z"/>',
  makura: '<ellipse cx="32" cy="34" rx="22" ry="12"/><path d="M14 34c2-4 12-6 18-6s16 2 18 6"/>',
  ofuro:
    '<path d="M12 28h40v10c0 8-8 14-20 14S12 46 12 38V28z"/>' +
    '<path d="M10 28h44"/>' +
    '<path d="M20 18c0 4 2 6 4 8M32 14c0 5 2 8 4 10M44 18c0 4 1 6 3 8"/>',
  toire:
    '<ellipse cx="32" cy="40" rx="16" ry="10"/>' +
    '<path d="M20 40V24c0-4 4-8 12-8s12 4 12 8v16"/>' +
    '<rect x="26" y="10" width="12" height="8" rx="2"/><path d="M22 50h20"/>',
  nagashidai:
    '<rect x="8" y="26" width="48" height="8" rx="2"/>' +
    '<path d="M14 34v14h36V34"/><circle cx="32" cy="42" r="4"/>' +
    '<path d="M32 18v10M28 22h8"/>',
  suihanki:
    '<rect x="16" y="18" width="32" height="34" rx="4"/>' +
    '<path d="M16 28h32"/><ellipse cx="32" cy="18" rx="14" ry="5"/>' +
    '<circle cx="32" cy="40" r="3"/>',
  renji:
    '<rect x="10" y="14" width="44" height="36" rx="3"/>' +
    '<rect x="16" y="20" width="26" height="20" rx="1" fill="#b8d4e8" stroke="none"/>' +
    '<circle cx="48" cy="26" r="2"/><circle cx="48" cy="34" r="2"/>' +
    '<path d="M14 50h36"/>',
};

Object.keys(icons).forEach((name) => {
  fs.writeFileSync(path.join(dir, name + ".svg"), wrap(icons[name]));
});

console.log("wrote", Object.keys(icons).length, "icons to", dir);
