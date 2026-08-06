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
 *   3. Updates the manifest with CDN URL reference
 *
 * The original zip packing is no longer needed since fonts are hosted on GitHub Releases.
 */

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts', 'qcf');
const MANIFEST_OUTPUT = path.join(process.cwd(), 'public', 'fonts', 'qcf-fonts-manifest.json');
const SAMPLE_FONT_PAGES = [1, 2];
const CDN_RELEASE_URL = 'https://github.com/mo01115285816-cyber/sakina/releases/download/v1.0.0-mushaf-fonts/qcf-fonts.zip';
const TOTAL_PAGES = 604;

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

  // Step 2: Verify CDN accessibility
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

  // Step 3: Update manifest
  console.log('\n[3/3] Updating font manifest...');
  const manifest = {
    version: 'v2_qcf_v1_remote',
    totalFonts: TOTAL_PAGES,
    createdAt: new Date().toISOString(),
    architecture: 'remote-first',
    cdnUrl: CDN_RELEASE_URL,
    sampleFonts: SAMPLE_FONT_PAGES.map(p => `p${String(p).padStart(3, '0')}.woff2`),
    note: 'Fonts are hosted on GitHub Releases CDN and downloaded at runtime. Only sample fonts (p001, p002) are kept locally for development.',
  };

  fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(manifest, null, 2));
  console.log(`  Manifest written: ${MANIFEST_OUTPUT}`);

  console.log('\n=== SUCCESS ===');
  console.log(`  Architecture: Remote-First (604 fonts on GitHub Releases CDN)`);
  console.log(`  CDN URL: ${CDN_RELEASE_URL}`);
  console.log(`  Sample fonts: ${SAMPLE_FONT_PAGES.map(p => 'p' + String(p).padStart(3, '0')).join(', ')} (for local dev only)`);
  console.log(`  Bundle size: ~12-15 MB (no fonts in bundle)`);
}

main();
