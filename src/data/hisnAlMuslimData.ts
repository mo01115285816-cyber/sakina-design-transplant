import rawHisnData from "./hisnAlMuslimFull.json";

export type HisnCategory = string;

export type HisnItem = {
  id: number;
  category: HisnCategory;
  text: string;
  count: number;
  source?: string;
};

// Flattened list
const hisnItems: HisnItem[] = [];

// Populate from JSON
rawHisnData.forEach((catObj: any) => {
  catObj.array.forEach((item: any) => {
    hisnItems.push({
      id: parseInt(catObj.id + '' + item.id),
      category: catObj.category,
      text: item.text,
      count: item.count || 1,
    });
  });
});

export const hisnAlMuslimData = {
  getAzkarByCategory(cat: HisnCategory): HisnItem[] {
    return hisnItems.filter((item) => item.category === cat);
  },

  getCategoriesWithCount(): [HisnCategory, number][] {
    const categories: [HisnCategory, number][] = [];
    rawHisnData.forEach((catObj: any) => {
        categories.push([catObj.category, catObj.array.length]);
    });
    return categories;
  }
};
