import { chromium } from 'playwright';
import fs from 'fs';
import {
  JAM_BASE_URL,
  GAME_IDS_FILE,
  GAME_PAGES_FILE,
  RATE_PATH,
  PLAY_BTN_SELECTOR
} from './constants.js';

const games = JSON.parse(fs.readFileSync(GAME_IDS_FILE, 'utf-8'));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const results = [];

for (const { id } of games) {
  const url = `${JAM_BASE_URL}/${RATE_PATH}/${id}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extract the href of <a class="button fat play_btn">
    const playHref = await page.$eval(
      PLAY_BTN_SELECTOR,
      el => el.href
    );

    results.push({ id, page: playHref });
    console.log(`Found play page for id ${id}: ${playHref}`);
  } catch (e) {
    results.push({ id, page: null });
    console.log(`No play_btn found for id ${id}`);
  }
}

await browser.close();

fs.writeFileSync(GAME_PAGES_FILE, JSON.stringify(results, null, 2), 'utf-8');
console.log(`Wrote results to ${GAME_PAGES_FILE}`);
