import { chromium, BrowserContext } from "playwright";

const INVENTORY_URL = "https://www.elpalaciodehierro.com/fluentinventory";

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Referer: "https://www.elpalaciodehierro.com/",
};

// Cache product ID lists per search query, 20-minute TTL
const _cache: Record<string, { ids: string[]; expiry: number }> = {};
const CACHE_TTL = 20 * 60 * 1000;

async function discoverProductIds(query: string): Promise<string[]> {
  const key = query.toLowerCase().trim();
  const hit = _cache[key];
  if (hit && Date.now() < hit.expiry) return hit.ids;

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-position=-32000,-32000",
      "--window-size=1366,768",
    ],
  });

  const capturedIds: string[] = [];

  try {
    const context: BrowserContext = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      locale: "es-MX",
      viewport: { width: 1366, height: 768 },
    });

    // Strategy 1 — intercept any fluentinventory calls the page makes automatically
    await context.route("**/fluentinventory*", async (route) => {
      const url = new URL(route.request().url());
      const pid = url.searchParams.get("productId");
      if (pid && !capturedIds.includes(pid)) capturedIds.push(pid);
      await route.continue();
    });

    const page = await context.newPage();
    await page.goto(
      `https://www.elpalaciodehierro.com/buscar?q=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 35_000 }
    );

    // Wait for JS-rendered product cards and any inventory API calls
    await page.waitForTimeout(8_000);

    // Strategy 2 — extract from GTM dataLayer (ecommerce impressions)
    if (capturedIds.length === 0) {
      const layerIds: string[] = await page.evaluate(() => {
        const ids: string[] = [];
        const layer: any[] = (window as any).dataLayer || [];
        for (const event of layer) {
          const impressions: any[] =
            event?.ecommerce?.impressions ||
            event?.ecommerce?.items ||
            event?.ecommerce?.products ||
            [];
          for (const item of impressions) {
            const id = String(item.id || item.item_id || item.productId || "").trim();
            if (id && !ids.includes(id)) ids.push(id);
          }
        }
        return ids;
      });
      capturedIds.push(...layerIds);
    }

    // Strategy 3 — DOM data attributes, URL patterns, and inline JSON blobs
    if (capturedIds.length === 0) {
      const domIds: string[] = await page.evaluate(() => {
        const ids: string[] = [];
        const add = (v: string | null | undefined) => {
          if (v && /^\w[\w-]*$/.test(v.trim()) && !ids.includes(v.trim())) ids.push(v.trim());
        };

        // Data attributes
        for (const [sel, attr] of [
          ["[data-product-id]", "data-product-id"],
          ["[data-pid]", "data-pid"],
          ["[data-id]", "data-id"],
          ["[data-skuid]", "data-skuid"],
          ["[data-item-id]", "data-item-id"],
        ] as [string, string][]) {
          document.querySelectorAll(sel).forEach((el) => add(el.getAttribute(attr)));
        }

        // URL-embedded IDs: /12345/p, ?pid=…, ?productId=…
        document.querySelectorAll("a[href]").forEach((el) => {
          const href = (el as HTMLAnchorElement).href;
          const m =
            href.match(/\/(\d{4,})\/p\b/) ||
            href.match(/[?&]pid=(\w+)/) ||
            href.match(/[?&]productId=(\w+)/);
          if (m) add(m[1]);
        });

        // __NEXT_DATA__ / inline JSON — look for productId or pid keys
        document.querySelectorAll("script[type='application/json'], script:not([src])").forEach((el) => {
          const text = el.textContent || "";
          const matches = text.matchAll(/"(?:productId|pid|id)"\s*:\s*"?(\d{4,})"?/g);
          for (const m of matches) add(m[1]);
        });

        return ids;
      });
      capturedIds.push(...domIds);
    }

    console.log(`[Palacio] "${query}" → ${capturedIds.length} product IDs discovered`);
  } catch (err: any) {
    console.error("[Palacio] Playwright error:", err?.message ?? err);
  } finally {
    await browser.close().catch(() => {});
  }

  const unique = [...new Set(capturedIds)];
  if (unique.length > 0) {
    _cache[key] = { ids: unique, expiry: Date.now() + CACHE_TTL };
  }
  return unique;
}

async function checkInventory(productId: string): Promise<any[]> {
  try {
    const url = new URL(INVENTORY_URL);
    url.searchParams.set("productId", productId);
    const r = await fetch(url.toString(), { headers: HEADERS });
    if (!r.ok) return [];
    const data: any = await r.json();
    return (data?.data?.storesByProduct ?? []).filter((s: any) => s.hasStock === true);
  } catch {
    return [];
  }
}

export async function buscarPalacio(query: string): Promise<any[]> {
  const productIds = await discoverProductIds(query);
  if (productIds.length === 0) return [];

  const results: any[] = [];
  for (const productId of productIds.slice(0, 20)) {
    const stores = await checkInventory(productId);
    for (const s of stores) {
      results.push({
        storeId: `PALACIO-${s.locationRef ?? s.store_id ?? productId}`,
        storeName: (s.storename ?? s.store_name ?? "Palacio de Hierro").trim(),
        numberOfPieces: 1,
        available: "true",
        stateName: "Palacio de Hierro",
      });
    }
  }

  return results;
}
