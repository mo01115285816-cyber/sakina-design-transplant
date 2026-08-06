const res = await fetch('https://api.quran.com/api/v4/tafsirs/16/by_ayah/2:6');
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
