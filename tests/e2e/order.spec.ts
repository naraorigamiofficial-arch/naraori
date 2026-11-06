import { expect, test } from "@playwright/test";
import { mailFiles, readStore } from "./helpers";

test.describe("Visitor B: folder orders paper", () => {
  test("selects size, colour and quantity, meets MOQ, sees subtotal and submits one order request", async ({ page }) => {
    await page.goto("/shop/double-tissue-50cm");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("50 cm");
    // Colour is required and labelled in text.
    await page.getByRole("button", { name: "Add to order sheet" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Choose a colour" })).toBeVisible();
    await page.getByRole("radio", { name: "Red" }).check();
    // MOQ 5: decrease is disabled at the minimum.
    const qty = page.getByLabel(/^Quantity/);
    await expect(qty).toHaveValue("5");
    await expect(page.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.locator(".atlas-total")).toContainText("₹1,554");
    await page.getByRole("button", { name: "Add to order sheet" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Added 6" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Order sheet.*1 item\b/ })).toBeVisible();

    await page.goto("/order-request");
    await expect(page.getByText("₹1,554").first()).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill("Asha Folder");
    await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
    await page.getByLabel("City", { exact: true }).fill("Pune");
    await page.waitForTimeout(2600); // human-speed submission (bot timing check)

    // The acknowledgement is unchecked and required.
    const ack = page.getByRole("checkbox", { name: /I understand that this is an order request/ });
    await expect(ack).not.toBeChecked();
    await page.getByRole("button", { name: "Submit Order Request" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Please check" })).toBeVisible();
    expect(readStore().orders).toHaveLength(0);

    await ack.check();
    await page.getByRole("button", { name: "Submit Order Request" }).click();
    await expect(page).toHaveURL(/\/order-request\/confirmation\//);
    await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
    await expect(page.getByText(/This is a request, not a confirmed purchase/)).toBeVisible();
    const ref = (await page.locator("strong").filter({ hasText: /^NO-/ }).textContent())!.trim();
    // Confirmation page never shows personal data.
    await expect(page.getByText("asha@example.com")).toHaveCount(0);

    const store = readStore();
    expect(store.orders).toHaveLength(1);
    expect(store.orders[0]).toMatchObject({ reference: ref, status: "requested", subtotal: 155400 });
    expect(store.notifications.map((n: { status: string }) => n.status)).toEqual(["sent", "sent"]);
    const mails = mailFiles();
    expect(mails.some((m) => m.includes("To: studio@example.test") && m.includes(ref))).toBe(true);
    expect(mails.some((m) => m.includes("To: asha@example.com") && m.includes("NOT A CONFIRMED PURCHASE"))).toBe(true);

    // The order sheet is cleared after success.
    await expect(page.getByRole("link", { name: /Order sheet.*0 items/ })).toBeVisible();
  });

  test("server rejects tampered prices and below-MOQ quantities", async ({ request }) => {
    const base = { idempotencyKey: crypto.randomUUID(), customer: { name: "Bot", email: "b@example.com", city: "Delhi", country: "IN" }, acknowledged: true, startedAt: Date.now() - 10_000 };
    const low = await request.post("/api/order-requests", { data: { ...base, items: [{ sku: "dt-70-sheet", colourId: "black", units: 1 }] } });
    expect(low.status()).toBe(422);
    expect((await low.json()).itemErrors[0].message).toContain("minimum order is 2");
    const tampered = await request.post("/api/order-requests", { data: { ...base, idempotencyKey: crypto.randomUUID(), items: [{ sku: "dt-70-sheet", colourId: "black", units: 2, unitPrice: 1 }], subtotal: 2 } });
    expect(tampered.status()).toBe(201);
    const order = readStore().orders.find((o: { reference: string }) => o.reference === "x") ?? readStore().orders.at(-1);
    expect(order.subtotal).toBe(2 * 38900);
  });

  test("duplicate submission with the same key returns the same reference", async ({ request }) => {
    const body = { idempotencyKey: crypto.randomUUID(), items: [{ sku: "dt-100-sheet", colourId: "white", units: 2 }], customer: { name: "Dup", email: "d@example.com", city: "Goa", country: "IN" }, acknowledged: true, startedAt: Date.now() - 10_000 };
    const before = readStore().orders.length;
    const [a, b] = await Promise.all([request.post("/api/order-requests", { data: body }), request.post("/api/order-requests", { data: body })]);
    const ra = await a.json();
    const rb = await b.json();
    expect(ra.reference).toBe(rb.reference);
    expect(readStore().orders.length).toBe(before + 1);
  });

  test("orders and personal data are never exposed by guessable URLs", async ({ request }) => {
    const ref = readStore().orders[0].reference;
    expect((await request.get(`/order-request/confirmation/${ref}`)).status()).toBe(404);
    expect((await request.get("/studio/export")).status()).toBe(404);
    const studio = await request.get("/studio", { maxRedirects: 0 });
    expect(studio.status()).toBe(307);
  });
});

test.describe("Studio administration", () => {
  test("owner signs in, finds the request and updates its status", async ({ page }) => {
    await page.goto("/studio/login");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "not correct" })).toBeVisible();
    await page.getByLabel("Password").fill("e2e-studio-passphrase");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Order requests" })).toBeVisible();
    const ref = readStore().orders[0].reference;
    await page.getByRole("link", { name: ref }).click();
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(ref) })).toBeVisible();
    await expect(page.getByText("asha@example.com").first()).toBeVisible();
    await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("reviewing");
    await page.getByLabel(/Reason/).fill("Checking red stock");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(page.getByText("Being reviewed: Checking red stock")).toBeVisible();
    expect(readStore().orders[0].status).toBe("reviewing");
    // Price edit flows through to the public shop.
    await page.goto("/studio/catalogue");
    const row = page.locator("form.studio-option").filter({ hasText: "dt-70-sheet" });
    await row.getByLabel(/Price/).fill("399");
    await row.getByRole("button", { name: "Save" }).click();
    await expect(row.getByLabel(/Price/)).toHaveValue("399");
    const csv = await page.request.get("/studio/export");
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain(ref);
  });
});
