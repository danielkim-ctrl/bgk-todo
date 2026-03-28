import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const BASE_URL = "http://localhost:5177";

// ESM-safe __dirname
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const SCREENSHOT_DIR = path.join(_dirname, "screenshots");

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function gotoApp(page: Page) {
  // Use domcontentloaded instead of networkidle - Firestore keeps sockets open indefinitely
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  // Wait for React to hydrate (look for any button on the page)
  await page.waitForSelector("button", { timeout: 15000 });
}

test.describe("BGK Todo App - QA Check", () => {
  test.use({ baseURL: BASE_URL });

  // ──────────────────────────────────────────────────────────────
  // 01. Login Screen
  // ──────────────────────────────────────────────────────────────
  test("01 - Login screen loads and shows member list", async ({ page }) => {
    await gotoApp(page);
    await shot(page, "01_login_screen");

    // Check header logo area
    const header = page.locator("div").filter({ hasText: "팀 TODO 통합관리" }).first();
    await expect(header).toBeVisible({ timeout: 10000 });

    // Check at least one member button is visible
    const memberButtons = page.locator("button").filter({ hasText: /김|박|이|복/ });
    const count = await memberButtons.count();
    console.log(`Found ${count} member buttons`);
    expect(count).toBeGreaterThan(0);

    await shot(page, "01b_login_buttons");
  });

  // ──────────────────────────────────────────────────────────────
  // 02. Login as first user
  // ──────────────────────────────────────────────────────────────
  test("02 - Login as first available user (김대윤)", async ({ page }) => {
    await gotoApp(page);

    // Click the first member button
    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await shot(page, "02a_before_login");
    await memberBtn.click();

    // Wait for the main app to load
    await page.waitForSelector("nav", { timeout: 10000 });
    await shot(page, "02b_after_login");

    // Verify navigation is visible
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    console.log("Login successful - nav is visible");
  });

  // ──────────────────────────────────────────────────────────────
  // 03. List View — initial state
  // ──────────────────────────────────────────────────────────────
  test("03 - List view loads with todo items", async ({ page }) => {
    await gotoApp(page);

    // Login first
    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    // Click on 리스트 nav
    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.waitFor({ timeout: 5000 });
    await listBtn.click();
    await page.waitForTimeout(500);

    await shot(page, "03_list_view");

    // Check that there are table rows
    const rows = page.locator("table tbody tr, [role='row']");
    const rowCount = await rows.count();
    console.log(`List view row count: ${rowCount}`);

    // Check for todo items rendered
    const todoTasks = page.locator("td").filter({ hasText: /중국|시안|참가/ });
    const taskCount = await todoTasks.count();
    console.log(`Task cells found: ${taskCount}`);
  });

  // ──────────────────────────────────────────────────────────────
  // 04. Sidebar visible in list view
  // ──────────────────────────────────────────────────────────────
  test("04 - Sidebar filters visible", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "04a_sidebar");

    // Look for filter reset button
    const filterReset = page.locator("button").filter({ hasText: /필터 초기화/ }).first();
    const filterResetVisible = await filterReset.isVisible();
    console.log(`Filter reset button visible: ${filterResetVisible}`);

    // Look for project filter items
    const projectItems = page.locator("div").filter({ hasText: /만화웹툰|유녹|WATER/ });
    const projCount = await projectItems.count();
    console.log(`Project filter items found: ${projCount}`);

    await shot(page, "04b_sidebar_detail");
  });

  // ──────────────────────────────────────────────────────────────
  // 05. Add a new todo item
  // ──────────────────────────────────────────────────────────────
  test("05 - Add a new todo item via direct input", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    // Click "직접 입력" (manual input tab)
    const manualTab = page.locator("button").filter({ hasText: /직접 입력/ }).first();
    if (await manualTab.isVisible()) {
      await manualTab.click();
      await page.waitForTimeout(300);
      console.log("Clicked manual input tab");
    }

    await shot(page, "05a_before_add_row");

    // Click "+ 행 추가" button
    const addRowBtn = page.locator("button").filter({ hasText: /행 추가/ }).first();
    if (await addRowBtn.isVisible()) {
      await addRowBtn.click();
      await page.waitForTimeout(300);
      console.log("Clicked add row button");
    }

    await shot(page, "05b_new_row_added");

    // Type in the task name input
    const taskInput = page.locator("input[placeholder*='업무명'], input[placeholder*='제목']").last();
    if (await taskInput.isVisible()) {
      await taskInput.fill("QA 테스트 업무 항목");
      console.log("Filled task name");
    } else {
      // Try any visible text input in the add section
      const inputs = page.locator("td input[type='text'], td input:not([type])");
      const inputCount = await inputs.count();
      console.log(`Found ${inputCount} inputs in table cells`);
      if (inputCount > 0) {
        await inputs.first().fill("QA 테스트 업무 항목");
      }
    }

    await shot(page, "05c_filled_task");
  });

  // ──────────────────────────────────────────────────────────────
  // 06. Filter interactions
  // ──────────────────────────────────────────────────────────────
  test("06 - Filter interactions in sidebar", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "06a_before_filter");

    // Try clicking a project filter - "만화웹툰"
    const projectFilter = page.locator("div").filter({ hasText: /^만화웹툰/ }).first();
    if (await projectFilter.isVisible()) {
      await projectFilter.click();
      await page.waitForTimeout(500);
      console.log("Clicked project filter: 만화웹툰");
      await shot(page, "06b_project_filtered");
    } else {
      // Try sidebar items
      const sidebarItems = page.locator("[style*='cursor: pointer']").filter({ hasText: /만화|유녹|WATER/ });
      const sCount = await sidebarItems.count();
      console.log(`Sidebar clickable items with project names: ${sCount}`);
      if (sCount > 0) {
        await sidebarItems.first().click();
        await page.waitForTimeout(500);
        await shot(page, "06b_project_filtered");
      }
    }

    // Try clicking priority filter "긴급"
    const priFilter = page.locator("div").filter({ hasText: /^긴급$/ }).first();
    if (await priFilter.isVisible()) {
      await priFilter.click();
      await page.waitForTimeout(500);
      console.log("Clicked priority filter: 긴급");
      await shot(page, "06c_priority_filtered");
    }

    // Reset filters
    const filterReset = page.locator("button").filter({ hasText: /필터 초기화/ }).first();
    if (await filterReset.isVisible()) {
      await filterReset.click();
      await page.waitForTimeout(300);
      console.log("Filters reset");
      await shot(page, "06d_filters_reset");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 07. Search functionality
  // ──────────────────────────────────────────────────────────────
  test("07 - Search functionality", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    // Find search input
    const searchInput = page.locator("input[placeholder*='검색'], input[type='search'], input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill("중국");
      await page.waitForTimeout(500);
      console.log("Searched for: 중국");
      await shot(page, "07a_search_results");

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);
      await shot(page, "07b_search_cleared");
    } else {
      // Try to find search area by looking for magnifying glass or placeholder
      const searchArea = page.locator("input").filter({ hasText: "" }).first();
      const inputCount = await page.locator("input").count();
      console.log(`Total inputs found: ${inputCount}`);
      await shot(page, "07_search_area_not_found");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 08. Mark a todo as complete (change status)
  // ──────────────────────────────────────────────────────────────
  test("08 - Mark a todo item as complete", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "08a_before_complete");

    // Look for status badge in table (진행중, 대기 etc.) and click it
    const statusBadge = page.locator("td").filter({ hasText: /^진행중$|^대기$/ }).first();
    if (await statusBadge.isVisible()) {
      await statusBadge.click();
      await page.waitForTimeout(500);
      console.log("Clicked status badge to change it");
      await shot(page, "08b_status_dropdown");

      // Look for "완료" option in dropdown
      const completedOption = page.locator("[data-droppanel] div, .dropdown div, div[role='option']")
        .filter({ hasText: /^완료$/ }).first();
      if (await completedOption.isVisible({ timeout: 2000 })) {
        await completedOption.click();
        await page.waitForTimeout(500);
        console.log("Selected 완료 status");
        await shot(page, "08c_marked_complete");
      } else {
        // Try portal rendered dropdown
        const allDivs = page.locator("div").filter({ hasText: /^완료$/ });
        const ddCount = await allDivs.count();
        console.log(`Found ${ddCount} elements with text '완료'`);
        if (ddCount > 0) {
          await allDivs.last().click();
          await page.waitForTimeout(500);
          await shot(page, "08c_marked_complete");
        }
      }
    } else {
      console.log("Could not find status badge in table");
      await shot(page, "08_status_badge_not_found");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 09. Delete a todo item
  // ──────────────────────────────────────────────────────────────
  test("09 - Delete a todo item", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    // Hover over first row to reveal delete button
    const tableRows = page.locator("table tbody tr");
    const trCount = await tableRows.count();
    console.log(`Table rows: ${trCount}`);

    if (trCount > 0) {
      const firstRow = tableRows.first();
      await firstRow.hover();
      await page.waitForTimeout(500);
      await shot(page, "09a_row_hovered");

      // Look for delete button (red button or trash icon)
      const deleteBtn = page.locator("button[style*='#dc2626'], button[style*='fee2e2'], button[title*='삭제']").first();
      if (await deleteBtn.isVisible({ timeout: 2000 })) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        console.log("Clicked delete button");
        await shot(page, "09b_after_delete_click");
      } else {
        // Check for any delete-like buttons in table rows
        const redBtns = page.locator("button").filter({ hasText: /삭제|✕|×/ });
        const redCount = await redBtns.count();
        console.log(`Delete-like buttons found: ${redCount}`);
        await shot(page, "09_delete_btn_search");
      }
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 10. Calendar view
  // ──────────────────────────────────────────────────────────────
  test("10 - Navigate to calendar view", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const calBtn = page.locator("nav button").filter({ hasText: /캘린더/ }).first();
    await calBtn.waitFor({ timeout: 5000 });
    await calBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "10a_calendar_view");

    // Check calendar has dates
    const calCells = page.locator("[class*='cal'], [style*='grid']").first();
    console.log(`Calendar rendered: ${await calCells.isVisible()}`);

    // Check for month/year display
    const monthDisplay = page.locator("div, span").filter({ hasText: /2026년|2025년/ }).first();
    const monthVisible = await monthDisplay.isVisible({ timeout: 3000 });
    console.log(`Month/year display visible: ${monthVisible}`);

    await shot(page, "10b_calendar_detail");

    // Try navigating to next month
    const nextBtn = page.locator("button").filter({ hasText: /›|>|다음/ }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(400);
      await shot(page, "10c_calendar_next_month");
      console.log("Navigated to next month in calendar");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 11. Dashboard view
  // ──────────────────────────────────────────────────────────────
  test("11 - Navigate to dashboard", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const dashBtn = page.locator("nav button").filter({ hasText: /대시보드/ }).first();
    await dashBtn.waitFor({ timeout: 5000 });
    await dashBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "11a_dashboard");

    // Check for statistics or summary cards
    const statCards = page.locator("div").filter({ hasText: /완료|진행중|대기|검토/ });
    const cardCount = await statCards.count();
    console.log(`Dashboard stat elements: ${cardCount}`);

    await shot(page, "11b_dashboard_detail");
  });

  // ──────────────────────────────────────────────────────────────
  // 12. Kanban view
  // ──────────────────────────────────────────────────────────────
  test("12 - Navigate to Kanban view", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const kanbanBtn = page.locator("nav button").filter({ hasText: /칸반/ }).first();
    await kanbanBtn.waitFor({ timeout: 5000 });
    await kanbanBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "12a_kanban_view");

    // Check kanban columns
    const kanbanCols = page.locator("div").filter({ hasText: /대기|진행중|검토|완료/ }).filter({ hasText: /^\d+$|건/ });
    const colCount = await kanbanCols.count();
    console.log(`Kanban column indicators: ${colCount}`);

    await shot(page, "12b_kanban_detail");
  });

  // ──────────────────────────────────────────────────────────────
  // 13. Edit modal via row click
  // ──────────────────────────────────────────────────────────────
  test("13 - Open todo detail modal", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    // Scroll to find a visible row and hover over it
    const tableRows = page.locator("table tbody tr");
    const trCount = await tableRows.count();
    console.log(`Table rows: ${trCount}`);

    if (trCount > 0) {
      // Scroll to 3rd row which should be more likely in viewport
      const targetRow = tableRows.nth(2);
      await targetRow.scrollIntoViewIfNeeded();
      await targetRow.hover();
      await page.waitForTimeout(500);
      await shot(page, "13a_row_hovered");

      // Look for edit button that is within viewport using force: true or scrollIntoView
      const editBtns = page.locator("button").filter({ hasText: /✏/ });
      const eBtnCount = await editBtns.count();
      console.log(`Edit buttons found: ${eBtnCount}`);

      if (eBtnCount > 0) {
        const editBtn = editBtns.first();
        await editBtn.scrollIntoViewIfNeeded();
        await editBtn.click({ force: true });
        await page.waitForTimeout(500);
        console.log("Opened edit modal");
        await shot(page, "13b_edit_modal");

        // Close modal
        const closeBtn = page.locator("button").filter({ hasText: /✕|닫기|취소/ }).first();
        if (await closeBtn.isVisible({ timeout: 3000 })) {
          await closeBtn.click();
          await page.waitForTimeout(300);
        }
      } else {
        // Try double clicking on task cell
        const taskCell = page.locator("td").nth(3);
        await taskCell.scrollIntoViewIfNeeded();
        await taskCell.dblclick();
        await page.waitForTimeout(500);
        await shot(page, "13b_edit_dblclick");
      }
    }
    await shot(page, "13c_after_edit");
  });

  // ──────────────────────────────────────────────────────────────
  // 14. Responsive layout check
  // ──────────────────────────────────────────────────────────────
  test("14 - Viewport and layout check", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    // Full desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    await shot(page, "14a_desktop_1440");

    // Medium viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await shot(page, "14b_medium_1024");

    // Narrow viewport (tablet)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await shot(page, "14c_tablet_768");

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await shot(page, "14d_mobile_375");

    // Restore
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // ──────────────────────────────────────────────────────────────
  // 15. Logout / user switch
  // ──────────────────────────────────────────────────────────────
  test("15 - Header user switch", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });
    await page.waitForTimeout(500);

    await shot(page, "15a_header_area");

    // Look for user switch or logout button in header
    const headerBtns = page.locator("header button, [style*='#172f5a'] button, [style*='172f5a'] button");
    const hBtnCount = await headerBtns.count();
    console.log(`Header buttons: ${hBtnCount}`);

    // Check for user name display in header
    const userDisplay = page.locator("header, [style*='172f5a']").filter({ hasText: "김대윤" });
    const userDisplayVisible = await userDisplay.isVisible({ timeout: 3000 });
    console.log(`User display in header: ${userDisplayVisible}`);

    await shot(page, "15b_header_full");

    // Try clicking any header buttons (logout/switch)
    if (hBtnCount > 0) {
      const firstHeaderBtn = headerBtns.first();
      await firstHeaderBtn.click();
      await page.waitForTimeout(500);
      await shot(page, "15c_after_header_btn_click");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 16. Progress bar interaction
  // ──────────────────────────────────────────────────────────────
  test("16 - Progress bar interaction in list view", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const listBtn = page.locator("nav button").filter({ hasText: "리스트" }).first();
    await listBtn.click();
    await page.waitForTimeout(800);

    await shot(page, "16a_list_with_progress");

    // Find progress bars in the list
    const progressBars = page.locator("div[style*='height: 8px'], div[style*='height:8px']");
    const pbCount = await progressBars.count();
    console.log(`Progress bar segments found: ${pbCount}`);

    if (pbCount > 0) {
      // Click on a progress bar segment to change progress
      const firstPB = progressBars.first();
      await firstPB.click();
      await page.waitForTimeout(400);
      console.log("Clicked progress bar");
      await shot(page, "16b_after_progress_click");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 17. Console errors check
  // ──────────────────────────────────────────────────────────────
  test("17 - Check for console errors on all views", async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
      if (msg.type() === "warning") consoleWarnings.push(msg.text());
    });

    page.on("pageerror", (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    // Visit each view
    for (const viewName of ["대시보드", "칸반", "리스트", "캘린더"]) {
      const btn = page.locator("nav button").filter({ hasText: viewName }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(600);
      }
    }

    await shot(page, "17_console_check_final_view");

    console.log(`Console Errors (${consoleErrors.length}):`);
    consoleErrors.forEach((e) => console.log(`  ERROR: ${e}`));

    console.log(`Console Warnings (${consoleWarnings.length}):`);
    consoleWarnings.slice(0, 10).forEach((w) => console.log(`  WARN: ${w}`));

    // Report but don't fail — we want to log all errors
    if (consoleErrors.length > 0) {
      console.log("FOUND CONSOLE ERRORS - see above");
    }
  });

  // ──────────────────────────────────────────────────────────────
  // 18. Full page accessibility screenshot
  // ──────────────────────────────────────────────────────────────
  test("18 - Full page screenshot of each view", async ({ page }) => {
    await gotoApp(page);

    const memberBtn = page.locator("button").filter({ hasText: "김대윤" }).first();
    await memberBtn.waitFor({ timeout: 10000 });
    await memberBtn.click();
    await page.waitForSelector("nav", { timeout: 10000 });

    const views = [
      { name: "대시보드", file: "18a_full_dashboard" },
      { name: "칸반", file: "18b_full_kanban" },
      { name: "리스트", file: "18c_full_list" },
      { name: "캘린더", file: "18d_full_calendar" },
    ];

    for (const v of views) {
      const btn = page.locator("nav button").filter({ hasText: v.name }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(800);
        await shot(page, v.file);
        console.log(`Screenshot taken: ${v.file}`);
      }
    }
  });
});
