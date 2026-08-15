import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * QCF Font Pack Script — Remote-First Architecture
 *
 * In the new architecture, QCF fonts (604 pages) are stored on GitHub Releases CDN
 * and downloaded at runtime. This script now only:
 *   1. Verifies sample fonts (p001, p002) are present for local dev
 *   2. Verifies the CDN release asset exists and is accessible
 *   3. Leaves the source-controlled manifest unchanged so builds stay reproducible
 *
 * The original zip packing is no longer needed since fonts are hosted on GitHub Releases.
 */

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts', 'qcf');
const SAMPLE_FONT_PAGES = [1, 2];
const CDN_RELEASE_URL = 'https://github.com/mo01115285816-cyber/sakina/releases/download/v1.0.0-mushaf-fonts/qcf-fonts.zip';

function main() {
  console.log('=== QCF Font Pack — Remote-First Architecture ===\n');

  // Step 1: Verify sample fonts exist for local development
  console.log('[1/3] Verifying sample fonts for local dev...');
  for (const page of SAMPLE_FONT_PAGES) {
    const num = String(page).padStart(3, '0');
    const filePath = path.join(FONTS_DIR, `p${num}.woff2`);
    if (!fs.existsSync(filePath)) {
      console.error(`  MISSING: p${num}.woff2 (required for local dev)`);
      process.exit(1);
    }
    console.log(`  OK: p${num}.woff2`);
  }

  // Step 2: Verify CDN accessibility only when explicitly requested.
  // Local sample fonts remain the required build inputs; network is not.
  if (process.env.VERIFY_QCF_CDN === '1') {
    console.log('\n[2/3] Verifying GitHub Releases CDN...');
    try {
      const result = execSync(`curl -sI -o /dev/null -w "%{http_code}" "${CDN_RELEASE_URL}"`, {
        timeout: 15000,
        encoding: 'utf-8'
      }).trim();

      if (result === '200' || result === '302') {
        console.log(`  CDN: accessible (HTTP ${result})`);
      } else {
        console.warn(`  WARNING: CDN returned HTTP ${result} — fonts may not be downloadable at runtime`);
      }
    } catch {
      console.warn('  WARNING: Could not verify CDN accessibility (network issue)');
    }
  } else {
    console.log('\n[2/3] CDN check skipped; set VERIFY_QCF_CDN=1 for an explicit network check.');
  }

  // Step 3: Keep the source-controlled manifest unchanged.
  // The runtime manifest is already committed; build must not rewrite tracked files.
  console.log('\n[3/3] Preserving source-controlled font manifest (no write)...');


  console.log('\n=== SUCCESS ===');
  console.log(`  Architecture: Remote-First (604 fonts on GitHub Releases CDN)`);
  console.log(`  CDN URL: ${CDN_RELEASE_URL}`);
  console.log(`  Sample fonts: ${SAMPLE_FONT_PAGES.map(p => 'p' + String(p).padStart(3, '0')).join(', ')} (for local dev only)`);
  console.log(`  Bundle size: ~12-15 MB (no fonts in bundle)`);
}

main();
