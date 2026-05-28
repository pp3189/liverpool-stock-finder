import { URLSearchParams } from "url";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Content-Type": "application/json",
  Referer: "https://www.chedraui.com.mx/",
};

const CATALOG_URL = "https://www.chedraui.com.mx/api/catalog_system/pub/products/search";
const SIMULATION_URL = "https://www.chedraui.com.mx/api/checkout/pub/orderForms/simulation";
const GRAPHQL_PUBLIC_URL = "https://www.chedraui.com.mx/_v/public/graphql/v1";

const CACHE_TTL = 1000 * 60 * 60 * 12;
const CONCURRENCY_LIMIT = 20;

let cachedTiendas: ChedrauiStore[] | null = null;
let lastFetchTime = 0;

type ChedrauiStore = {
  id_store?: string;
  full_name?: string;
  short_name?: string;
  state?: string;
  city?: string;
  postal_code?: string | null;
};

type CpCandidate = {
  cp: string;
  estado: string;
  ciudad: string;
  tiendaNombre: string;
  storeId: string;
};

type CheckoutSimulation = {
  cp: string;
  disponible: boolean;
  availability: string;
  entrega: string[];
  pickup: string[];
  mensaje?: string;
};

function normalizarCp(cp: unknown): string | null {
  if (!cp) return null;
  const cleaned = String(cp).replace(/\D/g, "");
  if (!cleaned) return null;
  return cleaned.padStart(5, "0");
}

function normalizeString(str: string): string {
  return (str || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s/]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matcherEstado(tiendaEstado: string, reqEstado: string): boolean {
  const tienda = normalizeString(tiendaEstado);
  const requested = normalizeString(reqEstado);

  if (!requested || requested === "NACIONAL") return true;

  if (
    requested === "CDMX/ZONA METROPOLITANA" ||
    requested === "CDMX" ||
    requested === "CIUDAD DE MEXICO" ||
    requested === "ESTADO DE MEXICO"
  ) {
    return [
      "CDMX",
      "CIUDAD DE MEXICO",
      "DISTRITO FEDERAL",
      "ESTADO DE MEXICO",
      "MEXICO",
      "EDOMEX",
    ].includes(tienda);
  }

  return tienda === requested || tienda.includes(requested) || requested.includes(tienda);
}

function limpiarSla(name: string): string {
  return (name || "")
    .replace("ENTREGA DOMICILIO - ", "")
    .replace("RECOGER EN TIENDA - ", "")
    .trim();
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

export async function getProducto(sku: string) {
  const url = `${CATALOG_URL}?fq=skuId:${encodeURIComponent(sku)}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) return null;

  const data: any = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const product = data[0];
  const item = product.items?.[0] || {};
  const seller = item.sellers?.[0] || {};
  const offer = seller.commertialOffer || {};

  return {
    sku,
    nombre: product.productName || item.nameComplete || "Producto sin nombre",
    marca: product.brand || "",
    url: product.link || "",
    catalogo_disponible: Boolean(offer.IsAvailable),
    catalogo_cantidad: Number(offer.AvailableQuantity || 0),
    precio: offer.Price,
    precio_lista: offer.ListPrice,
  };
}

async function getTiendas(): Promise<ChedrauiStore[]> {
  const params = new URLSearchParams({
    workspace: "master",
    maxAge: "short",
    appsEtag: "remove",
    domain: "store",
    locale: "es-MX",
    operationName: "getDocuments",
    variables: "{}",
    extensions: JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: "5ca50fd8e03fcbac2ade9bc135a1ef5735d0900cb8e1f2d284c967820236c293",
        sender: "chedrauimx.locator@2.x",
        provider: "vtex.store-graphql@2.x",
      },
      variables:
        "eyJwYWdlU2l6ZSI6NTAwLCJhY3JvbnltIjoiQ1MiLCJmaWVsZHMiOlsiYWRkcmVzcyIsImlkX3N0b3JlIiwiY2l0eSIsImZ1bGxfbmFtZSIsImxhdGl0dWRlIiwibG9uZ2l0dWRlIiwic3RhdGUiLCJzaG9ydF9uYW1lIiwicG9zdGFsX2NvZGUiXX0=",
    }),
  });

  const response = await fetch(`${GRAPHQL_PUBLIC_URL}?${params.toString()}`, {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Chedraui GraphQL error: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  const docs = data?.data?.documents || [];

  return docs.map((doc: any) => {
    const tienda: ChedrauiStore = {};
    for (const field of doc.fields || []) {
      (tienda as any)[field.key] = field.value || "";
    }
    tienda.postal_code = normalizarCp(tienda.postal_code);
    return tienda;
  });
}

async function getCachedTiendas(): Promise<ChedrauiStore[]> {
  const now = Date.now();
  if (cachedTiendas && now - lastFetchTime < CACHE_TTL) {
    return cachedTiendas;
  }

  const fresh = await getTiendas();
  cachedTiendas = fresh;
  lastFetchTime = now;
  return fresh;
}

function buildCpCandidates(tiendas: ChedrauiStore[], estado: string): CpCandidate[] {
  const isNational = normalizeString(estado) === "NACIONAL";
  const filtered = isNational ? tiendas : tiendas.filter((t) => matcherEstado(t.state || "", estado));
  const seen = new Set<string>();
  const candidates: CpCandidate[] = [];

  for (const tienda of filtered) {
    const cp = normalizarCp(tienda.postal_code);
    if (!cp || seen.has(cp)) continue;

    seen.add(cp);
    candidates.push({
      cp,
      estado: tienda.state || "",
      ciudad: tienda.city || "",
      tiendaNombre: tienda.full_name || tienda.short_name || "Chedraui",
      storeId: tienda.id_store || `CHED-${cp}`,
    });
  }

  return candidates.sort((a, b) =>
    `${a.estado}|${a.ciudad}|${a.cp}`.localeCompare(`${b.estado}|${b.ciudad}|${b.cp}`)
  );
}

async function consultarCompraPorCp(sku: string, cp: string): Promise<CheckoutSimulation> {
  const cleanCp = normalizarCp(cp);
  if (!cleanCp) {
    return {
      cp: "",
      disponible: false,
      availability: "invalidCp",
      entrega: [],
      pickup: [],
      mensaje: "Código postal inválido",
    };
  }

  const payload = {
    items: [{ id: String(sku), quantity: 1, seller: "1" }],
    postalCode: cleanCp,
    country: "MEX",
  };

  try {
    const response = await fetch(SIMULATION_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        cp: cleanCp,
        disponible: false,
        availability: `HTTP ${response.status}`,
        entrega: [],
        pickup: [],
        mensaje: response.statusText,
      };
    }

    const data: any = await response.json();
    const item = data.items?.[0] || {};
    const logistics = data.logisticsInfo?.[0] || {};
    const slas = logistics.slas || [];
    const messages = data.messages || [];

    const entrega = dedupe(
      slas
        .filter((sla: any) => sla.deliveryChannel === "delivery")
        .map((sla: any) => limpiarSla(sla.name || sla.id))
    );

    const pickup = dedupe(
      slas
        .filter((sla: any) => sla.deliveryChannel === "pickup-in-point")
        .map((sla: any) => limpiarSla(sla.name || sla.id))
    );

    return {
      cp: cleanCp,
      disponible: item.availability === "available" && slas.length > 0,
      availability: item.availability || "sinRespuesta",
      entrega,
      pickup,
      mensaje: messages[0]?.text || "",
    };
  } catch (error: any) {
    return {
      cp: cleanCp,
      disponible: false,
      availability: "error",
      entrega: [],
      pickup: [],
      mensaje: error?.message || "Error consultando Chedraui",
    };
  }
}

function toStoreResults(candidate: CpCandidate, simulation: CheckoutSimulation, catalogQty: number) {
  const qty = Math.max(1, catalogQty || 1);
  const rows: any[] = [];
  const zona = `${candidate.ciudad || "Zona Chedraui"} CP ${candidate.cp}`.trim();

  for (const pickup of simulation.pickup) {
    rows.push({
      storeId: `CHED-${candidate.cp}-${pickup.replace(/\W+/g, "").toUpperCase()}`,
      storeName: `${zona} | Recoger: ${pickup}`,
      numberOfPieces: qty,
      available: "true",
      stateName: candidate.estado || "Chedraui",
    });
  }

  for (const entrega of simulation.entrega) {
    rows.push({
      storeId: `CHED-${candidate.cp}-${entrega.replace(/\W+/g, "").toUpperCase()}-DELIVERY`,
      storeName: `${zona} | Entrega: ${entrega}`,
      numberOfPieces: qty,
      available: "true",
      stateName: candidate.estado || "Chedraui",
    });
  }

  if (rows.length === 0 && simulation.disponible) {
    rows.push({
      storeId: candidate.storeId,
      storeName: `${zona} | Compra online disponible`,
      numberOfPieces: qty,
      available: "true",
      stateName: candidate.estado || "Chedraui",
    });
  }

  return rows;
}

export async function buscarChedraui(sku: string, estado: string, cp?: string) {
  const product = await getProducto(sku);
  const catalogQty = Number(product?.catalogo_cantidad || 0);

  if (cp) {
    const cleanCp = normalizarCp(cp);
    if (!cleanCp) return [];

    const simulation = await consultarCompraPorCp(sku, cleanCp);
    if (!simulation.disponible) return [];

    return toStoreResults(
      {
        cp: cleanCp,
        estado: `CP ${cleanCp}`,
        ciudad: "Consulta exacta",
        tiendaNombre: "Chedraui",
        storeId: `CHED-${cleanCp}`,
      },
      simulation,
      catalogQty
    );
  }

  const tiendas = await getCachedTiendas();
  const candidates = buildCpCandidates(tiendas, estado || "NACIONAL");
  const results: any[] = [];

  for (let i = 0; i < candidates.length; i += CONCURRENCY_LIMIT) {
    const batch = candidates.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const simulation = await consultarCompraPorCp(sku, candidate.cp);
        if (!simulation.disponible) return [];
        return toStoreResults(candidate, simulation, catalogQty);
      })
    );
    for (const rows of batchResults) {
      results.push(...rows);
    }
  }

  const unique = new Map<string, any>();
  for (const row of results) {
    unique.set(`${row.stateName}|${row.storeName}`, row);
  }

  return [...unique.values()];
}
