const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  
  const typeAndData = Buffer.alloc(4 + len);
  typeAndData.write(type, 0);
  data.copy(typeAndData, 4);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 4 + 4 + len);
  
  return buf;
}

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  const rowSize = 1 + width * 3;
  const uncompressed = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    uncompressed[y * rowSize] = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * rowSize + 1 + x * 3;
      uncompressed[idx] = r;
      uncompressed[idx + 1] = g;
      uncompressed[idx + 2] = b;
    }
  }
  
  const compressed = zlib.deflateSync(uncompressed);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate the valid image files (Deep forest green matching theme)
const r = 0, g = 128, b = 105;
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPng(512, 512, r, g, b));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPng(512, 512, r, g, b));
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPng(1280, 1920, r, g, b));
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), createPng(48, 48, r, g, b));

console.log('🎉 [Success] All local assets regenerated successfully!');
console.log('📁 Created directory:', assetsDir);
console.log('✅ Generated assets/icon.png (512x512)');
console.log('✅ Generated assets/adaptive-icon.png (512x512)');
console.log('✅ Generated assets/splash.png (1280x1920)');
console.log('✅ Generated assets/favicon.png (48x48)');
