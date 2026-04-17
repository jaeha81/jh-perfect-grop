// 아이콘 생성 스크립트 — node icon-gen.mjs
import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 배경
  const r = size * 0.156;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.arcTo(size, 0, size, r, r);
  ctx.lineTo(size, size - r);
  ctx.arcTo(size, size, size - r, size, r);
  ctx.lineTo(r, size);
  ctx.arcTo(0, size, 0, size - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fillStyle = '#0a0a0f';
  ctx.fill();

  // 그라디언트 텍스트 "JH"
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#7c6af7');
  grad.addColorStop(1, '#22d3a0');
  ctx.fillStyle = grad;
  ctx.font = `900 ${Math.round(size * 0.52)}px "Arial Black", Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JH', size / 2, size * 0.52);

  return canvas.toBuffer('image/png');
}

try {
  writeFileSync('icon-192.png', drawIcon(192));
  writeFileSync('icon-512.png', drawIcon(512));
  console.log('icon-192.png, icon-512.png 생성 완료');
} catch (e) {
  console.log('canvas 패키지 없음 — npm install canvas 후 재실행');
  console.log('SVG 아이콘(icon.svg)이 이미 있으므로 PWA는 정상 동작합니다.');
}
