import { chromium, Browser } from "playwright";
import { setSamsPxCookies, getSamsPxCookieStatus } from "./sams";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;   // check every 5 min
const REFRESH_THRESHOLD_MS = 12 * 60 * 1000; // refresh when <12 min left

let _refreshing = false;

const PX_COOKIE_NAMES = new Set([
  "_px3", "_px2", "_pxvid", "_pxhd", "_pxde", "pxcts", "__pxvid",
  "bm_sz", "bm_sv", "ak_bmsc", "_abck",
  "bstc", "vtc", "xpm", "xpa", "exp-ck", "_astc",
]);

function isPxOrSecurityCookie(name: string): boolean {
  if (PX_COOKIE_NAMES.has(name)) return true;
  if (name.startsWith("TS")) return true;       // Imperva/Trusteer
  if (name.startsWith("_px")) return true;
  if (name.startsWith("bm_")) return true;
  return false;
}

export async function refreshSamsCookiesViaPlaywright(): Promise<void> {
  if (_refreshing) return;
  _refreshing = true;
  let browser: Browser | undefined;

  try {
    console.log("[Sam's] Renovando cookies — abriendo Chrome...");

    browser = await chromium.launch({
      channel: "chrome",
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-position=-32000,-32000",
        "--window-size=1366,768",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      locale: "es-MX",
      viewport: { width: 1366, height: 768 },
    });

    const page = await context.newPage();

    await page.goto("https://www.sams.com.mx", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Give PerimeterX JS time to execute and set its cookies
    await page.waitForTimeout(7_000);

    const allCookies = await context.cookies("https://www.sams.com.mx");
    const selected = allCookies.filter((c) => isPxOrSecurityCookie(c.name));

    if (selected.length === 0) {
      throw new Error("PerimeterX no generó cookies — Sam's puede estar bloqueando Playwright.");
    }

    const cookieString = selected.map((c) => `${c.name}=${c.value}`).join("; ");
    setSamsPxCookies(cookieString);
    console.log(`[Sam's] ${selected.length} cookies de seguridad renovadas automáticamente.`);
  } catch (err: any) {
    console.error("[Sam's] Error en renovación automática:", err?.message ?? err);
    throw err;
  } finally {
    if (browser) await browser.close().catch(() => {});
    _refreshing = false;
  }
}

export function startSamsCookieAutoRefresh(): void {
  // Trigger immediately if no valid cookies on startup
  const initial = getSamsPxCookieStatus();
  if (!initial.valid) {
    refreshSamsCookiesViaPlaywright().catch((e) =>
      console.error("[Sam's] Renovación inicial fallida:", e?.message)
    );
  }

  setInterval(() => {
    const status = getSamsPxCookieStatus();
    const needsRefresh =
      !status.valid ||
      (status.expiresInMs !== undefined && status.expiresInMs < REFRESH_THRESHOLD_MS);

    if (needsRefresh) {
      refreshSamsCookiesViaPlaywright().catch((e) =>
        console.error("[Sam's] Renovación periódica fallida:", e?.message)
      );
    }
  }, CHECK_INTERVAL_MS);
}
