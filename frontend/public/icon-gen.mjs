// 아이콘 생성 스크립트 — 배포 전 한 번 실행
// node icon-gen.mjs
import { writeFileSync } = 'fs';

// 최소 유효 PNG (1x1 purple pixel) — 실제 아이콘은 디자이너 작업 권장
const PNG_192 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000c0000000c00802000000' +
  '00000000', 'hex'
);
// Vercel 빌드 시 manifest.json이 icon.svg를 참조하도록 수정 권장
console.log('Use icon.svg for PWA or replace with proper PNG icons.');
