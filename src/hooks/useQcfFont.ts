import { useEffect, useState } from 'react';
import { QcfFontStorage } from '@/services/QcfFontStorage';

const loadedFonts = new Map<string, string>();

export function prefetchQcfFont(pageNumber: number): void {
  const family = QcfFontStorage.fontId(pageNumber);
  if (loadedFonts.has(family)) return;
  QcfFontStorage.readFontAsBlobUrl(pageNumber)
    .then((url) => {
      const fontFace = new FontFace(family, `url(${url}) format('woff2')`, { display: 'block' });
      fontFace.load().then((loaded) => {
        document.fonts.add(loaded);
        loadedFonts.set(family, url);
      });
    })
    .catch(() => {});
}

export function useQcfFont(pageNumber: number): boolean {
  const fontFamily = pageNumber >= 1 && pageNumber <= 604 ? QcfFontStorage.fontId(pageNumber) : null;
  const [isLoaded, setIsLoaded] = useState<boolean>(() => (fontFamily ? loadedFonts.has(fontFamily) : false));

  useEffect(() => {
    if (!fontFamily) return;
    if (loadedFonts.has(fontFamily)) {
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    setIsLoaded(false);

    QcfFontStorage.readFontAsBlobUrl(pageNumber)
      .then(async (url) => {
        const fontFace = new FontFace(fontFamily, `url(${url}) format('woff2')`, { display: 'block' });
        const loaded = await fontFace.load();
        document.fonts.add(loaded);
        loadedFonts.set(fontFamily, url);
        if (!cancelled) setIsLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) console.error(`فشل جلب أو تركيب خط الصفحة ${pageNumber}:`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [pageNumber, fontFamily]);

  return isLoaded;
}

export function isQcfFontLoaded(pageNumber: number): boolean {
  if (!pageNumber || pageNumber < 1 || pageNumber > 604) return false;
  return loadedFonts.has(QcfFontStorage.fontId(pageNumber));
}

export function areFontsExtracted(): Promise<boolean> {
  return QcfFontStorage.isExtracted();
}
