import { readFileSync } from "fs";
import { resolve } from "path";

const NEARBY_NODES_URL =
  "https://www.sams.com.mx/orchestra/graphql/nearByNodes/383d44ac5962240870e513c4f53bb3d05a143fd7b19acb32e8a83e39f1ed266c";

const ITEM_BY_ID_BASE_URL =
  "https://www.sams.com.mx/orchestra/pdp/graphql/ItemById/7ca587e81e41241760b794ca2592edff23565e9aca091c2ac0d3ad0722303873";

// PerimeterX cookie store — cookies extracted from a real browser session
const PX_COOKIE_TTL = 1000 * 60 * 90; // 90 minutes
let _pxCookies = "";
let _pxCookiesExpiry = 0;

// Track recent 412 blocks to detect burned sessions
let _recentBlockCount = 0;
let _recentBlockTimestamp = 0;

export function recordPxBlock(): void {
  _recentBlockCount++;
  _recentBlockTimestamp = Date.now();
}

export function resetPxBlockCount(): void {
  _recentBlockCount = 0;
}

/** Returns true if ≥3 clubs got 412 in the last 60 seconds — session is burned */
export function isSessionBurned(): boolean {
  if (_recentBlockCount < 3) return false;
  return Date.now() - _recentBlockTimestamp < 60_000;
}

export function setSamsPxCookies(rawCookies: string): void {
  _pxCookies = rawCookies.trim();
  _pxCookiesExpiry = Date.now() + PX_COOKIE_TTL;
}

export function getSamsPxCookieStatus(): { valid: boolean; expiresInMs?: number } {
  if (!_pxCookies) return { valid: false };
  const remaining = _pxCookiesExpiry - Date.now();
  if (remaining <= 0) {
    _pxCookies = "";
    return { valid: false };
  }
  return { valid: true, expiresInMs: remaining };
}

const HEADERS = {
  Accept: "application/json",
  "Accept-Language": "es-MX",
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Referer: "https://www.sams.com.mx/search",
  "x-apollo-operation-name": "ItemById",
  "x-o-bu": "SAMS-MX",
  "x-o-ccm": "server",
  "x-o-gql-query": "query ItemById",
  "x-o-mart": "B2C",
  "x-o-platform": "rweb",
  "x-o-platform-version": "main-1.247.1-61a7a10-0521T1437",
  "x-o-segment": "oaoh",
  "wm_consumer.banner": "SAMS",
  "wm_mp": "true",
};

const CONCURRENCY_LIMIT = 3;

type SamsAddress = {
  city?: string;
  state?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  addressLineOne?: string;
  address1?: string;
};

type SamsNode = {
  id: string;
  displayName?: string;
  name?: string;
  address?: SamsAddress;
  geoPoint?: {
    latitude?: number;
    longitude?: number;
  };
  capabilities?: Array<{
    accessPointId?: string;
  }>;
};

function cleanCp(cp?: string): string | null {
  const value = String(cp || "").replace(/\D/g, "").slice(0, 5);
  return value.length === 5 ? value : null;
}

function getNodeName(node: SamsNode): string {
  return node.displayName || node.name || `Sam's Club ${node.id}`;
}

function getNodeState(node: SamsNode): string {
  const address = node.address || {};
  return address.state || address.stateOrProvinceCode || "Sam's Club";
}

function buildNearbyUrl(cp: string): string {
  const variables = {
    input: {
      postalCode: cp,
      accessTypes: ["PICKUP_INSTORE", "PICKUP_CURBSIDE"],
      nodeTypes: ["STORE", "PICKUP_SPOKE", "PICKUP_POPUP"],
      latitude: null,
      longitude: null,
      radius: null,
    },
    checkItemAvailability: false,
    checkWeeklyReservation: false,
    enableStoreSelectorMarketplacePickup: false,
    enableVisionStoreSelector: false,
    enableStorePagesAndFinderPhase2: false,
    enableStoreBrandFormat: false,
    disableNodeAddressPostalCode: false,
  };

  const url = new URL(NEARBY_NODES_URL);
  url.searchParams.set("variables", JSON.stringify(variables));
  return url.toString();
}

function buildItemUrl(sku: string): string {
  const variables = {
    isMobile: false,
    channel: "WWW",
    version: "v1",
    postProcessingVersion: 1,
    pageType: "ItemPageGlobal",
    tenant: "MX_SAMS_GLASS",
    tempo: {
      targeting: "%7B%22userState%22%3A%22loggedIn%22%7D",
      params: [
        { key: "expoVars", value: "expoVariationValue" },
        { key: "expoVars", value: "expoVariationValue2" },
      ],
    },
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
    iId: sku,
    layout: ["itemDesktop"],
    p13N: {
      userClientInfo: { isZipLocated: true, deviceType: "desktop", callType: "CLIENT" },
      userReqInfo: {
        refererContext: { source: "itempage", sourceId: null, wmlspartner: null },
        pageUrl: `/ip/${sku}`,
      },
    },
    cSId: "",
    sSId: null,
    fBBAd: true,
    eLLBBAds: false,
    adV1Enabled: false,
    fMq: true,
    fGalAd: false,
    fSCar: true,
    fDac: false,
    fBB: true,
    enableAdsTemplateBadging: false,
    fSL: true,
    fIdml: true,
    sIdml: false,
    fMrkDscrp: false,
    fRev: true,
    fFit: true,
    fSeo: true,
    fP13: true,
    fAff: true,
    spVid: false,
    spSBA: false,
    eItIb: true,
    fIlc: false,
    bbe: false,
    fSId: true,
    eSb: true,
    eCc: false,
    eSsm: false,
    enableRelatedSearch: false,
    enableTopReasonsToBuy: false,
    enableDetailedBeacon: true,
    enableMultiSave: true,
    enableBnplMessage: false,
    enableAOSModuleAttribute: false,
    enableSizePredictor: false,
    fRem: false,
    enablePromoData: false,
    enablePromotionMessages: false,
    enableChannelLevelPricing: false,
    enableSignInToSeePrice: false,
    eTwc: false,
    enableSecondaryOffers: false,
    enableSWC: false,
    enableReimagineSnapshot: false,
    isSubscriptionFrequencyListEnabled: false,
    enableWplusFulfillmentModalOnItemPage: false,
    enableNutritionFacts: true,
    enableProSellerHighlight: false,
    enableProductAttributeEnrichment: false,
    isSubscriptionEligible: false,
    vTOP: {
      personaId: 0,
      personaManId: 0,
      isByomActive: false,
      isCYOMManActive: true,
      isCYOMImageReductionEnabled: false,
      isFollowMeActive: false,
    },
    sV: false,
    sVC: false,
    vFId: null,
    pAdd: null,
    sFId: null,
    sizePredictorInput: null,
    enableTrueFitSizeChart: false,
    conditionGroupCode: null,
    conditionCodes: [],
    selectedOfferId: null,
    conditionType: "NEW",
    enableRxDrugScheduleModal: false,
    isGEPEnable: false,
    enableUpstreamErrorCode: false,
    filterCriteria: null,
    eA2S: false,
    attributesCacheKey: "",
    count: 2,
    startAt: 1,
    enableB2BItemConditionPricing: false,
    enableCarouselStrategy: false,
    enableOptimisticWeightUpdate: false,
    enableStreamLinedBadging: false,
    enableSparky: false,
    enableItemPageFaq: false,
  };

  const url = new URL(`${ITEM_BY_ID_BASE_URL}/ip/${encodeURIComponent(sku)}`);
  url.searchParams.set("variables", JSON.stringify(variables));
  return url.toString();
}

function buildLocDataCookie(node: SamsNode): string {
  const address = node.address || {};
  const geo = node.geoPoint || {};
  const accessPointId = node.capabilities?.[0]?.accessPointId || "";
  const displayName = getNodeName(node);
  const state = getNodeState(node);
  const addressLineOne = address.addressLineOne || address.address1 || "";

  const locData = {
    isDefaultStore: false,
    isExplicitIntent: false,
    fulfillmentOption: "PICKUP",
    pickupStore: {
      accessPointId,
      accessType: "INSTORE_PICKUP",
      city: address.city || "",
      stateOrProvinceCode: state,
      countryCode: "MX",
      postalCode: address.postalCode || "",
      storeId: String(node.id),
      addressLineOne,
      scheduledEnabled: false,
      unscheduledEnabled: false,
      displayName,
      geoPoint: { latitude: geo.latitude, longitude: geo.longitude },
      fulfillmentOption: "PICKUP",
      fulfillmentType: "INSTORE_PICKUP",
      instorePickupId: accessPointId,
      expressPickupsId: "",
    },
    deliveryStore: {
      accessPointId,
      addressLineOne,
      city: address.city || "",
      stateOrProvinceCode: state,
      countryCode: "MX",
      postalCode: address.postalCode || "",
      storeId: String(node.id),
      displayName,
      accessType: "DELIVERY",
      storeBrandFormat: "SAMS",
    },
    shipping: {
      postalCode: address.postalCode || "",
      city: address.city || "",
      stateOrProvinceCode: state,
      countryCode: "MX",
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    assortment: {
      intent: "PICKUP",
      storeId: String(node.id),
      displayName,
      accessType: "INSTORE_PICKUP",
    },
    refreshAt: Date.now() + 1000 * 60 * 60 * 6,
    validateKey: "prod:v2:generated",
  };

  return encodeURIComponent(Buffer.from(JSON.stringify(locData)).toString("base64"));
}

function buildCookie(node: SamsNode): string {
  const address = node.address || {};
  const geo = node.geoPoint || {};
  const locationParts = [
    "hasLocData=1",
    `assortmentStoreId=${node.id}`,
    `locDataV3=${buildLocDataCookie(node)}`,
    `walmart.nearestPostalCode=${address.postalCode || ""}`,
    `walmart.nearestLatLng="${geo.latitude || ""},${geo.longitude || ""}"`,
    "mx-gl-sams=true",
  ].join("; ");

  const status = getSamsPxCookieStatus();
  if (status.valid && _pxCookies) {
    return `${_pxCookies}; ${locationParts}`;
  }
  return locationParts;
}

async function getNearbyNodes(cp: string): Promise<SamsNode[]> {
  const response = await fetch(buildNearbyUrl(cp), {
    headers: {
      ...HEADERS,
      "x-apollo-operation-name": "nearByNodes",
      "x-o-gql-query": "query nearByNodes",
    },
  });

  if (!response.ok) {
    throw new Error(`Sam's nearByNodes error: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  return data?.data?.nearByNodes?.nodes || [];
}

async function consultarSkuEnClub(sku: string, node: SamsNode) {
  const response = await fetch(buildItemUrl(sku), {
    headers: {
      ...HEADERS,
      Cookie: buildCookie(node),
      Referer: `https://www.sams.com.mx/ip/${encodeURIComponent(sku)}`,
      "wm_page_url": `https://www.sams.com.mx/ip/${encodeURIComponent(sku)}`,
      "x-o-item-id": sku,
    },
  });

  if (!response.ok) {
    if (response.status === 412) {
      recordPxBlock();
      console.log(`[Sam's] ${getNodeName(node)} SKU ${sku}: bloqueado por PerimeterX (412) — saltando este club`);
      return null; // non-fatal: skip this club and continue with others
    }
    console.log(`[Sam's] ${getNodeName(node)} SKU ${sku}: HTTP ${response.status}`);
    return null;
  }

  const data: any = await response.json();

  // Try multiple known response paths
  const product =
    data?.data?.product ||
    data?.data?.itemById?.product ||
    data?.data?.itemPage?.product ||
    null;

  if (product) {
    console.log(`[Sam's] ${getNodeName(node)} SKU ${sku}: availabilityStatus="${product.availabilityStatus}" showAtc=${product.showAtc}`);
  } else {
    console.log(`[Sam's] ${getNodeName(node)} SKU ${sku}: sin producto. Claves data: ${JSON.stringify(Object.keys(data?.data ?? {}))}`);
  }

  return product;
}

// Statuses that mean the item is explicitly unavailable
const OUT_OF_STOCK_STATUSES = new Set([
  "OUT_OF_STOCK", "UNAVAILABLE", "DISCONTINUED", "NOT_AVAILABLE",
]);

function productToRows(product: any, node: SamsNode) {
  if (!product) return [];

  const status: string = (product.availabilityStatus || "").toUpperCase();
  const isUnavailable = OUT_OF_STOCK_STATUSES.has(status) || status.includes("OUT_OF_STOCK");
  // showAtc === false means "do not show Add To Cart" — explicitly not purchasable
  const cantBuy = product.showAtc === false;

  if (isUnavailable || cantBuy) {
    return [];
  }

  const address = node.address || {};
  const labels = Array.isArray(product.fulfillmentLabel) ? product.fulfillmentLabel : [];
  const rows = labels.length > 0 ? labels : [{ message: "Compra disponible", fulfillmentMethod: "ONLINE" }];

  return rows.map((label: any, idx: number) => ({
    storeId: `SAMS-${node.id}-${label.fulfillmentMethod || idx}`,
    storeName: `${getNodeName(node)} | ${label.message || "Compra disponible"}`,
    numberOfPieces: 1,
    available: "true",
    stateName: getNodeState(node) || address.city || "Sam's Club",
  }));
}

// Convert the flat JSON club record to the SamsNode shape expected by the rest of the code
function jsonClubToNode(club: any): SamsNode {
  return {
    id: String(club.id),
    displayName: club.displayName,
    address: {
      city: club.city,
      state: club.state,
      stateOrProvinceCode: club.state,
      postalCode: club.postalCode || "",
      addressLineOne: club.addressLineOne || "",
      address1: club.addressLineOne || "",
    },
    geoPoint: {
      latitude: club.latitude,
      longitude: club.longitude,
    },
    capabilities: club.accessPointId ? [{ accessPointId: club.accessPointId }] : [],
  };
}

// Search all saved clubs from data/sams-clubs.json — no CP required
export async function buscarSamsNacional(sku: string) {
  const rawClubs: any[] = JSON.parse(readFileSync(resolve("data/sams-clubs.json"), "utf-8"));
  const nodes: SamsNode[] = rawClubs.map(jsonClubToNode);
  const results: any[] = [];

  for (let i = 0; i < nodes.length; i += CONCURRENCY_LIMIT) {
    if (i > 0) await new Promise(r => setTimeout(r, 800)); // pace requests to avoid PX rate limits
    const batch = nodes.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (node) => {
        const product = await consultarSkuEnClub(sku, node);
        return productToRows(product, node);
      })
    );
    for (const rows of batchResults) {
      results.push(...rows);
    }
  }

  const unique = new Map<string, any>();
  for (const row of results) {
    unique.set(`${row.storeId}|${row.storeName}`, row);
  }

  return [...unique.values()];
}

export async function buscarSams(sku: string, cp?: string) {
  const clean = cleanCp(cp);
  if (!clean) return [];

  const nodes = await getNearbyNodes(clean);
  const results: any[] = [];

  for (let i = 0; i < nodes.length; i += CONCURRENCY_LIMIT) {
    const batch = nodes.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (node) => {
        const product = await consultarSkuEnClub(sku, node);
        return productToRows(product, node);
      })
    );
    for (const rows of batchResults) {
      results.push(...rows);
    }
  }

  const unique = new Map<string, any>();
  for (const row of results) {
    unique.set(`${row.storeId}|${row.storeName}`, row);
  }

  return [...unique.values()];
}
