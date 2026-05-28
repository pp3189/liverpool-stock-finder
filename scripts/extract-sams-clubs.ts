import fs from "fs";
import path from "path";

type CatalogClub = {
  id: string;
  displayName: string;
  city: string;
  state: string;
  postalCode: string;
  addressLineOne: string;
  latitude: number;
  longitude: number;
  accessPointId: string;
};

const [, , harPathArg] = process.argv;

if (!harPathArg) {
  console.error("Uso: npx tsx scripts/extract-sams-clubs.ts C:\\ruta\\www.sams.com.mx.har");
  process.exit(1);
}

const harPath = path.resolve(harPathArg);
const outputPath = path.join(process.cwd(), "data", "sams-clubs.json");

function readExistingCatalog(): CatalogClub[] {
  try {
    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch {
    return [];
  }
}

function normalizeClub(node: any): CatalogClub | null {
  const capability = node?.capabilities?.[0] || {};
  const address = node?.address || {};
  const geo = node?.geoPoint || {};

  if (!node?.id || !capability.accessPointId || !address.postalCode) {
    return null;
  }

  return {
    id: String(node.id),
    displayName: node.displayName || node.name || `Sam's Club ${node.id}`,
    city: address.city || "",
    state: address.state || address.stateOrProvinceCode || "",
    postalCode: String(address.postalCode).replace(/\D/g, "").padStart(5, "0"),
    addressLineOne: address.addressLineOne || address.address1 || address.streetAddress || "",
    latitude: Number(geo.latitude || 0),
    longitude: Number(geo.longitude || 0),
    accessPointId: capability.accessPointId,
  };
}

const har = JSON.parse(fs.readFileSync(harPath, "utf8"));
const found = new Map<string, CatalogClub>();

for (const item of readExistingCatalog()) {
  found.set(item.id, item);
}

for (const entry of har?.log?.entries || []) {
  const text = entry?.response?.content?.text || "";
  if (!text.includes("nearByNodes") || !text.includes("accessPointId")) continue;

  try {
    const payload = JSON.parse(text);
    const nodes = payload?.data?.nearByNodes?.nodes || [];
    for (const node of nodes) {
      const club = normalizeClub(node);
      if (club) found.set(club.id, club);
    }
  } catch {
    // Some HAR response bodies are encoded or truncated. Ignore those entries.
  }
}

const output = [...found.values()].sort((a, b) =>
  `${a.state}|${a.city}|${a.displayName}`.localeCompare(`${b.state}|${b.city}|${b.displayName}`)
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Catálogo Sam's actualizado: ${output.length} clubs en ${outputPath}`);
