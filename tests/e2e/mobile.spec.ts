import { expect, test } from "@playwright/test";
import { PUBLIC_PAGES } from "./helpers";

test("Visitor E: no horizontal scrolling on mobile", async ({ page }) => {
  for (const url of PUBLIC_PAGES.concat(["/order-request"])) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(1);
  }
});

test("Visitor E: mobile menu works without hunting, shop reachable in one tap from the home page", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Find paper").click();
  await expect(page).toHaveURL(/\/shop$/);
  await page.locator("summary", { hasText: "Menu" }).click();
  await page.getByRole("navigation", { name: "Main (mobile)" }).getByRole("link", { name: "Learn" }).click();
  await expect(page).toHaveURL(/\/learn$/);
});
