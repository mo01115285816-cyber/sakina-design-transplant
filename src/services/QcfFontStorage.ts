import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import localforage from 'localforage';

const FONTS_DIR_NAME = 'qcf-fonts';
const EXTRACTION_FLAG_KEY = 'qcf_fonts_extracted_v1';
const REMOTE_ZIP_URL = 'https://github.com/mo01115285816-cyber/sakina/releases/download/v1.0.0-mushaf-fonts/qcf-fonts.zip';
const RAW_FONT_BASE_URL = 'https://raw.githubusercontent.com/mo01115285816-cyber/sakina/main/public/fonts/qcf';

type Platform = 'web' | 'native';

function getPlatform(): Platform {
  try {
    return Capacitor.isNativePlatform() ? 'native' : 'web';
  } catch {
    return 'web';
  }
}

// Lazy-load the Zip plugin only on native platforms to avoid Vite web bundle errors
async function getZipPlugin(): Promise<any> {
  const moduleName = '@capgo/capacitor-zip';
  // Use indirect dynamic import to prevent Vite from pre-bundling this
  // native-only plugin into the web bundle.
  const mod = await (Function('m', 'return import(m)')(moduleName));
  return mod.CapacitorZip;
}

// Create a dedicated IndexedDB store for permanent offline font caching on Web (PWA)
const webFontStore = localforage.createInstance({
  name: 'sakina_quran_fonts',
  storeName: 'qcf_fonts_store',
  description: 'Permanent Offline QCF v2 Mushaf Fonts for Web PWA',
});

function fontFileName(pageNumber: number): string {
  return `p${String(pageNumber).padStart(3, '0')}.woff2`;
}

function fontId(pageNumber: number): string {
  return `QCF_P${String(pageNumber).padStart(3, '0')}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as unknown as number[]);
  }
  return btoa(binary);
}

export const QcfFontStorage = {
  getPlatform,

  async isExtracted(): Promise<boolean> {
    if (getPlatform() !== 'native') {
      // On Web PWA: check dynamic storage in IndexedDB per-page on read
      return true;
    }
    try {
      const flag = localStorage.getItem(EXTRACTION_FLAG_KEY);
      if (flag !== 'true') return false;

      // Physical integrity check for page 1 font file in device storage
      const samplePath = `${FONTS_DIR_NAME}/${fontFileName(1)}`;
      try {
        const stat = await Filesystem.stat({
          path: samplePath,
          directory: Directory.Data,
        });
        return stat.size >= 30000;
      } catch {
        localStorage.removeItem(EXTRACTION_FLAG_KEY);
        return false;
      }
    } catch {
      return false;
    }
  },

  async extractFonts(
    onProgress?: (percent: number, status: string) => void
  ): Promise<void> {
    if (getPlatform() !== 'native') {
      onProgress?.(100, 'الخطوط جاهزة للعمل على متصفح الويب');
      return;
    }

    if (await this.isExtracted()) {
      onProgress?.(100, 'خطوط المصحف جاهزة ومخزنة في ذاكرة الهاتف');
      return;
    }

    onProgress?.(5, 'جاري الاتصال بالخادم السحابي لخطوط المصحف الشريف...');

    try {
      await Filesystem.mkdir({
        path: FONTS_DIR_NAME,
        directory: Directory.Data,
        recursive: true,
      });
    } catch {
      // Directory may already exist
    }

    const zipTempPath = 'qcf-fonts.zip';

    try {
      onProgress?.(15, 'جاري تنزيل حزمة خطوط المصحف الشريف (97 ميجابايت)...');

      // Fetch the compressed package directly from GitHub Releases CDN
      const response = await fetch(REMOTE_ZIP_URL);
      if (!response.ok) {
        throw new Error(`تعذر الاتصال بخادم الخطوط (HTTP ${response.status})`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      let downloadedBytes = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            downloadedBytes += value.length;
            if (totalBytes > 0) {
              const fetchPercent = 15 + Math.floor((downloadedBytes / totalBytes) * 45); // 15% -> 60%
              onProgress?.(fetchPercent, `تنزيل الخطوط: ${Math.round((downloadedBytes / 1024 / 1024) * 10) / 10} ميجا / ${Math.round((totalBytes / 1024 / 1024) * 10) / 10} ميجا...`);
            }
          }
        }
      } else {
        const blob = await response.blob();
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
      }

      onProgress?.(65, 'جاري حفظ الحزمة المضغوطة في ذاكرة الهاتف الدائمة...');

      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        combinedBuffer.set(c, offset);
        offset += c.length;
      }

      const zipBase64 = arrayBufferToBase64(combinedBuffer.buffer);

      await Filesystem.writeFile({
        path: zipTempPath,
        data: zipBase64,
        directory: Directory.Data,
        recursive: true,
      });

      onProgress?.(75, 'جاري فك ضغط وتجهيز 604 صفحة للمصحف الشريف...');

      // Unzip in Directory.Data on Android and iOS
      const Zip = await getZipPlugin();
      const zipFileUri = await Filesystem.getUri({
        path: zipTempPath,
        directory: Directory.Data,
      });
      const targetDirUri = await Filesystem.getUri({
        path: FONTS_DIR_NAME,
        directory: Directory.Data,
      });

      await Zip.unzip({
        source: zipFileUri.uri,
        destination: targetDirUri.uri,
      });

      onProgress?.(92, 'التحقق من سلامة جودة الحروف وعلامات التجويد...');

      // Strict verification: ensure extracted files are not corrupted
      const sampleStat = await Filesystem.stat({
        path: `${FONTS_DIR_NAME}/${fontFileName(1)}`,
        directory: Directory.Data,
      });
      if (sampleStat.size < 30000) {
        throw new Error(`ملف الخط المستخرج غير مكتمل أو تالف (${sampleStat.size} بايت)`);
      }

      onProgress?.(97, 'جاري تنظيف الملفات المؤقتة لتوفير مساحة الهاتف...');
      try {
        await Filesystem.deleteFile({
          path: zipTempPath,
          directory: Directory.Data,
        });
      } catch {
        // Ignore non-critical cleanup errors
      }

      localStorage.setItem(EXTRACTION_FLAG_KEY, 'true');
      onProgress?.(100, 'اكتمل تنزيل وتجهيز خطوط المصحف بنجاح');

    } catch (err) {
      // Automatic reverse cleanup on network failure or error
      try {
        await Filesystem.deleteFile({ path: zipTempPath, directory: Directory.Data });
      } catch {}
      try {
        await Filesystem.rmdir({ path: FONTS_DIR_NAME, directory: Directory.Data, recursive: true });
      } catch {}
      localStorage.removeItem(EXTRACTION_FLAG_KEY);
      throw new Error(`فشل تنزيل وتجهيز خطوط المصحف: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  async clearExtractedFonts(): Promise<void> {
    if (getPlatform() === 'native') {
      try {
        await Filesystem.rmdir({ path: FONTS_DIR_NAME, directory: Directory.Data, recursive: true });
      } catch {}
      localStorage.removeItem(EXTRACTION_FLAG_KEY);
    } else {
      await webFontStore.clear();
    }
  },

  async readFontAsBlobUrl(pageNumber: number): Promise<string> {
    const platform = getPlatform();
    const fileName = fontFileName(pageNumber);

    if (platform === 'native') {
      // Fast direct read from device internal permanent storage (Capacitor Data Directory)
      const filePath = `${FONTS_DIR_NAME}/${fileName}`;
      try {
        const result = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Data,
        });
        const byteCharacters = atob(result.data as string);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'font/woff2' });
        return URL.createObjectURL(blob);
      } catch (err) {
        throw new Error(`تعذر قراءة خط الصفحة ${pageNumber} من ذاكرة الهاتف`);
      }
    }

    // On Web PWA: check IndexedDB permanent storage first
    try {
      const cachedBuffer = await webFontStore.getItem<ArrayBuffer>(fileName);
      if (cachedBuffer) {
        const blob = new Blob([cachedBuffer], { type: 'font/woff2' });
        return URL.createObjectURL(blob);
      }

      // If not cached, fetch from server and store in IndexedDB for permanent offline use
      const fetchUrls = [
        `/fonts/qcf/${fileName}`, // Local dev build check
        `${RAW_FONT_BASE_URL}/${fileName}` // Cloud fetch from GitHub CDN
      ];

      for (const url of fetchUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            if (buffer.byteLength >= 30000) {
              await webFontStore.setItem(fileName, buffer);
              const blob = new Blob([buffer], { type: 'font/woff2' });
              return URL.createObjectURL(blob);
            }
          }
        } catch {}
      }
      throw new Error(`فشل جلب خط الصفحة ${pageNumber} من الخادم السحابي`);
    } catch (err) {
      throw new Error(`خطأ في تهيئة خط الصفحة ${pageNumber}: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  fontId,
  fontFileName,
};
