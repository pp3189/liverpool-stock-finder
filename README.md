<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/84ff2b13-5536-46fb-a059-ba728cdc51f7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Produccion: Amazon y Sam's con anti-bot

Amazon y Sam's pueden bloquear scraping directo desde Render porque las IPs de datacenter y las sesiones headless activan CAPTCHA, PerimeterX o cookies quemadas. Para uso live estable, configura un proveedor externo por tienda y deja este servidor como agregador de resultados.

Variables recomendadas en Render:

```env
SERPAPI_API_KEY="tu_llave_serpapi"
SERPAPI_AMAZON_DOMAIN="amazon.com.mx"
SERPAPI_NO_CACHE="false"
SERPAPI_FALLBACK_DIRECT="false"

AMAZON_EXTERNAL_URL="https://tu-worker.example.com/amazon"
AMAZON_EXTERNAL_TOKEN="token-opcional"
AMAZON_EXTERNAL_FALLBACK_DIRECT="false"

SAMS_EXTERNAL_URL="https://tu-worker.example.com/sams"
SAMS_EXTERNAL_TOKEN="token-opcional"
SAMS_EXTERNAL_FALLBACK_DIRECT="false"
SAMS_AUTO_REFRESH="false"
```

Contrato del proveedor externo:

```json
{
  "tiendas": [
    {
      "storeId": "SAMS-123",
      "storeName": "Sam's Club Universidad | Disponible para pickup",
      "numberOfPieces": 1,
      "available": "true",
      "stateName": "CDMX",
      "_productUrl": "https://www.amazon.com.mx/dp/B09V7N86Y1",
      "_price": "$999.00",
      "_seller": "Amazon.com.mx"
    }
  ]
}
```

Para Sam's, el backend enviara:

```json
{ "store": "sams", "country": "MX", "sku": "980012555", "cp": "62270", "mode": "postalCode" }
```

Para Amazon, enviara:

```json
{ "store": "amazon", "country": "MX", "query": "B09V7N86Y1", "mode": "asin" }
```

Si `SERPAPI_API_KEY` esta configurada, Amazon usa SerpApi primero:

- `engine=amazon_product` cuando el usuario ingresa un ASIN.
- `engine=amazon` con `amazon_domain=amazon.com.mx` cuando el usuario deja vacio el campo y pide catalogo.
- El scraping directo queda desactivado por defecto cuando SerpApi esta configurado. Para permitir respaldo directo, define `SERPAPI_FALLBACK_DIRECT="true"`.

Puedes usar scraping directo solo como respaldo local. En produccion conviene usar una fuente permitida/estable: API oficial o afiliada cuando aplique, proveedor de datos e-commerce, o un worker de navegador real con sesion persistente y rotacion responsable.

### Renovar cookies de Sam's sin DevTools

Para que el operador/admin actualice la sesion de Sam's sin copiar cURL desde DevTools:

```bash
npm run sams:push-cookies -- https://tu-app.onrender.com
```

El comando abre Chrome, permite navegar Sam's normalmente, extrae cookies tecnicas de Sam's y las envia a `/api/sams/cookies`. Si solo quieres imprimir la cadena para pegarla manualmente:

```bash
npm run sams:push-cookies -- --print-only
```
