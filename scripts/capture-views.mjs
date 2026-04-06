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

  // 팝업 닫기 — "나중에 보기" 버튼을 DOM에서 직접 클릭
  const dismissPopup = async () => {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent?.includes('나중에 보기')) { b.click(); return; }
      }
    });
    await page.waitForTimeout(500);
    // 추가로 ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  };
  await dismissPopup();

  async function switchView(label) {
    await page.evaluate((lbl) => {
      const btns = document.querySelectorAll('nav button');
      for (const btn of btns) {
        if (btn.textContent?.includes(lbl)) { btn.click(); return; }
      }
    }, label);
    await page.waitForTimeout(1500);
    await dismissPopup();
    console.log(`  뷰: ${label}`);
  }

  // ── 리스트 뷰 ──
  await page.screenshot({ path: OUT + 'crop-listview.png' });
  console.log('✅ crop-listview.png');

  // ── 인라인 편집 크롭 ──
  await page.screenshot({ path: OUT + 'crop-inline-edit.png', clip: { x: 190, y: 90, width: 1240, height: 350 } });
  console.log('✅ crop-inline-edit.png');

  // ── 칸반 뷰 ──
  await switchView('칸반');
  await page.screenshot({ path: OUT + 'crop-kanban.png' });
  console.log('✅ crop-kanban.png');

  // ── 캘린더 뷰 ──
  await switchView('캘린더');
  await page.screenshot({ path: OUT + 'crop-calendar.png' });
  console.log('✅ crop-calendar.png');

  // ── 대시보드 ──
  await switchView('대시보드');
  await page.screenshot({ path: OUT + 'crop-dashboard.png' });
  console.log('✅ crop-dashboard.png');

  await browser.close();
  console.log('Done!');
})();
