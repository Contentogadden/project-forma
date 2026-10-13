import catalog from '../src/main/resources/catalog/expanded-composers.json' with { type: 'json' };
import { writeFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const clean = (value) =>
  (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const results = {};
let cursor = 0;
const requested = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--')));
const subjects = requested.size
  ? catalog.composers.filter((c) => requested.has(c.id))
  : catalog.composers;
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}
const pagesApi = new URL('https://en.wikipedia.org/w/api.php');
Object.entries({
  action: 'query',
  format: 'json',
  titles: subjects.map((c) => c.article).join('|'),
  prop: 'pageimages',
  piprop: 'original',
  redirects: '1',
}).forEach(([k, v]) => pagesApi.searchParams.set(k, v));
const pageData = await (await get(pagesApi)).json();
const pages = Object.values(pageData.query.pages);
const normalized = (title) => title.replaceAll('_', ' ');
const filenameFor = (c) => {
  const original = pages.find((p) => p.title === c.article)?.original?.source;
  return original?.includes('/wikipedia/commons/')
    ? decodeURIComponent(new URL(original).pathname.split('/').at(-1))
    : '';
};
const commonsApi = new URL('https://commons.wikimedia.org/w/api.php');
Object.entries({
  action: 'query',
  format: 'json',
  titles: subjects
    .map(filenameFor)
    .filter(Boolean)
    .map((f) => `File:${f}`)
    .join('|'),
  prop: 'imageinfo',
  iiprop: 'url|extmetadata',
  iiurlwidth: '960',
}).forEach(([k, v]) => commonsApi.searchParams.set(k, v));
const commonsData = await (await get(commonsApi)).json();
const images = Object.values(commonsData.query.pages);
async function worker() {
  while (cursor < subjects.length) {
    const composer = subjects[cursor++];
    try {
      const filename = filenameFor(composer);
      const info = images.find((p) => normalized(p.title) === normalized(`File:${filename}`))
        ?.imageinfo?.[0];
      if (!info) throw new Error('Missing image information');
      const metadata = info.extmetadata;
      const license = clean(metadata.LicenseShortName?.value);
      if (!/Public domain|CC BY(?:-SA)? [1-4]/i.test(license))
        throw new Error(`License requires separate review: ${license}`);
      const image = await get(
        process.argv.includes('--original') ? info.url : (info.thumburl ?? info.url),
      );
      const bytes = Buffer.from(await image.arrayBuffer());
      if (bytes.length < 10000 || !/^image\//.test(image.headers.get('content-type') ?? ''))
        throw new Error('Invalid image response');
      const path = new URL(`../frontend/public/composers/${composer.id}.jpg`, import.meta.url);
      if (bytes[0] === 255 && bytes[1] === 216) await writeFile(path, bytes);
      else {
        const temporary = new URL(
          `../frontend/public/composers/${composer.id}.source-image`,
          import.meta.url,
        );
        await writeFile(temporary, bytes);
        execFileSync('sips', ['-s', 'format', 'jpeg', temporary.pathname, '--out', path.pathname], {
          stdio: 'ignore',
        });
        await unlink(temporary);
      }
      results[composer.id] = {
        source: filename,
        credit:
          clean(metadata.Artist?.value) || clean(metadata.Credit?.value) || 'Автор не установлен',
        license,
        licenseUrl:
          metadata.LicenseUrl?.value ?? 'https://creativecommons.org/publicdomain/mark/1.0/',
        sourceUrl: info.descriptionurl,
      };
    } catch (error) {
      results[composer.id] = {
        source: '',
        credit: 'Типографическая карточка Forma',
        license: 'Оригинальная графика Forma',
        licenseUrl: '',
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(composer.article.replaceAll(' ', '_'))}`,
        error: error.message,
      };
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(JSON.stringify(results));
