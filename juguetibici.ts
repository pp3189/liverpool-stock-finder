const BASE_URL = "https://juguetibici.com";

const HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
};

function normalizeHandle(value: string): string | null {
  value = value.trim();
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const m = value.match(/\/products\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  if (value.includes("/")) {
    const m = value.match(/(?:^|\/)products\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  // Pure handle: must contain at least one hyphen (Shopify handles are multi-word slugs like "pokemon-booster-sv")
  // Single words and bare numbers fall through to keyword search
  if (/^[a-z0-9][a-z0-9-]*$/.test(value) && value.includes("-")) return value;

  return null;
}

async function searchHandles(query: string): Promise<string[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=product`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Juguetibici búsqueda error: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const handles: string[] = [];
  const seen = new Set<string>();
  const regex = /href=["'](?:https:\/\/juguetibici\.com)?\/products\/([^"'?#]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const h = m[1];
    if (!seen.has(h)) { handles.push(h); seen.add(h); }
  }
  return handles;
}

async function fetchProduct(handle: string): Promise<any | null> {
  const url = `${BASE_URL}/products/${handle}.js`;
  const res = await fetch(url, { headers: { ...HEADERS, Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Juguetibici producto error: ${res.status}`);
  return res.json();
}

function productToRows(product: any, query: string | null): any[] {
  const rows: any[] = [];
  const queryLower = (query ?? "").trim().toLowerCase();
  const productUrl = BASE_URL + (product.url || `/products/${product.handle ?? ""}`);

  for (const variant of (product.variants ?? [])) {
    const sku = String(variant.sku ?? "");
    const barcode = String(variant.barcode ?? "");
    const variantId = String(variant.id ?? "");
    const productId = String(product.id ?? "");

    // When query is a keyword (not a handle/URL), filter to matching variants
    if (queryLower) {
      const directMatch = [sku, barcode, variantId, productId, product.handle ?? ""]
        .some(v => v.toLowerCase() === queryLower);
      const titleMatch = (product.title ?? "").toLowerCase().includes(queryLower);
      if (!directMatch && !titleMatch) continue;
    }

    if (!variant.available) continue;

    const variantTitle = variant.title === "Default Title" ? null : variant.title;
    const storeName = variantTitle ? `Juguetibici — ${variantTitle}` : "Juguetibici Online";
    const qty = typeof variant.inventory_quantity === "number" ? variant.inventory_quantity : 1;

    rows.push({
      storeId: `JUGUE-${variantId}`,
      storeName,
      numberOfPieces: qty,
      available: "true",
      stateName: "Online",
      _productUrl: productUrl,
    });
  }

  return rows;
}

export async function buscarJuguetibici(query: string): Promise<any[]> {
  const handle = normalizeHandle(query);
  const handles = handle ? [handle] : await searchHandles(query);

  const results: any[] = [];
  for (const h of handles) {
    const product = await fetchProduct(h);
    if (!product) continue;
    // Pass null — Shopify search already filtered relevant products, no need to re-filter
    results.push(...productToRows(product, null));
  }

  return results;
}
