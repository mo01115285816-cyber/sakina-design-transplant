import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * QCF Font Verification Script — Remote-First Architecture
 *
 * In the new architecture, QCF fonts (604 pages) are stored on GitHub Releases CDN
 * and downloaded at runtime. Only sample fonts (p001, p002) are kept locally for
 * development. This script verifies:
 *   1. Sample fonts (p001, p002) exist locally and are valid woff2
 *   2. sura_names.woff2 exists and is valid
 *   3. GitHub Releases CDN is reachable (optional, non-blocking)
 */

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts', 'qcf');
const SURA_NAMES_PATH = path.join(process.cwd(), 'public', 'fonts', 'sura_names.woff2');
const SAMPLE_FONT_PAGES = [1, 2]; // Only these are kept locally for dev
const MIN_FONT_SIZE = 30000;
const MIN_SURA_SIZE = 50000;
const WOFF2_MAGIC = [0x77, 0x4F, 0x46, 0x32]; // wOF2
const CDN_RELEASE_URL = 'https://github.com/mo01115285816-cyber/sakina/releases/download/v1.0.0-mushaf-fonts/qcf-fonts.zip';

const errors = [];
const warnings = [];

function checkWoff2(filePath, minSize) {
  const stat = fs.statSync(filePath);
  if (stat.size < minSize) {
    return `too small (${stat.size} bytes, min ${minSize})`;
  }
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  if (buf[0] !== WOFF2_MAGIC[0] || buf[1] !== WOFF2_MAGIC[1] || buf[2] !== WOFF2_MAGIC[2] || buf[3] !== WOFF2_MAGIC[3]) {
    return `invalid woff2 magic (got ${buf.toString('hex')})`;
  }
  return null;
}

// Check sample fonts that are kept locally for development
for (const page of SAMPLE_FONT_PAGES) {
  const num = String(page).padStart(3, '0');
  const filePath = path.join(FONTS_DIR, `p${num}.woff2`);

  if (!fs.existsSync(filePath)) {
    errors.push(`missing sample: p${num}.woff2 (required for local dev)`);
    continue;
  }

  const err = checkWoff2(filePath, MIN_FONT_SIZE);
  if (err) {
    errors.push(`p${num}.woff2: ${err}`);
  }
}

// Check sura_names.woff2
if (!fs.existsSync(SURA_NAMES_PATH)) {
  errors.push('missing: sura_names.woff2');
} else {
  const err = checkWoff2(SURA_NAMES_PATH, MIN_SURA_SIZE);
  if (err) {
    errors.push(`sura_names.woff2: ${err}`);
  }
}

// Check that fonts directory exists
if (!fs.existsSync(FONTS_DIR)) {
  errors.push('missing: public/fonts/qcf/ directory');
}

// Optional: Verify CDN accessibility (non-blocking warning)
console.log('Checking GitHub Releases CDN accessibility...');
try {
  // Just do a HEAD request to verify the release asset exists
  const result = execSync(`curl -sI -o /dev/null -w "%{http_code}" "${CDN_RELEASE_URL}"`, {
    timeout: 15000,
    encoding: 'utf-8'
  }).trim();

  if (result === '200' || result === '302') {
    console.log('  CDN: accessible (HTTP ' + result + ')');
  } else {
    warnings.push(`CDN returned HTTP ${result} — fonts may not be downloadable at runtime`);
  }
} catch {
  warnings.push('Could not verify CDN accessibility (network issue or curl unavailable)');
}

if (errors.length > 0) {
  console.error('FAILED: font verification errors:');
  errors.forEach(e => console.error(`  - ${e}`));
  if (warnings.length > 0) {
    console.error('\nWarnings:');
    warnings.forEach(w => console.error(`  ⚠ ${w}`));
  }
  process.exit(1);
} else {
  console.log(`SUCCESS: sample QCF fonts (p001, p002) + sura_names.woff2 are valid`);
  console.log(`  Architecture: Remote-First (604 fonts served via GitHub Releases CDN)`);
  console.log(`  CDN URL: ${CDN_RELEASE_URL}`);
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }
}
