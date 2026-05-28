import path from "path";
import { chromium } from "playwright";

async function main() {
  const userDataDir = path.join(process.cwd(), "data", "sams-browser-profile");
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: process.env.SAMS_BROWSER_CHANNEL || "chrome",
    headless: false,
    locale: "es-MX",
    viewport: { width: 1366, height: 900 },
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto("https://www.sams.com.mx/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("Chrome quedó abierto con perfil persistente.");
  console.log("En la ventana de Sam's, resuelve cualquier validación y selecciona una ubicación si te la pide.");
  console.log("El script esperará 5 minutos y guardará la sesión al cerrar.");

  await page.waitForTimeout(5 * 60 * 1000);
  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
