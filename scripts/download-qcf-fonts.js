import fs from 'fs';
import path from 'path';
import https from 'https';

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts', 'qcf');
const SURA_NAMES_PATH = path.join(process.cwd(), 'public', 'fonts', 'sura_names.woff2');
const TOTAL_PAGES = 604;
const CONCURRENCY = 8;
const MIN_FONT_SIZE = 30000;
const WOFF2_MAGIC = [0x77, 0x4F, 0x46, 0x32]; // wOF2

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function validateWoff2(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_FONT_SIZE) {
    throw new Error(`corrupt (too small): ${filePath} (${stat.size} bytes)`);
  }
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  if (buf[0] !== WOFF2_MAGIC[0] || buf[1] !== WOFF2_MAGIC[1] || buf[2] !== WOFF2_MAGIC[2] || buf[3] !== WOFF2_MAGIC[3]) {
    throw new Error(`not a valid woff2: ${filePath}`);
  }
  return true;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          try {
            validateWoff2(dest);
            resolve();
          } catch (err) {
            try { fs.unlinkSync(dest); } catch {}
            reject(err);
          }
        });
      });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

async function downloadSuraNames() {
  const url = 'https://quran.com/fonts/quran/surah-names/v1/sura_names.woff2';
  if (fs.existsSync(SURA_NAMES_PATH)) {
    try {
      const stat = fs.statSync(SURA_NAMES_PATH);
      if (stat.size >= 50000) {
        const fd = fs.openSync(SURA_NAMES_PATH, 'r');
        const buf = Buffer.alloc(4);
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);
        if (buf[0] === WOFF2_MAGIC[0] && buf[1] === WOFF2_MAGIC[1] && buf[2] === WOFF2_MAGIC[2] && buf[3] === WOFF2_MAGIC[3]) {
          console.log('[skip] sura_names.woff2 valid');
          return;
        }
      }
    } catch {}
  }
  for (let retry = 0; retry < 3; retry++) {
    try {
      await downloadFile(url, SURA_NAMES_PATH);
      console.log('[done] sura_names.woff2');
      return;
    } catch (err) {
      console.error(`[retry ${retry + 1}] sura_names failed: ${err.message}`);
      if (retry === 2) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function main() {
  ensureDir(FONTS_DIR);
  ensureDir(path.dirname(SURA_NAMES_PATH));

  console.log('=== Downloading sura_names.woff2 ===');
  await downloadSuraNames();

  console.log(`=== Downloading ${TOTAL_PAGES} QCF v2 fonts ===`);
  const pages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < pages.length; i += CONCURRENCY) {
    const batch = pages.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (page) => {
      const localName = `p${String(page).padStart(3, '0')}.woff2`;
      const remoteUrl = `https://quran.com/fonts/quran/hafs/v2/woff2/p${page}.woff2`;
      const dest = path.join(FONTS_DIR, localName);

      if (fs.existsSync(dest)) {
        try {
          validateWoff2(dest);
          completed++;
          return;
        } catch {
          try { fs.unlinkSync(dest); } catch {}
        }
      }

      for (let retry = 0; retry < 3; retry++) {
        try {
          await downloadFile(remoteUrl, dest);
          completed++;
          if (completed % 25 === 0) {
            console.log(`[progress] ${completed}/${TOTAL_PAGES} downloaded`);
          }
          return;
        } catch (err) {
          if (retry === 2) {
            console.error(`[FAIL] p${page}: ${err.message}`);
            failed++;
            return;
          }
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }));
  }

  console.log(`\n=== Final verification ===`);
  const files = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.woff2') && /^p\d{3}\.woff2$/.test(f));
  let corrupt = 0;
  for (const f of files) {
    try {
      validateWoff2(path.join(FONTS_DIR, f));
    } catch (err) {
      console.error(`[corrupt] ${err.message}`);
      corrupt++;
    }
  }

  console.log(`\nResults: ${files.length}/${TOTAL_PAGES} font files, ${failed} failed downloads, ${corrupt} corrupt`);
  console.log(`sura_names.woff2: ${fs.existsSync(SURA_NAMES_PATH) ? 'present' : 'MISSING'}`);

  if (files.length !== TOTAL_PAGES || corrupt > 0 || failed > 0) {
    console.error('FAILED: not all fonts downloaded correctly');
    process.exit(1);
  }
  console.log('SUCCESS: all 604 QCF fonts + sura_names downloaded and validated');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
