const INVENTORY_URL = "https://www.elpalaciodehierro.com/fluentinventory";

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Referer: "https://www.elpalaciodehierro.com/",
};

export async function buscarPalacio(sku: string) {
  const url = new URL(INVENTORY_URL);
  url.searchParams.set("productId", sku);

  const response = await fetch(url.toString(), { headers: HEADERS });

  if (!response.ok) {
    throw new Error(`Palacio de Hierro error: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  const stores: any[] = data?.data?.storesByProduct ?? [];

  return stores
    .filter((s: any) => s.hasStock === true)
    .map((s: any) => ({
      storeId: `PALACIO-${s.locationRef ?? s.store_id ?? ""}`,
      storeName: (s.storename ?? s.store_name ?? "Palacio de Hierro").trim(),
      numberOfPieces: 1, // Palacio no expone cantidad, solo disponibilidad
      available: "true",
      stateName: "Palacio de Hierro",
    }));
}
