const res = await fetch('https://api.quran.com/api/v4/chapters');
const json = await res.json();
const pages = {};
json.chapters.forEach(c => {
  pages[c.id] = c.pages[0];
});
console.log(JSON.stringify(pages));
