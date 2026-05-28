import fs from "fs";
import path from "path";
import { chromium, type BrowserContext } from "playwright";

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

type BrowserResult = {
  storeId: string;
  storeName: string;
  stateName: string;
  postalCode: string;
  available: boolean;
  status: string;
  methods: string[];
  error?: string;
};

const [, , skuArg, cpArg] = process.argv;
const sku = String(skuArg || "").trim();
const cp = String(cpArg || "").replace(/\D/g, "").slice(0, 5);
const itemByIdBaseUrl =
  "https://www.sams.com.mx/orchestra/pdp/graphql/ItemById/7ca587e81e41241760b794ca2592edff23565e9aca091c2ac0d3ad0722303873";

if (!sku) {
  console.error("Uso: npx tsx scripts/check-sams-browser.ts <itemId> [cp]");
  process.exit(1);
}

const catalogPath = path.join(process.cwd(), "data", "sams-clubs.json");
const clubs = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as CatalogClub[];

function selectedClubs() {
  if (!cp) return clubs;
  return clubs.filter((club) => club.postalCode === cp || club.postalCode.slice(0, 2) === cp.slice(0, 2));
}

function buildLocData(club: CatalogClub) {
  return {
    isDefaultStore: false,
    isExplicitIntent: false,
    fulfillmentOption: "PICKUP",
    pickupStore: {
      accessPointId: club.accessPointId,
      accessType: "INSTORE_PICKUP",
      city: club.city,
      stateOrProvinceCode: club.state,
      countryCode: "MX",
      postalCode: club.postalCode,
      storeId: club.id,
      addressLineOne: club.addressLineOne,
      scheduledEnabled: false,
      unscheduledEnabled: false,
      displayName: club.displayName,
      geoPoint: { latitude: club.latitude, longitude: club.longitude },
      fulfillmentOption: "PICKUP",
      fulfillmentType: "INSTORE_PICKUP",
      instorePickupId: club.accessPointId,
      expressPickupsId: "",
    },
    deliveryStore: {
      accessPointId: club.accessPointId,
      addressLineOne: club.addressLineOne,
      city: club.city,
      stateOrProvinceCode: club.state,
      countryCode: "MX",
      postalCode: club.postalCode,
      storeId: club.id,
      displayName: club.displayName,
      accessType: "DELIVERY",
      storeBrandFormat: "SAMS",
    },
    shipping: {
      postalCode: club.postalCode,
      city: club.city,
      stateOrProvinceCode: club.state,
      countryCode: "MX",
      latitude: club.latitude,
      longitude: club.longitude,
    },
    assortment: {
      intent: "PICKUP",
      storeId: club.id,
      displayName: club.displayName,
      accessType: "INSTORE_PICKUP",
    },
    refreshAt: Date.now() + 1000 * 60 * 60 * 6,
    validateKey: "prod:v2:browser",
  };
}

async function addLocationCookies(context: BrowserContext, club: CatalogClub) {
  const locDataV3 = encodeURIComponent(Buffer.from(JSON.stringify(buildLocData(club))).toString("base64"));
  await context.addCookies([
    { name: "hasLocData", value: "1", domain: ".sams.com.mx", path: "/" },
    { name: "assortmentStoreId", value: club.id, domain: ".sams.com.mx", path: "/" },
    { name: "locDataV3", value: locDataV3, domain: ".sams.com.mx", path: "/" },
    { name: "walmart.nearestPostalCode", value: club.postalCode, domain: ".sams.com.mx", path: "/" },
    { name: "walmart.nearestLatLng", value: `"${club.latitude},${club.longitude}"`, domain: ".sams.com.mx", path: "/" },
    { name: "mx-gl-sams", value: "true", domain: ".sams.com.mx", path: "/" },
  ]);
}

function buildItemByIdUrl() {
  const variables = {
    isMobile: false,
    channel: "WWW",
    version: "v1",
    postProcessingVersion: 1,
    pageType: "ItemPageGlobal",
    tenant: "MX_SAMS_GLASS",
    iId: sku,
    layout: ["itemDesktop"],
    p13nCls: {
      pageId: sku,
      skipPtcFetch: true,
      p13NCallType: "",
      userClientInfo: { isZipLocated: true, callType: "CLIENT" },
      userReqInfo: {
        refererContext: {
          source: "itempage",
          query: "",
          sourceId: null,
          wmlspartner: null,
          variantSwitch: false,
          itemSwitchContext: { refererItem: null, sizeReferer: null },
        },
        enableSlaBadgeV2: false,
      },
    },
    p13N: {
      userClientInfo: { isZipLocated: true, deviceType: "desktop", callType: "CLIENT" },
      userReqInfo: {
        refererContext: { source: "itempage", sourceId: null, wmlspartner: null },
        pageUrl: `/ip/${sku}`,
      },
    },
    count: 2,
    startAt: 1,
  };

  const url = new URL(`${itemByIdBaseUrl}/ip/${encodeURIComponent(sku)}`);
  url.searchParams.set("variables", JSON.stringify(variables));
  return url.toString();
}

async function checkClub(context: BrowserContext, club: CatalogClub): Promise<BrowserResult> {
  try {
    await addLocationCookies(context, club);
    const page = await context.newPage();
    await page.goto("https://www.sams.com.mx/", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(5000);

    const fetchResult = await page.evaluate(async ({ url, skuValue }) => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "accept-language": "es-MX",
          "content-type": "application/json",
          "x-apollo-operation-name": "ItemById",
          "x-o-bu": "SAMS-MX",
          "x-o-ccm": "server",
          "x-o-gql-query": "query ItemById",
          "x-o-item-id": skuValue,
          "x-o-mart": "B2C",
          "x-o-platform": "rweb",
          "x-o-platform-version": "main-1.247.1-61a7a10-0521T1437",
          "x-o-segment": "oaoh",
          "wm_consumer.banner": "SAMS",
          "wm_mp": "true",
          "wm_page_url": `https://www.sams.com.mx/ip/${skuValue}`,
        },
      });

      const text = await response.text();
      return {
        ok: response.ok,
        status: response.status,
        url: response.url,
        text,
      };
    }, { url: buildItemByIdUrl(), skuValue: sku });

    if (!fetchResult.text) {
      return {
        storeId: club.id,
        storeName: club.displayName,
        stateName: club.state,
        postalCode: club.postalCode,
        available: false,
        status: "NO_BROWSER_FETCH_RESPONSE",
        methods: [],
      };
    }

    if (fetchResult.status === 412 || fetchResult.url.includes("/blocked") || fetchResult.text.includes("/blocked")) {
      return {
        storeId: club.id,
        storeName: club.displayName,
        stateName: club.state,
        postalCode: club.postalCode,
        available: false,
        status: "BLOCKED",
        methods: [],
        error: "PerimeterX 412",
      };
    }

    const data = JSON.parse(fetchResult.text);
    const product = data?.data?.product;
    const labels = Array.isArray(product?.fulfillmentLabel) ? product.fulfillmentLabel : [];
    const methods = labels.map((label: any) => label.message).filter(Boolean);
    const available = product?.availabilityStatus === "IN_STOCK" && product?.showAtc !== false;

    return {
      storeId: club.id,
      storeName: club.displayName,
      stateName: club.state,
      postalCode: club.postalCode,
      available,
      status: product?.availabilityStatus || "UNKNOWN",
      methods,
    };
  } catch (error: any) {
    return {
      storeId: club.id,
      storeName: club.displayName,
      stateName: club.state,
      postalCode: club.postalCode,
      available: false,
      status: "ERROR",
      methods: [],
      error: error?.message || "Error consultando navegador",
    };
  } finally {
    for (const page of context.pages().slice(1)) {
      await page.close().catch(() => undefined);
    }
  }
}

async function main() {
  const targetClubs = selectedClubs();
  const userDataDir = path.join(process.cwd(), "data", "sams-browser-profile");
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: process.env.SAMS_BROWSER_CHANNEL || "chrome",
    headless: process.env.SAMS_HEADLESS !== "false",
    locale: "es-MX",
    viewport: { width: 1366, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  });

  try {
    const results: BrowserResult[] = [];
    for (const club of targetClubs) {
      results.push(await checkClub(context, club));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(JSON.stringify({
      sku,
      cp: cp || null,
      totalClubsChecked: results.length,
      availableClubs: results.filter((item) => item.available).length,
      results,
    }, null, 2));
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
