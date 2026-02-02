import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function generateStatCard(data: any) {
  const width = 1200;
  const height = 630;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // text
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${data.balance}`, 1000, 500);

  // template overlay
  const templatePath = path.resolve(
    __dirname,
    '../tmp/template2.png'
  );
  const templateImage = await loadImage(templatePath);
  ctx.drawImage(templateImage, 0, 0, width, height);

  // 🔥 generate unique filename
  const fileName = `card-${Date.now()}-${crypto.randomUUID()}.png`;
  const outputPath = path.resolve(__dirname, '../generated', fileName);

  // make sure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // write file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  return {
    path: outputPath,
    buffer,
  };
}
