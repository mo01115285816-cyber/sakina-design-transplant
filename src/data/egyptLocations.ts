export type EgyptCity = {
  name: string;
  lat: number;
  lon: number;
};

export type EgyptGovernorate = {
  governorate: string;
  cities: EgyptCity[];
};

// Precise latitude and longitude for major cities in all 27 Egyptian Governorates!
export const egyptGovernorates: EgyptGovernorate[] = [
  {
    governorate: "القاهرة",
    cities: [
      { name: "القاهرة", lat: 30.0444, lon: 31.2357 },
      { name: "حلوان", lat: 29.8414, lon: 31.3008 },
      { name: "شبرا الخيمة", lat: 30.1286, lon: 31.2422 },
      { name: "القاهرة الجديدة", lat: 30.0300, lon: 31.4900 }
    ]
  },
  {
    governorate: "الجيزة",
    cities: [
      { name: "الجيزة", lat: 30.0131, lon: 31.2089 },
      { name: "6 أكتوبر", lat: 29.9722, lon: 30.9417 },
      { name: "الشيخ زايد", lat: 30.0142, lon: 30.9825 },
      { name: "العياط", lat: 29.6194, lon: 31.2508 }
    ]
  },
  {
    governorate: "الشرقية",
    cities: [
      { name: "الزقازيق", lat: 30.5877, lon: 31.5020 },
      { name: "فاقوس", lat: 30.7286, lon: 31.8028 },
      { name: "بلبيس", lat: 30.4181, lon: 31.5639 },
      { name: "أبو حماد", lat: 30.5367, lon: 31.6711 },
      { name: "الحسينية", lat: 30.8572, lon: 31.9172 },
      { name: "أبو كبير", lat: 30.7247, lon: 31.6703 },
      { name: "كفر صقر", lat: 30.7972, lon: 31.6111 },
      { name: "العاشر من رمضان", lat: 30.3000, lon: 31.7500 }
    ]
  },
  {
    governorate: "الدقهلية",
    cities: [
      { name: "المنصورة", lat: 31.0409, lon: 31.3785 },
      { name: "ميت غمر", lat: 30.7183, lon: 31.2614 },
      { name: "السنبلاوين", lat: 30.8878, lon: 31.4653 },
      { name: "دكرنس", lat: 31.0856, lon: 31.5936 },
      { name: "شربين", lat: 31.1917, lon: 31.5206 }
    ]
  },
  {
    governorate: "الإسكندرية",
    cities: [
      { name: "الإسكندرية", lat: 31.2001, lon: 29.9187 },
      { name: "برج العرب", lat: 30.9167, lon: 29.5833 },
      { name: "العامرية", lat: 31.0264, lon: 29.8136 }
    ]
  },
  {
    governorate: "القليوبية",
    cities: [
      { name: "بنها", lat: 30.4591, lon: 31.1856 },
      { name: "طوخ", lat: 30.3547, lon: 31.1994 },
      { name: "قليوب", lat: 30.1797, lon: 31.2069 },
      { name: "الخانكة", lat: 30.2133, lon: 31.3683 }
    ]
  },
  {
    governorate: "الغربية",
    cities: [
      { name: "طنطا", lat: 30.7865, lon: 31.0004 },
      { name: "المحلة الكبرى", lat: 30.9700, lon: 31.1661 },
      { name: "كفر الزيات", lat: 30.8242, lon: 30.8144 },
      { name: "زفتى", lat: 30.7203, lon: 31.2389 }
    ]
  },
  {
    governorate: "البحيرة",
    cities: [
      { name: "دمنهور", lat: 31.0372, lon: 30.4688 },
      { name: "كفر الدوار", lat: 31.1350, lon: 30.1333 },
      { name: "إيتاي البارود", lat: 30.8894, lon: 30.6653 },
      { name: "رشيد", lat: 31.3986, lon: 30.4194 }
    ]
  },
  {
    governorate: "المنوفية",
    cities: [
      { name: "شبين الكوم", lat: 30.5561, lon: 31.0108 },
      { name: "منوف", lat: 30.4658, lon: 30.9333 },
      { name: "أشمون", lat: 30.2911, lon: 30.9858 },
      { name: "السادات", lat: 30.3800, lon: 30.5000 }
    ]
  },
  {
    governorate: "دمياط",
    cities: [
      { name: "دمياط", lat: 31.4175, lon: 31.8144 },
      { name: "رأس البر", lat: 31.5164, lon: 31.8156 },
      { name: "فارسكور", lat: 31.3308, lon: 31.7161 }
    ]
  },
  {
    governorate: "بورسعيد",
    cities: [
      { name: "بورسعيد", lat: 31.2653, lon: 32.3019 },
      { name: "بورفؤاد", lat: 31.2483, lon: 32.3278 }
    ]
  },
  {
    governorate: "الإسماعيلية",
    cities: [
      { name: "الإسماعيلية", lat: 30.6043, lon: 32.2723 },
      { name: "القنطرة شرق", lat: 30.8550, lon: 32.3833 },
      { name: "التل الكبير", lat: 30.5631, lon: 31.7850 }
    ]
  },
  {
    governorate: "السويس",
    cities: [
      { name: "السويس", lat: 29.9668, lon: 32.5498 }
    ]
  },
  {
    governorate: "كفر الشيخ",
    cities: [
      { name: "كفر الشيخ", lat: 31.1107, lon: 30.9388 },
      { name: "دسوق", lat: 31.1308, lon: 30.6478 },
      { name: "مطوبس", lat: 31.2869, lon: 30.5217 },
      { name: "بلطيم", lat: 31.5303, lon: 31.0833 }
    ]
  },
  {
    governorate: "الفيوم",
    cities: [
      { name: "الفيوم", lat: 29.3094, lon: 30.8418 },
      { name: "سنورس", lat: 29.4086, lon: 30.8647 },
      { name: "إطسا", lat: 29.2369, lon: 30.7917 }
    ]
  },
  {
    governorate: "بني سويف",
    cities: [
      { name: "بني سويف", lat: 29.0744, lon: 31.0978 },
      { name: "الواسطى", lat: 29.3361, lon: 31.2061 },
      { name: "ببا", lat: 28.9239, lon: 30.9758 }
    ]
  },
  {
    governorate: "المنيا",
    cities: [
      { name: "المنيا", lat: 28.0991, lon: 30.7636 },
      { name: "ملوي", lat: 27.6975, lon: 30.8414 },
      { name: "بني مزار", lat: 28.4964, lon: 30.8039 },
      { name: "مغاغة", lat: 28.5986, lon: 30.8356 }
    ]
  },
  {
    governorate: "أسيوط",
    cities: [
      { name: "أسيوط", lat: 27.1783, lon: 31.1859 },
      { name: "منفلوط", lat: 27.3117, lon: 30.9703 },
      { name: "أبو تيج", lat: 27.0450, lon: 31.3197 },
      { name: "ديروط", lat: 27.4425, lon: 30.8122 }
    ]
  },
  {
    governorate: "سوهاج",
    cities: [
      { name: "سوهاج", lat: 26.5594, lon: 31.6948 },
      { name: "جرجا", lat: 26.3381, lon: 31.8889 },
      { name: "طهطا", lat: 26.7694, lon: 31.5019 },
      { name: "أخميم", lat: 26.5633, lon: 31.7458 }
    ]
  },
  {
    governorate: "قنا",
    cities: [
      { name: "قنا", lat: 26.1558, lon: 32.7161 },
      { name: "نجع حمادي", lat: 26.0494, lon: 32.2414 },
      { name: "أبو تشت", lat: 26.0600, lon: 32.0886 },
      { name: "قوص", lat: 25.9125, lon: 32.7661 }
    ]
  },
  {
    governorate: "الأقصر",
    cities: [
      { name: "الأقصر", lat: 25.6872, lon: 32.6396 },
      { name: "إسنا", lat: 25.2936, lon: 32.5564 }
    ]
  },
  {
    governorate: "أسوان",
    cities: [
      { name: "أسوان", lat: 24.0889, lon: 32.8998 },
      { name: "كوم أمبو", lat: 24.4756, lon: 32.9469 },
      { name: "إدفو", lat: 24.9781, lon: 32.8794 }
    ]
  },
  {
    governorate: "البحر الأحمر",
    cities: [
      { name: "الغردقة", lat: 27.2579, lon: 33.8116 },
      { name: "سفاجا", lat: 26.7294, lon: 33.9361 },
      { name: "القصير", lat: 26.1039, lon: 34.2758 },
      { name: "شلاتين", lat: 22.3167, lon: 36.2167 },
      { name: "مرسى علم", lat: 25.0717, lon: 34.8911 }
    ]
  },
  {
    governorate: "الوادي الجديد",
    cities: [
      { name: "الخارجة", lat: 25.4390, lon: 30.5586 },
      { name: "الداخلة", lat: 25.5000, lon: 29.1667 },
      { name: "الفرافرة", lat: 27.0583, lon: 27.9725 }
    ]
  },
  {
    governorate: "مطروح",
    cities: [
      { name: "مرسى مطروح", lat: 31.3525, lon: 27.2361 },
      { name: "سيوة", lat: 29.2025, lon: 25.5194 },
      { name: "الضبعة", lat: 31.0264, lon: 28.4350 },
      { name: "العلمين", lat: 30.8353, lon: 28.9547 }
    ]
  },
  {
    governorate: "شمال سيناء",
    cities: [
      { name: "العريش", lat: 31.1319, lon: 33.8033 },
      { name: "بئر العبد", lat: 30.9917, lon: 32.9631 },
      { name: "الشيخ زويد", lat: 31.2133, lon: 34.1136 }
    ]
  },
  {
    governorate: "جنوب سيناء",
    cities: [
      { name: "طور سيناء", lat: 28.2433, lon: 33.6231 },
      { name: "شرم الشيخ", lat: 27.9158, lon: 34.3299 },
      { name: "دهب", lat: 28.5083, lon: 34.5161 },
      { name: "نويبع", lat: 28.9667, lon: 34.6500 },
      { name: "سانت كاترين", lat: 28.5564, lon: 33.9747 }
    ]
  }
];
