import { publicAssetUrl } from '@/utils/publicAssetUrl';

export type MushafQcfV2LineType = 'surah-header' | 'basmala' | 'text' | 'empty';

export interface MushafQcfV2Word {
  location: string;
  word: string;
  qpcV2: string;
  charType: 'word' | 'end';
}

export interface MushafQcfV2Line {
  line: number;
  type: MushafQcfV2LineType;
  isCentered: boolean;
  text?: string;
  surah?: string;
  qpcV2?: string;
  verseRange?: string;
  words?: MushafQcfV2Word[];
}

export interface MushafQcfV2Page {
  page: number;
  lines: MushafQcfV2Line[];
}

const pageCache = new Map<number, Promise<MushafQcfV2Page>>();

function pageUrl(pageNumber: number): string {
  return publicAssetUrl(`data/mushaf-v2/page-${String(pageNumber).padStart(3, '0')}.json`);
}

function validatePage(page: MushafQcfV2Page, pageNumber: number): void {
  if (page.page !== pageNumber || !Array.isArray(page.lines) || page.lines.length !== 15) {
    throw new Error(`تخطيط صفحة المصحف ${pageNumber} غير مكتمل`);
  }

  page.lines.forEach((line, index) => {
    if (line.line !== index + 1 || typeof line.isCentered !== 'boolean') {
      throw new Error(`تخطيط السطر ${index + 1} في صفحة المصحف ${pageNumber} غير صالح`);
    }

    if (line.type === 'text') {
      if (!line.text || !Array.isArray(line.words) || line.words.length === 0 || line.words.some((word) => !word.word || !word.qpcV2 || !word.location || !['word', 'end'].includes(word.charType))) {
        throw new Error(`نص السطر ${index + 1} في صفحة المصحف ${pageNumber} غير مكتمل`);
      }
      return;
    }

    if (line.type === 'basmala' && !line.qpcV2) {
      throw new Error(`بسملة صفحة المصحف ${pageNumber} غير مكتملة`);
    }

    if (line.type === 'surah-header' && (!line.surah || !line.text)) {
      throw new Error(`عنوان السورة في صفحة المصحف ${pageNumber} غير مكتمل`);
    }

    if (!['surah-header', 'basmala', 'text', 'empty'].includes(line.type)) {
      throw new Error(`نوع السطر ${index + 1} في صفحة المصحف ${pageNumber} غير معروف`);
    }
  });
}

async function loadPage(pageNumber: number): Promise<MushafQcfV2Page> {
  const response = await fetch(pageUrl(pageNumber));
  if (!response.ok) {
    throw new Error(`تعذر تحميل تخطيط صفحة المصحف ${pageNumber} (${response.status})`);
  }

  const page = await response.json() as MushafQcfV2Page;
  validatePage(page, pageNumber);
  return page;
}

export const MushafQcfV2LayoutService = {
  getPage(pageNumber: number): Promise<MushafQcfV2Page> {
    if (pageNumber < 1 || pageNumber > 604) {
      return Promise.reject(new Error(`رقم صفحة المصحف غير صالح: ${pageNumber}`));
    }

    let page = pageCache.get(pageNumber);
    if (!page) {
      page = loadPage(pageNumber).catch((error) => {
        // A transient request failure must not poison later attempts to open this page.
        pageCache.delete(pageNumber);
        throw error;
      });
      pageCache.set(pageNumber, page);
    }

    return page;
  },

  prefetchPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= 604) {
      void this.getPage(pageNumber).catch(() => undefined);
    }
  },
};
