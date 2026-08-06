const res = await fetch('https://api.quran.com/api/v4/verses/by_page/1?language=ar&words=true&fields=text_uthmani,juz_number,chapter_id,hizb_number');
const json = await res.json();
console.log(JSON.stringify(json.verses[0], null, 2));
