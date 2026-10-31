// Renders the extension icons and the store visuals (scenes.html around the real captures).
// Run through store/render.sh (Docker), from anywhere.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const STORE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(STORE);
fs.mkdirSync(path.join(STORE, 'screenshots'), { recursive: true });
const icon = size => fs.readFileSync(path.join(STORE, 'icon.svg'), 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);

const browser = await chromium.launch();

// Manifest icons, transparent background
for (const size of [16, 32, 48, 128]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${icon(size)}`);
  await page.screenshot({ path: path.join(ROOT, `icons/icon-${size}.png`), omitBackground: true });
  await page.close();
}

// Chrome Web Store icon: 128x128 with the artwork at 96x96 and 16px of transparent padding
{
  const page = await browser.newPage({ viewport: { width: 128, height: 128 } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;margin:16px}</style>${icon(96)}`);
  await page.screenshot({ path: path.join(STORE, 'chrome-store-icon-128.png'), omitBackground: true });
  await page.close();
}

const scenes = [
  ['hero', 1280, 800, 'screenshots/1-qui-fait-quoi.png'],
  ['shared', 1280, 800, 'screenshots/2-une-couleur-par-personne.png'],
  ['lists', 1280, 800, 'screenshots/3-listes-et-mes-taches.png'],
  ['options', 1280, 800, 'screenshots/4-griser-ou-bordure.png'],
  ['popup', 1280, 800, 'screenshots/5-ajout-rapide.png'],
  ['promo', 440, 280, 'promo-small-440x280.png'],
  ['marquee', 1400, 560, 'promo-marquee-1400x560.png'],
];
for (const [scene, width, height, out] of scenes) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('file://' + path.join(STORE, 'scenes.html') + '#' + scene);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(STORE, out) });
  await page.close();
}

await browser.close();
console.log('rendered');
