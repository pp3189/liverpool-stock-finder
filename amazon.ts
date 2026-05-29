import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);

const BASE_URL = "https://www.amazon.com.mx";
const AMAZON_EXTERNAL_URL = process.env.AMAZON_EXTERNAL_URL?.trim() || "";
const AMAZON_EXTERNAL_TOKEN = process.env.AMAZON_EXTERNAL_TOKEN?.trim() || "";
const AMAZON_EXTERNAL_FALLBACK_DIRECT = process.env.AMAZON_EXTERNAL_FALLBACK_DIRECT !== "false";
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY?.trim() || "";
const SERPAPI_AMAZON_DOMAIN = process.env.SERPAPI_AMAZON_DOMAIN?.trim() || "amazon.com.mx";
const SERPAPI_NO_CACHE = process.env.SERPAPI_NO_CACHE === "true";
const SERPAPI_FALLBACK_DIRECT = process.env.SERPAPI_FALLBACK_DIRECT === "true";

// Search queries that cover official Pokémon products on Amazon México.
// Multiple queries = better coverage. Results are deduplicated by ASIN.
const CATALOG_SEARCH_TERMS = [
  "pokemon tcg cartas",
  "pokemon coleccion booster",
  "pokemon juguetes figuras",
];

const CATALOG_SEARCH_URLS = CATALOG_SEARCH_TERMS.map(
  (term) => `${BASE_URL}/s?k=${encodeURIComponent(term).replace(/%20/g, "+")}&i=toys`
);

const ALLOWED_SELLERS = new Set([
  "amazon mexico",
  "amazon méxico",
  "amazon.com.mx",
  "the pokémon company",
  "the pokemon company",
  "pokémon",
  "pokemon",
]);

const HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

// Cache for 30 minutes to reduce CAPTCHA risk on repeated loads
let _cache: any[] = [];
let _cacheExpiry = 0;
const CACHE_TTL = 30 * 60 * 1000;

function normalizeProviderRows(payload: any): any[] {
  const rows = Array.isArray(payload) ? payload : payload?.tiendas || payload?.results || payload?.items || [];
  if (!Array.isArray(rows)) return [];

  return rows
    .map((item: any, idx: number) => ({
      storeId: String(item.storeId || item.asin || item.id || `AMAZON-EXT-${idx}`),
      storeName: String(item.storeName || item.title || item.name || "Producto Amazon"),
      numberOfPieces: Number(item.numberOfPieces || item.quantity || 1),
      available: String(item.available ?? item.inStock ?? true),
      stateName: String(item.stateName || "Amazon México"),
      _productUrl: item._productUrl || item.url || item.productUrl,
      _price: item._price || item.price,
      _seller: item._seller || item.seller || "Amazon.com.mx",
    }))
    .filter((item: any) => item.storeName && item.available !== "false");
}

async function fetchAmazonViaExternalProvider(query: string): Promise<any[] | null> {
  if (!AMAZON_EXTERNAL_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AMAZON_EXTERNAL_TIMEOUT_MS || 45000));
  try {
    const response = await fetch(AMAZON_EXTERNAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AMAZON_EXTERNAL_TOKEN ? { Authorization: `Bearer ${AMAZON_EXTERNAL_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        store: "amazon",
        country: "MX",
        query,
        mode: query ? "asin" : "catalog",
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: any;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Proveedor Amazon respondió texto no JSON: ${text.slice(0, 120)}`);
    }

    if (!response.ok) {
      throw new Error(payload?.error || `Proveedor Amazon HTTP ${response.status}`);
    }

    return normalizeProviderRows(payload);
  } finally {
    clearTimeout(timeout);
  }
}

function getSerpApiString(value: any): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(" | ");
  return String(value || "").trim();
}

function serpApiAvailable(stock: string, title = ""): boolean {
  const lower = `${stock} ${title}`.toLowerCase();
  return !(
    lower.includes("no disponible") ||
    lower.includes("agotado") ||
    lower.includes("out of stock") ||
    lower.includes("currently unavailable")
  );
}

function serpApiProductToRow(product: any, asinFallback?: string): any | null {
  const asin = String(product?.asin || asinFallback || "").toUpperCase();
  const title = getSerpApiString(product?.title);
  if (!asin || !title || !POKEMON_REGEX.test(title)) return null;

  const stock = getSerpApiString(product?.stock || product?.availability);
  if (!serpApiAvailable(stock, title)) return null;

  const price = getSerpApiString(product?.price || product?.buybox?.price);
  const seller =
    getSerpApiString(product?.sold_by?.name || product?.seller || product?.buybox?.seller) ||
    "Amazon.com.mx";

  return {
    storeId: `AMAZON-${asin}`,
    storeName: title,
    numberOfPieces: 1,
    available: "true",
    stateName: "Amazon México",
    _productUrl: product?.link || product?.link_clean || `${BASE_URL}/dp/${asin}`,
    _price: price,
    _seller: seller,
  };
}

function serpApiSearchItemToRow(item: any): any | null {
  const asin = String(item?.asin || "").toUpperCase();
  const title = getSerpApiString(item?.title);
  if (!asin || !title || !POKEMON_REGEX.test(title)) return null;

  const availability = getSerpApiString(item?.availability || item?.stock);
  if (!serpApiAvailable(availability, title)) return null;

  return {
    storeId: `AMAZON-${asin}`,
    storeName: title,
    numberOfPieces: 1,
    available: "true",
    stateName: "Amazon México",
    _productUrl: item?.link || item?.link_clean || `${BASE_URL}/dp/${asin}`,
    _price: getSerpApiString(item?.price),
    _seller: "Amazon.com.mx",
  };
}

async function fetchSerpApi(params: Record<string, string>): Promise<any> {
  const url = new URL("https://serpapi.com/search.json");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", SERPAPI_API_KEY);
  url.searchParams.set("amazon_domain", SERPAPI_AMAZON_DOMAIN);
  url.searchParams.set("device", "desktop");
  if (SERPAPI_NO_CACHE) url.searchParams.set("no_cache", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.SERPAPI_TIMEOUT_MS || 45000));
  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) {
      throw new Error(payload?.error || `SerpApi HTTP ${response.status}`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchProductViaSerpApi(asin: string): Promise<any | null> {
  if (!SERPAPI_API_KEY) return null;

  const payload = await fetchSerpApi({
    engine: "amazon_product",
    asin,
  });

  return serpApiProductToRow(payload?.product_results, asin);
}

async function fetchCatalogViaSerpApi(): Promise<any[] | null> {
  if (!SERPAPI_API_KEY) return null;
  if (_cache.length && Date.now() < _cacheExpiry) return _cache;

  const unique = new Map<string, any>();
  for (const term of CATALOG_SEARCH_TERMS) {
    const payload = await fetchSerpApi({
      engine: "amazon",
      k: term,
      i: "toys",
    });

    const rows = Array.isArray(payload?.organic_results)
      ? payload.organic_results.map(serpApiSearchItemToRow).filter(Boolean)
      : [];

    for (const row of rows) unique.set(row.storeId, row);
  }

  const results = [...unique.values()];
  if (results.length > 0) {
    _cache = results;
    _cacheExpiry = Date.now() + CACHE_TTL;
  }

  return results;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractAsin(value: string): string | null {
  value = value.trim();
  const dpMatch = value.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch) return dpMatch[1].toUpperCase();
  const bareMatch = value.match(/^([A-Z0-9]{10})$/i);
  if (bareMatch) return bareMatch[1].toUpperCase();
  return null;
}

function extractAsins(html: string): string[] {
  const seen = new Set<string>();
  const found: string[] = [];
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/gi,
    /asin["']?\s*[:=]\s*["']?([A-Z0-9]{10})/gi,
    /lp_asin=([A-Z0-9]{10})/gi,
    /"ASIN"\s*:\s*"([A-Z0-9]{10})"/gi,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(html)) !== null) {
      const a = m[1].toUpperCase();
      // Accept any ASIN, not just B0 prefix — filter overly-common page ASINs
      if (a.length === 10 && !seen.has(a)) {
        seen.add(a);
        found.push(a);
      }
    }
  }
  return found;
}

function looksLikeCaptcha(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("opfcaptcha.amazon") ||
    (lower.includes("captcha") &&
      (lower.includes("escribe los caracteres") ||
        lower.includes("enter the characters")))
  );
}

function cleanText(value: string): string {
  value = value.replace(/<script\b.*?<\/script>/gis, " ");
  value = value.replace(/<style\b.*?<\/style>/gis, " ");
  value = value.replace(/<[^>]+>/g, " ");
  value = value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  return value.replace(/\s+/g, " ").trim();
}

function extractBetween(
  text: string,
  startPattern: RegExp,
  endPattern?: RegExp
): string {
  const start = startPattern.exec(text);
  if (!start) return "";
  const from = start.index + start[0].length;
  if (endPattern) {
    const end = endPattern.exec(text.slice(from));
    if (end) return text.slice(from, from + end.index);
  }
  return text.slice(from, from + 5000);
}

function parseTitle(html: string): string {
  const patterns = [
    /<span[^>]+id="productTitle"[^>]*>([\s\S]*?)<\/span>/i,
    /<meta\s+name="title"\s+content="([^"]+)"/i,
    /<title>([\s\S]*?)<\/title>/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return cleanText(m[1]).replace(/ : Amazon\.com\.mx:.*$/, "").replace(/: Amazon\.com\.mx.*$/, "");
  }
  return "";
}

function parsePrice(html: string): string {
  const buybox = extractBetween(
    html,
    /id="corePriceDisplay_desktop_feature_div"/i,
    /id="[^"]+_feature_div"/i
  );
  const haystack = buybox || html;
  const m1 = haystack.match(/<span class="a-offscreen">(\$[^<]+)<\/span>/i);
  if (m1) return cleanText(m1[1]);
  const m2 = html.match(/"displayPrice"\s*:\s*"([^"]+)"/);
  if (m2) return m2[1].replace(/&amp;/g, "&").replace(/&#\d+;/g, "").trim();
  return "";
}

function parseAvailability(html: string): string {
  const m1 = html.match(
    /primary-availability-message[^>]*>\s*([\s\S]*?)\s*<\/span>/i
  );
  if (m1) return cleanText(m1[1]);
  const block = extractBetween(
    html,
    /id="availability"/i,
    /<\/div>\s*<\/div>/i
  );
  if (block) return cleanText(block);
  if (/No disponible/i.test(html)) return "No disponible";
  if (/Disponible/i.test(html)) return "Disponible";
  return "";
}

function parseSeller(html: string): string {
  const merchantBlock = extractBetween(
    html,
    /id="merchantInfoFeature_feature_div"/i,
    /id="[^"]+_feature_div"/i
  );
  if (merchantBlock) {
    const msgs = [
      ...merchantBlock.matchAll(
        /offer-display-feature-text-message[^>]*>\s*([\s\S]*?)\s*<\/span>/gi
      ),
    ];
    for (const m of msgs) {
      const cleaned = cleanText(m[1]);
      if (cleaned) return cleaned;
    }
    const cleaned = cleanText(merchantBlock);
    if (/Amazon México/i.test(cleaned)) return "Amazon México";
    if (/Amazon\.com\.mx/i.test(cleaned)) return "Amazon.com.mx";
  }
  const plain = cleanText(html);
  const patterns = [
    /Vendido y enviado por\s+([^.<]+)/i,
    /Vendido por\s+([^.<]+)/i,
    /Enviado desde y vendido por\s+([^.<]+)/i,
  ];
  for (const p of patterns) {
    const m = plain.match(p);
    if (m) return cleanText(m[1]);
  }
  return "";
}

function isAvailable(availability: string): boolean {
  const lower = availability.toLowerCase();
  if (
    lower.includes("no disponible") ||
    lower.includes("agotado") ||
    lower.includes("currently unavailable")
  )
    return false;
  return lower.includes("disponible") || lower.includes("en stock");
}

function sellerAllowed(seller: string): boolean {
  if (!seller) return true; // no seller detected → assume Amazon (product page loaded fine)
  const norm = seller
    .toLowerCase()
    .trim()
    .replace(/mexico\b/g, "méxico")
    .replace(/\bpokemon\b/g, "pokémon");
  for (const allowed of ALLOWED_SELLERS) {
    if (norm.includes(allowed)) return true;
  }
  return false;
}

async function fetchPageWithPowerShell(url: string): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "amz-"));
  const tmpFile = join(tmpDir, "page.html");
  const safeUrl = url.replace(/'/g, "''");
  const safeTmp = tmpFile.replace(/'/g, "''");
  const psCmd =
    `Invoke-WebRequest -Uri '${safeUrl}' -UseBasicParsing ` +
    `-UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' ` +
    `-OutFile '${safeTmp}'`;
  try {
    await execFileAsync(
      "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      ["-NoProfile", "-Command", psCmd],
      { timeout: 25000 }
    );
    return await readFile(tmpFile, "utf-8");
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function fetchHtml(url: string): Promise<string> {
  if (process.platform === "win32") {
    try {
      const ps = await fetchPageWithPowerShell(url);
      if (ps && !looksLikeCaptcha(ps)) return ps;
    } catch {
      // fall through
    }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (looksLikeCaptcha(html))
      throw new Error("Amazon mostró CAPTCHA. Intenta más tarde.");
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

const POKEMON_REGEX = /pok[eé]mon|pikachu|eevee|charizard|mewtwo|squirtle|bulbasaur|charmander|gengar|snorlax|lucario|garchomp|rayquaza|meowth|psyduck|jigglypuff|\btcg\b.*carta|carta.*\btcg\b|booster.*pokemon|pokemon.*booster|jazwares.*pok|pok.*jazwares/i;

async function fetchAndParseProduct(asin: string): Promise<any | null> {
  const url = `${BASE_URL}/dp/${asin}`;
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch {
    return null;
  }
  const title = parseTitle(html);
  if (!title) return null; // page didn't load properly (redirect, captcha, etc.)

  // Filter out non-Pokémon products that slip in from broad search queries
  if (!POKEMON_REGEX.test(title)) return null;

  const price = parsePrice(html);
  const availability = parseAvailability(html);
  const seller = parseSeller(html);

  if (!isAvailable(availability)) return null;
  if (!sellerAllowed(seller)) return null;

  return {
    storeId: `AMAZON-${asin}`,
    storeName: title,
    numberOfPieces: 1,
    available: "true",
    stateName: "Amazon México",
    _productUrl: url,
    _price: price,
    _seller: seller || "Amazon.com.mx",
  };
}

async function fetchCatalog(): Promise<any[]> {
  if (_cache.length && Date.now() < _cacheExpiry) return _cache;

  // Step 1: gather ASINs from all search queries
  const allAsins: string[] = [];
  const seen = new Set<string>();

  for (const searchUrl of CATALOG_SEARCH_URLS) {
    try {
      const html = await fetchHtml(searchUrl);
      for (const asin of extractAsins(html)) {
        if (!seen.has(asin)) {
          seen.add(asin);
          allAsins.push(asin);
        }
      }
    } catch {
      // skip failed search query
    }
    await sleep(600);
  }

  // Step 2: check each ASIN in parallel batches of 5
  const results: any[] = [];
  const BATCH = 5;
  for (let i = 0; i < allAsins.length && i < 60; i += BATCH) {
    const batch = allAsins.slice(i, i + BATCH);
    const items = await Promise.all(
      batch.map((asin) => fetchAndParseProduct(asin))
    );
    results.push(...items.filter(Boolean));
    if (i + BATCH < allAsins.length) await sleep(1200);
  }

  // Only cache successful results — never cache an empty list from a CAPTCHA failure
  if (results.length > 0) {
    _cache = results;
    _cacheExpiry = Date.now() + CACHE_TTL;
  }

  if (results.length === 0) {
    throw new Error("Amazon no devolvió productos. Es posible que haya mostrado CAPTCHA. Intenta de nuevo en unos minutos.");
  }

  return results;
}

export function clearAmazonCache() {
  _cache = [];
  _cacheExpiry = 0;
}

export async function buscarAmazon(query: string = ""): Promise<any[]> {
  const q = query.trim();
  const asin = extractAsin(q);
  let serpApiError = "";

  if (SERPAPI_API_KEY) {
    if (!q) {
      const serpCatalog = await fetchCatalogViaSerpApi().catch((error) => {
        console.error("[Amazon] SerpApi catálogo falló:", error?.message || error);
        serpApiError = error?.message || "SerpApi no pudo consultar el catálogo de Amazon México.";
        return null;
      });
      if (serpCatalog && serpCatalog.length > 0) return serpCatalog;
      if (!serpApiError) {
        serpApiError = "SerpApi no devolvió productos para el catálogo Pokémon en Amazon México.";
      }
    } else if (asin) {
      const serpProduct = await fetchProductViaSerpApi(asin).catch((error) => {
        console.error("[Amazon] SerpApi producto falló:", error?.message || error);
        serpApiError = error?.message || `SerpApi no pudo consultar el ASIN ${asin}.`;
        return null;
      });
      if (serpProduct) return [serpProduct];
      if (!serpApiError) {
        serpApiError = `SerpApi no devolvió un producto disponible para el ASIN ${asin}.`;
      }
    }
  }

  const external = await fetchAmazonViaExternalProvider(q).catch((error) => {
    console.error("[Amazon] Proveedor externo falló:", error?.message || error);
    if (!AMAZON_EXTERNAL_FALLBACK_DIRECT) throw error;
    return null;
  });
  if (external) return external;

  if (SERPAPI_API_KEY && !SERPAPI_FALLBACK_DIRECT) {
    throw new Error(
      serpApiError ||
        "Amazon está configurado para usar SerpApi, pero no devolvió resultados. Revisa la API key, el dominio amazon.com.mx o el límite de consultas."
    );
  }

  // Empty query → catalog mode
  if (!q) return fetchCatalog();

  // Single ASIN
  if (asin) {
    const product = await fetchAndParseProduct(asin);
    return product ? [product] : [];
  }

  throw new Error(`Ingresa un ASIN válido (ej. B09V7N86Y1) o deja vacío para ver el catálogo.`);
}
