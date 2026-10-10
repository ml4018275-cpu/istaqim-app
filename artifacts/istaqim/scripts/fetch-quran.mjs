import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist';
const OUT = 'artifacts/istaqim/data';

const res = await fetch(`${BASE}/quran.json`);
if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
const raw = await res.text();
const data = JSON.parse(raw);

if (!Array.isArray(data)) {
  console.log('Unexpected file shape. Top-level keys:', Object.keys(data).slice(0, 10));
  process.exit(1);
}

const problems = [];
let total = 0;
for (const c of data) {
  const verses = c.verses;
  if (!Array.isArray(verses)) {
    problems.push(`Chapter ${c.id ?? '?'} has no verses array. Keys: ${Object.keys(c).join(',')}`);
    continue;
  }
  total += verses.length;
  if (c.total_verses !== undefined && c.total_verses !== verses.length) {
    problems.push(`Chapter ${c.id}: total_verses=${c.total_verses} but found ${verses.length}`);
  }
  for (const v of verses) {
    if (!v.text || !String(v.text).trim()) {
      problems.push(`Chapter ${c.id}, verse ${v.id ?? '?'}: empty text`);
    }
  }
}
if (data.length !== 114) problems.push(`Expected 114 chapters, found ${data.length}`);
if (total !== 6236) problems.push(`Expected 6236 verses, found ${total}`);

console.log(`Chapters: ${data.length}, Verses: ${total}`);
if (problems.length) {
  console.log('VERIFICATION FAILED:');
  problems.slice(0, 20).forEach((p) => console.log(' -', p));
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/quran.json`, raw);
await writeFile(
  `${OUT}/quran.SOURCE.json`,
  JSON.stringify(
    {
      file: 'quran.json',
      source: 'quran-json v3.1.2 (risan/quran-json)',
      url: `${BASE}/quran.json`,
      textOrigin: "The Noble Qur'an Encyclopedia (quranenc.com)",
      license: 'CC-BY-4.0 (as listed in package.json)',
      verified: 'chapters=114, verses=6236, no empty verse',
      note: 'Saved unmodified. Do not edit.',
    },
    null,
    2,
  ),
);
console.log('Saved to', OUT);
