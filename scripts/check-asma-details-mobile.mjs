import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4178/", { waitUntil: "networkidle" });
await page.waitForTimeout(1100);

const later = page.getByRole("button", { name: "لاحقاً" });
if (await later.isVisible().catch(() => false)) await later.click();

await page.locator("nav button").nth(2).click();
await page.waitForTimeout(350);
await page.getByRole("button", { name: /أسماء الله الحسنى/ }).first().click();
await page.waitForTimeout(350);
await page.getByText("الْحَلِيمُ", { exact: true }).first().click();
await page.waitForTimeout(260);

const result = await page.evaluate(() => {
  const modal = document.querySelector('[class*="will-change-transform"]');
  const overlay = modal?.parentElement;
  const prev = [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("الاسم السابق"));
  const next = [...document.querySelectorAll("button")].find((button) => button.textContent?.includes("الاسم التالي"));
  const rect = (element) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: Math.round(box.x),
      right: Math.round(box.right),
      width: Math.round(box.width),
      height: Math.round(box.height),
      backdropFilter: style.backdropFilter,
      transform: style.transform,
    };
  };
  return {
    viewportWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    modal: rect(modal),
    overlay: rect(overlay),
    previous: rect(prev),
    next: rect(next),
    detailsVisible: Boolean(modal && getComputedStyle(modal).opacity !== "0"),
  };
});

await page.screenshot({ path: "/home/ubuntu/sakinah-current/docs/asma-details-mobile.png", fullPage: false });
console.log(JSON.stringify(result, null, 2));
await browser.close();
