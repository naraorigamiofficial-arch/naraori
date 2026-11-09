import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PUBLIC_PAGES } from "./helpers";

test.describe("SEO and structure", () => {
  test("every public page has a unique title, description, canonical, one h1 and valid JSON-LD", async ({ page }) => {
    const titles = new Set<string>();
    for (const url of PUBLIC_PAGES.filter((u) => !u.includes("?"))) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(200);
      const title = await page.title();
      expect(titles.has(title), `duplicate title ${title}`).toBe(false);
      titles.add(title);
      expect(await page.locator('meta[name="description"]').getAttribute("content"), url).toBeTruthy();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, url).toBe(`https://naraori.in${url === "/" ? "" : url}`.replace(/\/$/, "") || "https://naraori.in");
      expect(await page.locator("h1").count(), url).toBe(1);
      expect(await page.locator('meta[name="robots"][content*="noindex"]').count(), url).toBe(0);
      for (const s of await page.locator('script[type="application/ld+json"]').allTextContents()) expect(() => JSON.parse(s)).not.toThrow();
      expect(await page.content(), url).not.toContain(String.fromCharCode(0x2014));
    }
  });

  test("private and filter pages are not indexable", async ({ page }) => {
    await page.goto("/order-request");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await page.goto("/search?q=rama");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
    await page.goto("/artworks?view=index");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe("https://naraori.in/artworks");
  });

  test("legacy URLs redirect permanently", async ({ request }) => {
    for (const [from, to] of [["/Catalog/catalog.html", "/shop"], ["/index.html", "/"], ["/imgs/ram.webp", "/media/artworks/maryada-purushottam.webp"]]) {
      const r = await request.get(from, { maxRedirects: 0 });
      expect(r.status()).toBe(308);
      expect(r.headers()["location"]).toBe(to);
    }
  });

  test("no broken internal links", async ({ page, request }) => {
    const seen = new Set<string>();
    for (const url of PUBLIC_PAGES) {
      await page.goto(url);
      const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
      hrefs.forEach((h) => seen.add(h.split("#")[0]));
    }
    for (const h of seen) {
      if (h.startsWith("/studio")) continue;
      const r = await request.get(h);
      expect(r.status(), h).toBeLessThan(400);
    }
  });

  test("sitemap lists published pages only; robots blocks private paths", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("https://naraori.in/artworks/sun-wukong-the-monkey-king");
    expect(xml).not.toContain("untitled-beetle-study");
    expect(xml).not.toContain("what-is-double-tissue-paper");
    expect(xml).not.toContain("/studio");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /studio");
    expect(robots).toContain("Sitemap: https://naraori.in/sitemap.xml");
  });

  test("draft artworks return 404", async ({ request }) => {
    expect((await request.get("/artworks/untitled-beetle-study")).status()).toBe(404);
    expect((await request.get("/learn/what-is-double-tissue-paper")).status()).toBe(404);
  });
});

test.describe("Visitor F: accessibility", () => {
  for (const url of PUBLIC_PAGES.filter((u) => !u.includes("?")).concat(["/order-request"])) {
    test(`axe: ${url}`, async ({ page }) => {
      await page.goto(url);
      const results = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }

  test("keyboard only: skip link, choose a size with arrow keys, pick a colour, add to sheet", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/shop");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    const fifty = page.getByRole("radio", { name: /^50 cm/ });
    await fifty.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("radio", { name: /^70 cm/ })).toBeChecked();
    await expect(page.getByRole("heading", { level: 2, name: /70 cm/ })).toBeVisible();
    await page.getByRole("radio", { name: "Black" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("radio", { name: "Black" })).toBeChecked();
    await page.getByRole("button", { name: "Add to order sheet" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Added 2" })).toBeVisible();
  });

  test("story layers work as native disclosure and the image viewer traps and returns focus", async ({ page }) => {
    await page.goto("/artworks/sun-wukong-the-monkey-king");
    const layer = page.locator("details.layer").nth(1);
    await layer.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(layer).toHaveAttribute("open", "");
    const opener = page.getByRole("link", { name: /Open full-resolution photograph/ });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("Visitor A: collector reaches the commission form from an artwork", async ({ page }) => {
    await page.goto("/artworks/maryada-purushottam");
    await page.getByRole("link", { name: "Enquire" }).click();
    await expect(page).toHaveURL(/\/commissions\?about=/);
    await expect(page.getByLabel("Your message")).toHaveValue(/Maryada Purushottam/);
    await page.getByLabel("Name", { exact: true }).fill("Collector");
    await page.getByLabel("Email", { exact: true }).fill("collector@example.com");
    await page.getByLabel("Your message").fill("About Maryada Purushottam: is this work available for acquisition?");
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText(/your enquiry has reached the studio/i)).toBeVisible();
  });
});

test.describe("Homepage turntable", () => {
  test("turns with scroll and stops when scrolling stops", async ({ page }) => {
    await page.goto("/");
    const deg = page.locator(".tt-deg");
    await expect(page.locator(".tt-track.tt-scroll")).toBeAttached(); // wait for the live (scroll-driven) mode
    await expect(deg).toHaveText("000°");
    const span = await page.evaluate(() => document.querySelector<HTMLElement>(".tt-track")!.offsetHeight - document.querySelector<HTMLElement>(".tt-stage")!.offsetHeight);
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(span / 2));
    await expect(deg).toHaveText(/^1[78]\d°$/);
    await page.waitForTimeout(1200); // let the easing finish
    const settled = await deg.textContent();
    await page.waitForTimeout(600);
    await expect(deg).toHaveText(settled!);
  });

  test("reduced motion: no scroll coupling, a slider turns the sculpture", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const slider = page.getByRole("slider", { name: "Turn the sculpture" });
    await expect(slider).toBeVisible();
    await slider.focus();
    for (let i = 0; i < 90; i++) await page.keyboard.press("ArrowRight");
    await expect(page.locator(".tt-deg")).toHaveText(/^0(8|9)\d°$/);
  });
});
