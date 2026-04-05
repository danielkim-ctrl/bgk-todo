import { chromium } from 'playwright';

const BASE = 'http://localhost:5175/bgk-todo/';
const DIR = 'demo/manual-screenshots/';

// Playwright locator → boundingBox → 주석 좌표 수집
async function getBox(page, locatorOrSel) {
  try {
    const loc = typeof locatorOrSel === 'string' ? page.locator(locatorOrSel) : locatorOrSel;
    const box = await loc.first().boundingBox({ timeout: 3000 });
    return box; // {x,y,width,height}
  } catch { return null; }
}

// 좌표 배열로 주석 그리기
async function drawAnnotations(page, items) {
  await page.evaluate((items) => {
    document.querySelectorAll('.ma').forEach(el => el.remove());
    const css = document.createElement('style');
    css.className = 'ma';
    css.textContent = `.ma-box{position:fixed;border:2.5px solid #ef4444;border-radius:6px;z-index:99999;pointer-events:none;background:rgba(239,68,68,.05)}.ma-num{position:fixed;width:26px;height:26px;border-radius:50%;background:#ef4444;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:99999;pointer-events:none;font-family:Pretendard,system-ui,sans-serif;box-shadow:0 2px 8px rgba(239,68,68,.35)}.ma-lbl{position:fixed;background:#1e293b;color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;z-index:99999;pointer-events:none;white-space:nowrap;font-family:Pretendard,system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.18)}`;
    document.body.appendChild(css);

    items.forEach(({ x, y, w, h, num, label, lp }) => {
      if (w && h) {
        const b = document.createElement('div'); b.className = 'ma ma-box';
        Object.assign(b.style, { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });
        document.body.appendChild(b);
      }
      if (num !== undefined) {
        const c = document.createElement('div'); c.className = 'ma ma-num';
        Object.assign(c.style, { left: (x-13)+'px', top: (y-13)+'px' });
        c.textContent = String(num);
        document.body.appendChild(c);
      }
      if (label) {
        const l = document.createElement('div'); l.className = 'ma ma-lbl';
        if (lp === 'bottom') Object.assign(l.style, { left: x+'px', top: (y+(h||0)+6)+'px' });
        else if (lp === 'left') Object.assign(l.style, { left: (x-8)+'px', top: (y+(h||0)/2-11)+'px', transform:'translateX(-100%)' });
        else Object.assign(l.style, { left: (x+(w||0)+8)+'px', top: (y+(h||0)/2-11)+'px' });
        l.textContent = label;
        document.body.appendChild(l);
      }
    });
  }, items);
}

async function clear(page) {
  await page.evaluate(() => document.querySelectorAll('.ma').forEach(el => el.remove()));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── 1. 로그인 ──
  await page.goto(BASE);
  await page.waitForTimeout(2500);
  // "팀 TODO 통합관리" 텍스트 근처의 카드 영역
  const loginCard = await getBox(page, 'text=팀 TODO 통합관리');
  const firstTeam = await getBox(page, 'text=경영기획조정팀');
  const kimBtn = await getBox(page, 'text=김대윤');
  await drawAnnotations(page, [
    ...(firstTeam ? [{ x: firstTeam.x - 20, y: firstTeam.y - 10, w: firstTeam.width + 500, h: 400, num: 1, label: '팀별 사용자 목록', lp: 'bottom' }] : []),
    ...(kimBtn ? [{ x: kimBtn.x, y: kimBtn.y, w: kimBtn.width, h: kimBtn.height, num: 2, label: '내 이름 클릭', lp: 'right' }] : []),
  ]);
  await page.screenshot({ path: `${DIR}01-login.png` });
  console.log('1. 로그인');
  await clear(page);

  // ── 2. PIN 입력 ──
  await page.locator('text=김대윤').first().click();
  await page.waitForTimeout(1200);
  const pinInput = await getBox(page, 'input');
  const loginBtn = await getBox(page, 'button:has-text("로그인")');
  await drawAnnotations(page, [
    ...(pinInput ? [{ x: pinInput.x, y: pinInput.y, w: pinInput.width, h: pinInput.height, num: 1, label: '6자리 PIN 입력', lp: 'right' }] : []),
    ...(loginBtn ? [{ x: loginBtn.x, y: loginBtn.y, w: loginBtn.width, h: loginBtn.height, num: 2, label: '로그인 클릭', lp: 'right' }] : []),
  ]);
  await page.screenshot({ path: `${DIR}02-pin.png` });
  console.log('2. PIN');
  await clear(page);

  // 로그인 실행
  await page.locator('input').first().fill('411686');
  await page.locator('button:has-text("로그인")').first().click();
  await page.waitForTimeout(3000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // ── 3. 리스트 뷰 ──
  const hdr = await getBox(page, 'header');
  const tabList = await getBox(page, 'button:has-text("리스트")');
  await drawAnnotations(page, [
    ...(hdr ? [{ x: hdr.x, y: hdr.y, w: hdr.width, h: hdr.height, num: 1, label: '헤더: 팀 전환, 설정, 사용자 정보', lp: 'bottom' }] : []),
    ...(tabList ? [{ x: tabList.x - 100, y: tabList.y, w: 400, h: tabList.height, num: 2, label: '뷰 전환 탭 (대시보드/리스트/캘린더/칸반)', lp: 'right' }] : []),
  ]);
  await page.screenshot({ path: `${DIR}03-listview.png` });
  console.log('3. 리스트 뷰');
  await clear(page);

  // ── 4. 직접 입력 ──
  await page.locator('button:has-text("직접 입력")').first().click();
  await page.waitForTimeout(1500);
  const directTab = await getBox(page, 'button:has-text("직접 입력")');
  const aiTab = await getBox(page, 'button:has-text("AI 자동 입력")');
  const tplTab = await getBox(page, 'button:has-text("템플릿")');
  await drawAnnotations(page, [
    ...(directTab ? [{ x: directTab.x, y: directTab.y, w: directTab.width, h: directTab.height, num: 1, label: '직접 입력', lp: 'bottom' }] : []),
    ...(aiTab ? [{ x: aiTab.x, y: aiTab.y, w: aiTab.width, h: aiTab.height, num: 2, label: 'AI 자동 입력', lp: 'bottom' }] : []),
    ...(tplTab ? [{ x: tplTab.x, y: tplTab.y, w: tplTab.width, h: tplTab.height, num: 3, label: '템플릿', lp: 'bottom' }] : []),
  ]);
  await page.screenshot({ path: `${DIR}04-add-manual.png` });
  console.log('4. 직접 입력');
  await clear(page);

  // ── 5. AI ──
  await page.locator('button:has-text("AI 자동 입력")').first().click();
  await page.waitForTimeout(1000);
  const ta = await getBox(page, 'textarea');
  const genBtn = await getBox(page, 'button:has-text("TODO 자동 생성")');
  await drawAnnotations(page, [
    ...(ta ? [{ x: ta.x, y: ta.y, w: ta.width, h: ta.height, num: 1, label: '텍스트 입력 또는 파일 첨부', lp: 'right' }] : []),
    ...(genBtn ? [{ x: genBtn.x, y: genBtn.y, w: genBtn.width, h: genBtn.height, num: 2, label: 'TODO 자동 생성', lp: 'right' }] : []),
  ]);
  await page.screenshot({ path: `${DIR}05-add-ai.png` });
  console.log('5. AI');
  await clear(page);

  // ── 6. 템플릿 ──
  await page.locator('button:has-text("템플릿")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}06-add-template.png` });
  console.log('6. 템플릿');
  await page.locator('button:has-text("템플릿")').first().click();
  await page.waitForTimeout(500);

  // ── 7. 캘린더 ──
  await page.locator('button:has-text("캘린더")').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}07-calendar.png` });
  console.log('7. 캘린더');

  // ── 8. 칸반 ──
  await page.locator('button:has-text("칸반")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}08-kanban.png` });
  console.log('8. 칸반');

  // ── 9. 대시보드 ──
  await page.locator('button:has-text("대시보드")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}09-dashboard.png` });
  console.log('9. 대시보드');

  // ── 10. 설정 ──
  await page.locator('button:has-text("리스트")').first().click();
  await page.waitForTimeout(1000);
  const allBtns = page.locator('button');
  for (let i = 0; i < await allBtns.count(); i++) {
    const b = allBtns.nth(i);
    if (await b.isVisible()) {
      const title = await b.getAttribute('title');
      if (title && title.includes('설정')) { await b.click(); break; }
    }
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}10-settings.png` });
  console.log('10. 설정');

  await browser.close();
  console.log('\n완료!');
})();
