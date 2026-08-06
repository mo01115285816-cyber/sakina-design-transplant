import localforage from 'localforage';

export type LineType = 'surah-header' | 'basmala' | 'text';

export interface MushafWord {
  location: string;
  word: string;
  qpcV2: string;
  qpcV1?: string;
}

export interface MushafLine {
  line: number;
  type: LineType;
  text?: string;
  surah?: string;
  qpcV2?: string;
  qpcV1?: string;
  verseRange?: string;
  words?: MushafWord[];
}

export interface MushafPage {
  page: number;
  lines: MushafLine[];
}

const DB_VERSION_KEY = 'mushaf_layout_version';
const DB_VERSION = 'v1_zonetecde';

const store = localforage.createInstance({
  name: 'mushaf_layout_db',
  storeName: 'pages',
  description: 'Zonetecde Mushaf Layout Dataset',
});

const metaStore = localforage.createInstance({
  name: 'mushaf_layout_db',
  storeName: 'meta',
  description: 'Mushaf Layout metadata',
});

export const MushafLayoutService = {
  store,
  metaStore,

  async isDownloaded(): Promise<boolean> {
    const version = await metaStore.getItem<string>(DB_VERSION_KEY);
    if (version !== DB_VERSION) {
      await MushafLayoutService.clearAll();
      return false;
    }
    const count = await store.length();
    return count >= 604;
  },

  async getPage(pageNumber: number): Promise<MushafPage | null> {
    return await store.getItem<MushafPage>(`page_${pageNumber}`);
  },

  async downloadAll(onProgress?: (percent: number, status: string) => void): Promise<void> {
    const totalPages = 604;
    let downloaded = 0;

    for (let i = 1; i <= totalPages; i += 10) {
      const batch: Promise<void>[] = [];
      for (let j = 0; j < 10 && i + j <= totalPages; j++) {
        const pageNum = i + j;
        batch.push(MushafLayoutService.downloadPage(pageNum));
      }
      await Promise.all(batch);
      downloaded += batch.length;

      const percent = Math.floor((downloaded / totalPages) * 100);
      let status = `تم حفظ ${downloaded} صفحة...`;
      if (downloaded < 50) status = 'جاري تحميل بيانات المصحف...';
      else if (downloaded > 550) status = 'جاري الحفظ النهائي...';
      onProgress?.(percent, status);
    }

    await metaStore.setItem(DB_VERSION_KEY, DB_VERSION);
  },

  async downloadPage(pageNumber: number): Promise<void> {
    const existing = await store.getItem<MushafPage>(`page_${pageNumber}`);
    if (existing) return;

    const padded = String(pageNumber).padStart(3, '0');
    const url = `/data/mushaf/page-${padded}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for page ${pageNumber}`);
    }
    const data: MushafPage = await response.json();
    await store.setItem(`page_${pageNumber}`, data);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      store.clear(),
      metaStore.clear(),
    ]);
  },
};
