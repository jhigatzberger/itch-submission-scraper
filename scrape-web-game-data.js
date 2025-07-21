import { chromium } from 'playwright';
import fs from 'fs/promises';

// --- Existing engine check ---
async function checkIframeForEngine(iframe) {
  const scripts = await iframe.$$eval('script', scripts =>
    scripts.map(s => s.textContent || '')
  );
  if (scripts.some(s => s.includes('GODOT_CONFIG'))) return 'godot';
  if (scripts.some(s => s.includes('unity-canvas'))) return 'unity';
  // Add more checks here as needed!
  return 'unknown';
}

async function checkGodotInIframe(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const loadBtn = await page.$('.load_iframe_btn');
  if (loadBtn) {
    await loadBtn.click();
    await page.waitForSelector('iframe', { timeout: 10000 });
  }

  const iframeElement = await page.$('iframe');
  if (!iframeElement) {
    await browser.close();
    return 'not web';
  }
  const iframe = await iframeElement.contentFrame();
  if (!iframe) {
    await browser.close();
    return 'not web';
  }
  await iframe.waitForLoadState('domcontentloaded');
  const engine = await checkIframeForEngine(iframe);
  console.log(`Detected engine: ${engine}`);
  await browser.close();
  return engine;
}

// --- NEW FUNCTION: annotate game pages with engine type ---
async function annotateGamePagesWithEngine() {
  // Load input
  const raw = await fs.readFile('gamePages.json', 'utf-8');
  const pages = JSON.parse(raw);

  const out = [];
  let idx = 0;
  for (const { id, page } of pages) {
    idx++;
    let engine = 'not web';
    if (page) {
      console.log(`[${idx}/${pages.length}] Checking ${page} ...`);
      try {
        engine = await checkGodotInIframe(page);
      } catch (e) {
        console.log(`  Error on ${page}:`, e.message);
        engine = 'error';
      }
    } else {
      console.log(`[${idx}/${pages.length}] No web page for id ${id}`);
    }
    out.push({ id, page, engine });
  }

  // Save output
  await fs.writeFile('gamePagesWithEngine.json', JSON.stringify(out, null, 2), 'utf-8');
  console.log('Wrote results to gamePagesWithEngine.json');
}

// --- Uncomment below to run directly ---
await annotateGamePagesWithEngine();

// --- Or, if you want to still check a single page manually, keep this ---
// const result = await checkGodotInIframe(GAME_PAGE_URL);
// console.log(`Detected: ${result}`);
