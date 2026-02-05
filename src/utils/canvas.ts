import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ReclaimedImageData } from './types';

export async function generateStatCard(data: ReclaimedImageData) {
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
  ctx.fillText(`${data.pubkey}`, 300, 500);

  // template overlay
  const templatePath = path.resolve(
    __dirname,
    '../images/template.png'
  );

  const templateImage = await loadImage(templatePath);
  ctx.drawImage(templateImage, 0, 0, width, height);
  // write file
  const buffer = canvas.toBuffer('image/png');

  return {
    buffer,
  };
}
