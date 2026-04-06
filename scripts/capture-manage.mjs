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

  // 업무 추가 섹션 접기 (있으면)
  const addSection = page.locator('text=업무 추가').first();
  const addBox = await addSection.boundingBox().catch(() => null);
  if (addBox && addBox.y < 200) {
    await addSection.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // ── 1. 인라인 편집 — 리스트뷰 테이블 영역 크롭 ──
  // 첫 번째 업무 행의 셀을 클릭하여 드롭다운 표시
  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    // 상태 셀 클릭 — 드롭다운 표시
    const statusCell = firstRow.locator('td').nth(6); // 대략 상태 컬럼
    await statusCell.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  // 리스트 테이블 영역 캡처
  await page.screenshot({ path: OUT + 'crop-inline-edit.png', clip: { x: 190, y: 90, width: 1240, height: 350 } });
  console.log('✅ crop-inline-edit.png');

  // 드롭다운 닫기
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── 2. 수정 모달 — 더블클릭으로 열기 ──
  const taskCell = page.locator('table tbody tr td').nth(2); // 업무명 셀
  if (await taskCell.isVisible({ timeout: 2000 }).catch(() => false)) {
    await taskCell.dblclick({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
  }
  // 모달이 열렸으면 캡처
  const modal = page.locator('text=업무 수정').first();
  if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.screenshot({ path: OUT + 'crop-edit-modal.png', clip: { x: 250, y: 20, width: 940, height: 750 } });
    console.log('✅ crop-edit-modal.png');
    // 모달 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } else {
    console.log('  ⚠ 수정 모달 열리지 않음');
    // 전체 화면 캡처 시도
    await page.screenshot({ path: OUT + 'crop-edit-modal.png' });
    console.log('✅ crop-edit-modal.png (전체)');
  }

  // ── 3. 우클릭 메뉴 ──
  const firstTaskRow = page.locator('table tbody tr').first();
  if (await firstTaskRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    await firstTaskRow.click({ button: 'right', force: true });
    await page.waitForTimeout(500);
  }
  // 우클릭 메뉴가 열렸으면 해당 영역 캡처
  const ctxMenu = page.locator('text=편집').first();
  if (await ctxMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    const box = await ctxMenu.boundingBox();
    if (box) {
      await page.screenshot({ path: OUT + 'crop-context-menu.png', clip: { x: box.x - 40, y: box.y - 20, width: 300, height: 280 } });
      console.log('✅ crop-context-menu.png');
    }
  } else {
    console.log('  ⚠ 우클릭 메뉴 열리지 않음');
  }

  await browser.close();
  console.log('Done!');
})();
