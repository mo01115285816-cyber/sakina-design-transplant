import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'mushaf');

// QCF v2 codes الصحيحة للبسملة (بسم الله الرحمن الرحيم + علامة الآية 1)
// نفس الأكواد الموجودة في صفحة 1 (الآية 1:1)
const CORRECT_BASMALA_QPCV2 = String.fromCharCode(
  0xFC41,  // بِسْمِ
  0xFC42,  // ٱللَّهِ
  0xFC43,  // ٱلرَّحْمَـٰنِ
  0xFC44,  // ٱلرَّحِيمِ
  0xFC45   // ١ (علامة نهاية الآية)
);

let fixedCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (let page = 1; page <= 604; page++) {
  const padded = String(page).padStart(3, '0');
  const filePath = path.join(DATA_DIR, `page-${padded}.json`);

  if (!fs.existsSync(filePath)) {
    console.error(`[MISSING] page-${padded}.json`);
    errorCount++;
    continue;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    if (!data.lines || !Array.isArray(data.lines)) {
      skippedCount++;
      continue;
    }

    for (const line of data.lines) {
      if (line.type === 'basmala') {
        const oldCodes = Array.from(line.qpcV2 || '').map(c => '0x' + c.charCodeAt(0).toString(16));
        const isV1Bug = (line.qpcV2 || '').split('').some(c => c.charCodeAt(0) >= 0xFB50 && c.charCodeAt(0) <= 0xFBFF);

        if (isV1Bug) {
          line.qpcV2 = CORRECT_BASMALA_QPCV2;
          modified = true;
          console.log(`[FIXED] page-${padded}.json: ${oldCodes.join(',')} → QCF v2 correct codes`);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      fixedCount++;
    } else {
      skippedCount++;
    }
  } catch (err) {
    console.error(`[ERROR] page-${padded}.json: ${err.message}`);
    errorCount++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Fixed: ${fixedCount} files`);
console.log(`Skipped (no basmala or already correct): ${skippedCount} files`);
console.log(`Errors: ${errorCount} files`);
