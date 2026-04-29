const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public/assets/logo.png');
const out192 = path.join(__dirname, 'public/assets/icon-192.png');
const out512 = path.join(__dirname, 'public/assets/icon-512.png');

async function resize() {
  try {
    await sharp(inputPath)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(out192);
    console.log('Created icon-192.png');
    
    await sharp(inputPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(out512);
    console.log('Created icon-512.png');
  } catch (err) {
    console.error(err);
  }
}

resize();
