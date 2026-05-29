import path from "path";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { chromium } from "playwright";

const SECURITY_COOKIE_NAMES = new Set([
  "_px3", "_px2", "_pxvid", "_pxhd", "_pxde", "pxcts", "__pxvid",
  "bm_sz", "bm_sv", "ak_bmsc", "_abck",
  "bstc", "vtc", "xpm", "xpa", "exp-ck", "_astc",
  "hasLocData", "assortmentStoreId", "locDataV3",
  "walmart.nearestPostalCode", "walmart.nearestLatLng", "mx-gl-sams",
]);

function isUsefulSamsCookie(name: string): boolean {
  return (
    SECURITY_COOKIE_NAMES.has(name) ||
    name.startsWith("TS") ||
    name.startsWith("_px") ||
    name.startsWith("bm_")
  );
}

function normalizeAppUrl(rawUrl: string): string {
  const value = rawUrl.trim().replace(/\/+$/, "");
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

async function main() {
  const appUrl = normalizeAppUrl(process.argv[2] || process.env.APP_URL || "");
  const printOnly = process.argv.includes("--print-only");
  const userDataDir = path.join(process.cwd(), "data", "sams-browser-profile");
  const rl = createInterface({ input, output });

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: process.env.SAMS_BROWSER_CHANNEL || "chrome",
    headless: false,
    locale: "es-MX",
    viewport: { width: 1366, height: 900 },
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://www.sams.com.mx/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("\nChrome abrió Sam's Club con perfil persistente.");
    console.log("Navega normalmente, resuelve validaciones y selecciona ubicación si Sam's la pide.");
    await rl.question("Cuando la pagina esté cargada, presiona Enter para enviar cookies al servidor...");

    const cookies = await context.cookies("https://www.sams.com.mx");
    const selected = cookies.filter((cookie) => isUsefulSamsCookie(cookie.name));

    if (selected.length === 0) {
      throw new Error("No se encontraron cookies de seguridad/ubicacion de Sam's. Navega un poco mas y vuelve a intentar.");
    }

    const cookieString = selected.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

    if (printOnly || !appUrl) {
      console.log("\nCopia esta cadena en el modal de Sam's:");
      console.log(cookieString);
      return;
    }

    const response = await fetch(`${appUrl}/api/sams/cookies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookies: cookieString }),
    });

    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Servidor respondio HTTP ${response.status}`);
    }

    console.log(`\nListo: ${selected.length} cookies de Sam's enviadas a ${appUrl}.`);
    console.log(payload?.message || "Sesion actualizada.");
  } finally {
    rl.close();
    await context.close();
  }
}

main().catch((error) => {
  console.error("\nError:", error?.message || error);
  process.exit(1);
});
