import { chromium } from 'playwright';
const BASE = 'http://localhost:5174/bgk-todo/';
const OUT = 'demo/manual-screenshots/';

async function addMarker(page, locator, n, opts = {}) {
  const { offX = 0, offY = -26, side = 'top' } = opts;
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const box = await el.boundingBox().catch(() => null);
  if (!box) { console.log(`  ⚠ #${n} not found`); return; }
  let x = box.x + box.width / 2 - 14 + offX;
  let y = side === 'left' ? box.y + box.height / 2 - 14 : box.y + offY;
  if (side === 'left') x = box.x - 32 + offX;
  await page.evaluate(({ x, y, n }) => {
    const m = document.createElement('div');
    m.className = 'pw-marker';
    m.textContent = String(n);
    Object.assign(m.style, {
      position:'fixed',zIndex:'99999',left:x+'px',top:y+'px',
      width:'28px',height:'28px',borderRadius:'50%',
      background:'#dc2626',color:'#fff',fontSize:'14px',fontWeight:'800',
      display:'flex',alignItems:'center',justifyContent:'center',
      boxShadow:'0 2px 8px rgba(220,38,38,.6)',
      fontFamily:'system-ui,sans-serif',pointerEvents:'none',
    });
    document.body.appendChild(m);
  }, { x, y, n });
}
async function clear(page) {
  await page.evaluate(() => document.querySelectorAll('.pw-marker').forEach(e => e.remove()));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.waitForTimeout(2000);

  // PIN 로그인
  const u = page.locator('text=김대윤').first();
  if (await u.isVisible({ timeout: 3000 }).catch(() => false)) { await u.click({ force: true }); await page.waitForTimeout(1000); }
  const p = page.locator('input[inputmode="numeric"], input[type="password"]').first();
  if (await p.isVisible({ timeout: 3000 }).catch(() => false)) { await p.fill('411686'); await p.press('Enter'); await page.waitForTimeout(3000); }
  console.log('로그인 완료');

  const clipBase = { x: 190, y: 48, width: 1240 };

  // ══ 직접 입력 ══
  await page.locator('button:has-text("직접 입력")').first().click({ force: true });
  await page.waitForTimeout(800);
  await page.locator('button:has-text("행 추가")').first().click({ force: true });
  await page.waitForTimeout(500);

  await addMarker(page, 'button:has-text("직접 입력")', 1);
  await addMarker(page, 'button:has-text("저장")', 2);

  // 입력 행 — 헤더 텍스트("프로젝트", "업무내용*" 등) 바로 아래에 있는 실제 입력 필드
  // 프로젝트 select — 첫 번째 select 중 "프로젝트" 텍스트가 option에 있는 것
  const allSelects = page.locator('select');
  const selectCount = await allSelects.count();
  // 입력 행에 있는 select들 — y좌표가 200 이상인 것만
  for (let i = 0; i < selectCount; i++) {
    const box = await allSelects.nth(i).boundingBox().catch(() => null);
    if (box && box.y > 200 && box.y < 350) {
      const val = await allSelects.nth(i).inputValue().catch(() => '');
      const options = await allSelects.nth(i).locator('option').allTextContents();
      // 프로젝트 select: option에 "프로젝트" 포함
      if (options.some(o => o.includes('프로젝트') || o === '프로젝트')) {
        await addMarker(page, allSelects.nth(i), 3);
      }
      // 담당자: option에 사람 이름 포함
      else if (options.some(o => o.includes('김대윤'))) {
        await addMarker(page, allSelects.nth(i), 6);
      }
      // 우선순위: option에 "보통" 포함
      else if (options.some(o => o.includes('보통'))) {
        await addMarker(page, allSelects.nth(i), 8);
      }
    }
  }
  await addMarker(page, 'input[placeholder*="필수"], input[placeholder*="업무내용"]', 4);
  await addMarker(page, 'text=상세내용...', 5);
  // 마감기한 — input[type="date"] 또는 "날짜 선택" placeholder
  await addMarker(page, 'input[type="date"]', 7);
  // 반복 — 반복 관련 요소
  await addMarker(page, 'button:has-text("반복")', 9);

  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + 'crop-add-manual.png', clip: { ...clipBase, height: 280 } });
  console.log('✅ crop-add-manual.png');
  await clear(page);

  // ══ AI 자동 입력 ══
  await page.locator('button:has-text("AI 자동 입력")').first().click({ force: true });
  await page.waitForTimeout(800);
  const ta = page.locator('textarea').first();
  if (await ta.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ta.fill('김대윤 — 계약서 검토 4/10까지\n박정찬 — 발주서 작성 긴급');
    await page.waitForTimeout(300);
  }
  await addMarker(page, 'button:has-text("AI 자동 입력")', 1);
  await addMarker(page, 'text=파일·이미지 첨부', 2, { side: 'left' });
  await addMarker(page, 'textarea', 3, { side: 'left' });
  await addMarker(page, 'button:has-text("TODO 자동 생성")', 4, { side: 'left' });
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + 'crop-add-ai-input.png', clip: { ...clipBase, height: 600 } });
  console.log('✅ crop-add-ai-input.png');
  await clear(page);

  // ══ 템플릿 ══
  await page.locator('button:has-text("템플릿")').first().click({ force: true });
  await page.waitForTimeout(800);
  await addMarker(page, 'button:has-text("템플릿")', 1);
  await addMarker(page, 'input[placeholder*="검색"]', 2, { side: 'left' });
  await addMarker(page, 'button:has-text("적용")', 3, { side: 'left' });
  // "새 템플릿 만들기" — 텍스트로 찾기
  const newTpl = page.locator('text=새 템플릿 만들기').first();
  if (await newTpl.isVisible({ timeout: 1000 }).catch(() => false)) {
    await addMarker(page, newTpl, 4, { side: 'left' });
  }
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + 'crop-add-template.png', clip: { ...clipBase, height: 370 } });
  console.log('✅ crop-add-template.png');

  await browser.close();
  console.log('Done!');
})();
