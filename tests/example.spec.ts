import { test, expect } from "@playwright/test";

test("앱 로딩 확인", async ({ page }) => {
  await page.goto("/");
  // 로그인 화면에 팀 TODO 텍스트가 보여야 함
  await expect(page.getByText("팀 TODO 통합관리")).toBeVisible();
});
