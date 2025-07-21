import { JAM_BASE_URL, GAME_IDS_FILE } from './constants.js';

import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${JAM_BASE_URL}/entries`, { waitUntil: 'networkidle' });

  let prevCount = 0;
  let games = [];

  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    games = await page.$$eval('div[data-game_id]', divs =>
      divs.map(div => ({
        id: div.getAttribute('data-game_id')
      }))
    );

    if (games.length > prevCount) {
      console.log(`Found ${games.length} games so far...`);
      for (let i = prevCount; i < games.length; i++) {
        console.log(games[i]);
      }
      prevCount = games.length;
    } else {
      break;
    }
  }

  console.log('Total games found:', games.length);

  // Write results to gameIds.json
  fs.writeFileSync(GAME_IDS_FILE, JSON.stringify(games, null, 2), 'utf-8');
  console.log('Wrote results to gameIds.json');

  await browser.close();
})();
