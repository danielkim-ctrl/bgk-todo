import { chromium } from 'playwright';
const BASE = 'http://localhost:5174/bgk-todo/';
const OUT = 'demo/manual-screenshots/';

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

  // 팝업 닫기
  await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.textContent?.includes('나중에 보기')) b.click(); }); });
  await page.waitForTimeout(500);

  // AI 자동 입력 탭
  await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.textContent?.includes('AI 자동 입력')) b.click(); }); });
  await page.waitForTimeout(800);

  // 텍스트 입력
  const ta = page.locator('textarea').first();
  await ta.fill(
    '김대윤 — 나라장터 계약 진행 4/10까지 긴급\n' +
    '박정찬 — 중국출장 사전간담회 자료 정리 4/8 높음\n' +
    '김혜민 — 일본 바이어 컨택 준비 4/12 보통\n' +
    '이연수 — 해외사업 4월 운영 리스트 업데이트 4/9'
  );
  await page.waitForTimeout(500);

  // TODO 자동 생성 클릭
  await page.locator('button:has-text("TODO 자동 생성")').first().click({ force: true });
  console.log('TODO 자동 생성 클릭 — AI 응답 대기...');

  // AI 응답 대기 — 결과 행이 나타날 때까지 (최대 30초)
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const hasResult = await page.evaluate(() => {
      // "4 / 4건 선택됨" 같은 텍스트 또는 체크박스가 나타나면 결과 있음
      const all = document.body.innerText;
      return all.includes('건 선택') || all.includes('등록');
    });
    if (hasResult) { console.log(`  AI 응답 완료 (${i+1}초)`); break; }
  }

  // STEP 1: 입력부 + TODO 자동생성 버튼까지 (번호 마커 포함)
  // 마커 추가
  const aiTabEl = page.locator('button:has-text("AI 자동 입력")').first();
  const fileArea = page.locator('text=파일·이미지 첨부').first();
  const todoBtnEl = page.locator('button:has-text("TODO 자동 생성")').first();

  for (const { el, n } of [
    { el: aiTabEl, n: 1 },
    { el: fileArea, n: 2 },
    { el: ta, n: 3 },
    { el: todoBtnEl, n: 4 },
  ]) {
    const box = await el.boundingBox().catch(() => null);
    if (!box) continue;
    await page.evaluate(({ x, y, n }) => {
      const m = document.createElement('div');
      m.className = 'pw-marker';
      m.textContent = String(n);
      Object.assign(m.style, {
        position:'fixed',zIndex:'99999',left:(x-32)+'px',top:(y)+'px',
        width:'28px',height:'28px',borderRadius:'50%',
        background:'#dc2626',color:'#fff',fontSize:'14px',fontWeight:'800',
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 2px 8px rgba(220,38,38,.6)',fontFamily:'system-ui,sans-serif',pointerEvents:'none',
      });
      document.body.appendChild(m);
    }, { x: box.x, y: box.y + box.height/2 - 14, n });
  }
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + 'crop-add-ai-input.png', clip: { x: 190, y: 48, width: 1240, height: 520 } });
  console.log('✅ crop-add-ai-input.png');
  await page.evaluate(() => document.querySelectorAll('.pw-marker').forEach(e => e.remove()));

  // STEP 2: 결과 미리보기 영역 캡처 — "건 선택" 텍스트 기준으로 위치 찾기
  const resultArea = page.locator('text=건 선택').first();
  const resultBox = await resultArea.boundingBox().catch(() => null);
  if (resultBox) {
    const startY = Math.max(resultBox.y - 60, 0);

    // 결과 영역에 마커 추가
    // ⑤ 일괄배정 드롭다운
    const batchBtns = page.locator('text=프로젝트 >>nth=0');
    // ⑥ 개별 행
    // ⑦ 등록 버튼
    const registerBtn = page.locator('button:has-text("등록")').first();

    for (const { el, n, offY } of [
      { el: resultArea, n: 5, offY: 0 },
      { el: registerBtn, n: 6, offY: 0 },
    ]) {
      const box = await el.boundingBox().catch(() => null);
      if (!box) continue;
      await page.evaluate(({ x, y, n }) => {
        const m = document.createElement('div');
        m.className = 'pw-marker';
        m.textContent = String(n);
        Object.assign(m.style, {
          position:'fixed',zIndex:'99999',left:(x-32)+'px',top:(y)+'px',
          width:'28px',height:'28px',borderRadius:'50%',
          background:'#dc2626',color:'#fff',fontSize:'14px',fontWeight:'800',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 2px 8px rgba(220,38,38,.6)',fontFamily:'system-ui,sans-serif',pointerEvents:'none',
        });
        document.body.appendChild(m);
      }, { x: box.x, y: box.y + box.height/2 - 14 + (offY||0), n });
    }

    await page.waitForTimeout(200);
    await page.screenshot({ path: OUT + 'crop-add-ai-result.png', clip: { x: 190, y: startY, width: 1240, height: 500 } });
    console.log('✅ crop-add-ai-result.png');
  } else {
    console.log('⚠ 결과 영역 못 찾음');
    await page.screenshot({ path: OUT + 'crop-add-ai-result.png' });
  }

  await browser.close();
  console.log('Done!');
})();
