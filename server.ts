import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { buscarChedraui } from "./chedraui";
import { buscarPalacio } from "./palacio";
import { buscarJuguetibici } from "./juguetibici";
import { buscarAmazon, clearAmazonCache } from "./amazon";
import { buscarSams, buscarSamsNacional, setSamsPxCookies, getSamsPxCookieStatus, isSessionBurned, resetPxBlockCount } from "./sams";
import { startSamsCookieAutoRefresh, refreshSamsCookiesViaPlaywright } from "./sams-cookie-refresher";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

const TODOS_LOS_ESTADOS = [
  "AGUASCALIENTES", "BAJA CALIFORNIA", "BAJA CALIFORNIA SUR", "CAMPECHE",
  "CDMX/ZONA METROPOLITANA", "CHIAPAS", "CHIHUAHUA", "COAHUILA", "COLIMA",
  "DURANGO", "GUANAJUATO", "GUERRERO", "HIDALGO", "JALISCO", "MICHOACAN",
  "MORELOS", "NAYARIT", "NUEVO LEON", "OAXACA", "PUEBLA", "QUERETARO",
  "QUINTANA ROO", "SAN LUIS POTOSI", "SINALOA", "SONORA", "TABASCO",
  "TAMAULIPAS", "TLAXCALA", "VERACRUZ", "YUCATAN", "ZACATECAS"
];

const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://www.liverpool.com.mx/",
  "Origin": "https://www.liverpool.com.mx",
};

// Consult individual state stock
async function consultarEstado(sku: string, estado: string) {
  const payload = {
    "ïsStoreListforEDD": "false",
    "onlyAvailableStore": "false",
    "productType": "S",
    "skuId": sku,
    "state": estado
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://www.liverpool.com.mx/realtimeinventorycheckservice", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data: any = await response.json();
    const tiendas = data.storeInventoryDetails || [];

    return tiendas
      .filter((t: any) => 
        t.available === "true" && 
        Number(t.numberOfPieces || 0) > 0 &&
        !t.storeName?.toLowerCase().includes("suburbia")
      )
      .map((t: any) => ({
        storeId: t.storeId,
        storeName: t.storeName,
        numberOfPieces: Number(t.numberOfPieces || 0),
        available: t.available,
        stateName: estado
      }));
  } catch (error) {
    return [];
  }
}

// Consult national stock in batches of 10 to protect API rate limit
async function buscarNacional(sku: string) {
  const results: any[] = [];
  const CONCURRENCY_LIMIT = 10;

  for (let i = 0; i < TODOS_LOS_ESTADOS.length; i += CONCURRENCY_LIMIT) {
    const batch = TODOS_LOS_ESTADOS.slice(i, i + CONCURRENCY_LIMIT);
    const batchPromises = batch.map(estado => consultarEstado(sku, estado));
    const batchResults = await Promise.all(batchPromises);
    for (const r of batchResults) {
      results.push(...r);
    }
  }

  return results;
}

// Dynamic states API
app.get("/api/estados", (req, res) => {
  res.json({ estados: TODOS_LOS_ESTADOS });
});

// Search stock API
app.post("/api/buscar", async (req, res) => {
  const { sku, estado, storeKey, cp } = req.body;
  const cleanSku = String(sku || "").trim();
  const cleanEstado = String(estado || "NACIONAL").trim().toUpperCase();
  const activeStore = String(storeKey || "liverpool").toLowerCase().trim();
  const cleanCp = String(cp || "").replace(/\D/g, "").trim();

  if (!cleanSku && activeStore !== "amazon") {
    return res.status(400).json({ error: "Ingresa un SKU válido." });
  }

  try {
    let tiendas: any[] = [];

    if (activeStore === "chedraui") {
      tiendas = await buscarChedraui(cleanSku, cleanEstado, cleanCp || undefined);
    } else if (activeStore === "palacio") {
      tiendas = await buscarPalacio(cleanSku);
    } else if (activeStore === "juguetibici") {
      tiendas = await buscarJuguetibici(cleanSku);
    } else if (activeStore === "amazon") {
      tiendas = await buscarAmazon(cleanSku);
    } else if (activeStore === "sams") {
      if (cleanCp && cleanCp.length === 5) {
        tiendas = await buscarSams(cleanSku, cleanCp);
      } else {
        tiendas = await buscarSamsNacional(cleanSku);
      }
      if (tiendas.length === 0 && isSessionBurned()) {
        console.log("[Sam's] Sesión quemada detectada — renovando cookies y reintentando...");
        resetPxBlockCount();
        await refreshSamsCookiesViaPlaywright().catch((e: any) => console.error("[Sam's] Error renovando cookies:", e?.message));
        tiendas = cleanCp && cleanCp.length === 5
          ? await buscarSams(cleanSku, cleanCp)
          : await buscarSamsNacional(cleanSku);
      }
    } else {
      if (cleanEstado === "NACIONAL") {
        tiendas = await buscarNacional(cleanSku);
      } else {
        tiendas = await consultarEstado(cleanSku, cleanEstado);
      }
    }

    // Sort by pieces descending
    tiendas.sort((a, b) => b.numberOfPieces - a.numberOfPieces);

    return res.json({
      tiendas,
      total: tiendas.length,
      sku: cleanSku,
      estado: (activeStore === "palacio" || activeStore === "juguetibici" || activeStore === "amazon") ? "Nacional" : activeStore === "sams" ? (cleanCp ? `CP ${cleanCp}` : "Todos los clubs") : activeStore === "chedraui" && cleanCp ? `CP ${cleanCp}` : cleanEstado,
      storeKey: activeStore,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error en búsqueda:", error);
    const message = error?.message || `Error al realizar la consulta en ${activeStore}. Intenta de nuevo más tarde.`;
    return res.status(500).json({ error: message });
  }
});

// Sam's Club PX cookie management
app.post("/api/sams/cookies", (req, res) => {
  setSamsCookieCors(req, res);
  const { cookies } = req.body;
  if (!cookies || typeof cookies !== "string" || cookies.trim().length < 10) {
    return res.status(400).json({ error: "Proporciona una cadena de cookies válida." });
  }
  setSamsPxCookies(cookies);
  return res.json({ success: true, message: "Cookies de Sam's Club actualizadas (válidas ~90 min)." });
});

app.get("/api/sams/cookie-status", (_req, res) => {
  return res.json(getSamsPxCookieStatus());
});

function setSamsCookieCors(req: express.Request, res: express.Response) {
  const origin = String(req.headers.origin || "");
  if (/^https:\/\/([a-z0-9-]+\.)?sams\.com\.mx$/i.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

app.options("/api/sams/cookies", (req, res) => {
  setSamsCookieCors(req, res);
  return res.sendStatus(204);
});

// Trigger a Playwright cookie refresh on demand
app.post("/api/sams/auto-refresh", async (_req, res) => {
  try {
    await refreshSamsCookiesViaPlaywright();
    const status = getSamsPxCookieStatus();
    if (!status.valid) {
      return res.status(503).json({
        error: "No se pudo renovar la sesion automaticamente en este servidor. Usa el comando local o pega cookies manualmente.",
        ...status,
      });
    }
    return res.json({ success: true, ...status });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Error al renovar cookies via Playwright." });
  }
});

// Clear Amazon catalog cache to force a fresh scrape
app.post("/api/amazon/clear-cache", (_req, res) => {
  clearAmazonCache();
  return res.json({ success: true, message: "Caché de catálogo Amazon limpiado. El próximo catálogo hará scraping fresco." });
});

// Telegram Proxy API for Premium alerts to hide tokens from client
app.post("/api/telegram/send", async (req, res) => {
  const { token, chatId, message } = req.body;

  if (!token || !chatId || !message) {
    return res.status(450).json({ error: "Faltan parámetros requeridos (token, chatId, message)." });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });

    const data: any = await response.json();

    if (!response.ok || !data.ok) {
      return res.status(400).json({ 
        error: data.description || `Telegram API retornos fallidos: ${response.statusText}` 
      });
    }

    return res.json({ success: true, payload: data.result });
  } catch (err: any) {
    console.error("Telegram error:", err);
    return res.status(500).json({ 
      error: err.message || "Error crítico realizando la petición de retransmisión por Telegram." 
    });
  }
});

// Setup Vite & Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    startSamsCookieAutoRefresh();
  });
}

startServer();
