import { chromium } from 'playwright';
const BASE = 'http://localhost:5174/bgk-todo/';
const OUT = 'demo/manual-screenshots/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  // PIN 로그인
  const u = page.locator('text=김대윤').first();
  if (await u.isVisible({ timeout: 3000 }).catch(() => false)) { await u.click({ force: true }); await page.waitForTimeout(1000); }
  const p = page.locator('input[inputmode="numeric"], input[type="password"]').first();
  if (await p.isVisible({ timeout: 3000 }).catch(() => false)) { await p.fill('411686'); await p.press('Enter'); await page.waitForTimeout(3000); }
  console.log('로그인 완료');

  // 팝업 닫기
  await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.textContent?.includes('나중에 보기')) b.click(); }); });
  await page.waitForTimeout(500);

  // 메모 뷰로 전환 — 리스트 탭 옆의 "메모" 버튼
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if (b.textContent?.trim() === '메모') b.click(); });
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: OUT + 'crop-memo.png' });
  console.log('✅ crop-memo.png');

  await browser.close();
  console.log('Done!');
})();
