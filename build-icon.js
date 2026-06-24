// Gera assets/icon.ico (multi-tamanho) e assets/icon.png a partir do icon.svg
const sharp = require("sharp");
const _ico = require("png-to-ico");
const pngToIco = _ico.default || _ico;
const fs = require("fs");
const path = require("path");

(async () => {
  const svg = path.join(__dirname, "assets", "icon.svg");
  const sizes = [256, 128, 64, 48, 32, 24, 16];
  const buffers = [];
  for (const s of sizes) {
    buffers.push(await sharp(svg, { density: 384 }).resize(s, s).png().toBuffer());
  }
  const ico = await pngToIco(buffers);
  fs.writeFileSync(path.join(__dirname, "assets", "icon.ico"), ico);
  await sharp(svg, { density: 384 }).resize(256, 256).png().toFile(path.join(__dirname, "assets", "icon.png"));
  console.log("OK: assets/icon.ico e assets/icon.png gerados");
})().catch((e) => { console.error(e); process.exit(1); });
