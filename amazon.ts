import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);

const BASE_URL = "https://www.amazon.com.mx";

// Search queries that cover official Pokémon products on Amazon México.
// Multiple queries = better coverage. Results are deduplicated by ASIN.
const CATALOG_SEARCH_URLS = [
  `${BASE_URL}/s?k=pokemon+tcg+cartas&i=toys`,
  `${BASE_URL}/s?k=pokemon+coleccion+booster&i=toys`,
  `${BASE_URL}/s?k=pokemon+juguetes+figuras&i=toys`,
];

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

  _cache = results;
  _cacheExpiry = Date.now() + CACHE_TTL;
  return results;
}

export function clearAmazonCache() {
  _cache = [];
  _cacheExpiry = 0;
}

export async function buscarAmazon(query: string = ""): Promise<any[]> {
  const q = query.trim();

  // Empty query → catalog mode
  if (!q) return fetchCatalog();

  // Single ASIN
  const asin = extractAsin(q);
  if (asin) {
    const product = await fetchAndParseProduct(asin);
    return product ? [product] : [];
  }

  throw new Error(`Ingresa un ASIN válido (ej. B09V7N86Y1) o deja vacío para ver el catálogo.`);
}
