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

  // 설정 버튼 클릭
  await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.textContent?.trim() === '설정' || b.textContent?.includes('설정')) b.click(); }); });
  await page.waitForTimeout(1000);

  // 설정 모달 안에서 "프로젝트" 탭 정확히 클릭 — 설정 사이드바의 탭 항목
  await page.evaluate(() => {
    // 설정 모달 안의 사이드바 탭 버튼 찾기
    const items = document.querySelectorAll('div, button, span');
    for (const el of items) {
      if (el.textContent?.trim() === '프로젝트' && el.offsetWidth > 0 && el.offsetWidth < 200) {
        el.click();
        console.log('프로젝트 탭 클릭');
        break;
      }
    }
  });
  await page.waitForTimeout(800);

  // 캡처
  await page.screenshot({ path: OUT + 'crop-settings-project.png', clip: { x: 200, y: 30, width: 1040, height: 780 } });
  console.log('✅ crop-settings-project.png');

  await browser.close();
  console.log('Done!');
})();
