"""
Liverpool - Monitor de Inventario en Tiempo Real
=================================================
Endpoint: POST https://www.liverpool.com.mx/realtimeinventorycheckservice

Instalación:
    pip install requests schedule

Uso:
    python liverpool_inventario.py                  # consulta una vez
    python liverpool_inventario.py monitor          # monitoreo continuo

Configuración: edita la sección CONFIGURACIÓN abajo.
"""

import requests
import json
import time
import schedule
import urllib.request
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────────────────────

TODOS_LOS_ESTADOS = [
    "AGUASCALIENTES", "BAJA CALIFORNIA", "BAJA CALIFORNIA SUR", "CAMPECHE",
    "CDMX/ZONA METROPOLITANA", "CHIAPAS", "CHIHUAHUA", "COAHUILA", "COLIMA",
    "DURANGO", "GUANAJUATO", "GUERRERO", "HIDALGO", "JALISCO", "MICHOACAN",
    "MORELOS", "NAYARIT", "NUEVO LEON", "OAXACA", "PUEBLA", "QUERETARO",
    "QUINTANA ROO", "SAN LUIS POTOSI", "SINALOA", "SONORA", "TABASCO",
    "TAMAULIPAS", "TLAXCALA", "VERACRUZ", "YUCATAN", "ZACATECAS",
]

PRODUCTOS = [
    {
        "nombre": "Cartas Pokémon Ascended Heroes",
        "skuId": "1192492633",
        "estado": "NACIONAL",           # usa "NACIONAL" para buscar en todo el país
    },
    # Agrega más productos aquí:
    # {
    #     "nombre": "Otro producto",
    #     "skuId": "XXXXXXXXXX",
    #     "estado": "PUEBLA",           # o "NACIONAL"
    # },
]

INTERVALO_MINUTOS = 30   # cada cuánto revisar en modo monitor

# Telegram (opcional — dejar vacío para no usar)
TELEGRAM_TOKEN   = ""    # ejemplo: "1234567890:ABCdef..."
TELEGRAM_CHAT_ID = ""    # ejemplo: "987654321"

# ─────────────────────────────────────────────────────────────────────────────

URL = "https://www.liverpool.com.mx/realtimeinventorycheckservice"

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.liverpool.com.mx/",
    "Origin": "https://www.liverpool.com.mx",
}

# Ojo: Liverpool usa 'ï' con diéresis en el primer key — es intencional
PAYLOAD_TEMPLATE = {
    "\u00efsStoreListforEDD": "false",
    "onlyAvailableStore": "false",
    "productType": "S",
}


def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def consultar_inventario(sku: str, estado: str) -> list[dict]:
    payload = {**PAYLOAD_TEMPLATE, "skuId": sku, "state": estado}
    try:
        r = requests.post(URL, headers=HEADERS, json=payload, timeout=15)
        r.raise_for_status()
        data = r.json()
        tiendas = data.get("storeInventoryDetails", [])
        # Filtrar solo Liverpool (excluir Suburbia) y con stock
        disponibles = [
            t for t in tiendas
            if t.get("available") == "true"
            and t.get("numberOfPieces", 0) > 0
            and "suburbia" not in t.get("storeName", "").lower()
        ]
        return disponibles
    except Exception as e:
        print(f"  ⚠️  Error al consultar SKU {sku}: {e}")
        return []


def notificar_telegram(mensaje: str):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = json.dumps({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": mensaje,
            "parse_mode": "HTML"
        }).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"  ⚠️  Error Telegram: {e}")


def revisar_todos(estado_anterior: dict = None) -> dict:
    estado_actual = {}
    print(f"\n{'='*55}")
    print(f"  Revisión: {now()}")
    print(f"{'='*55}")

    for prod in PRODUCTOS:
        sku    = prod["skuId"]
        nombre = prod["nombre"]
        estado = prod["estado"]

        es_nacional = estado.upper() == "NACIONAL"
        estados_a_consultar = TODOS_LOS_ESTADOS if es_nacional else [estado]
        scope_label = "todo el país" if es_nacional else estado

        print(f"\n🔍 {nombre} (SKU: {sku}) — {scope_label}")
        if es_nacional:
            print(f"  ⏳ Consultando {len(estados_a_consultar)} estados...")

        tiendas = []
        for est in estados_a_consultar:
            tiendas += consultar_inventario(sku, est)

        estado_actual[sku] = tiendas

        if tiendas:
            print(f"  ✅ Disponible en {len(tiendas)} tienda(s):")
            for t in tiendas:
                print(f"     📍 {t['storeName']}: {t['numberOfPieces']} piezas ({t['inventoryStatus']})")
        else:
            print(f"  ❌ Sin stock en {scope_label}")

        # Detectar cambio de estado (de 0 a disponible)
        if estado_anterior is not None:
            antes = estado_anterior.get(sku, [])
            if not antes and tiendas:
                msg = f"🚨 <b>¡Apareció stock!</b>\n{nombre}\nSKU: {sku}\n\n"
                msg += "\n".join([f"📍 {t['storeName']}: {t['numberOfPieces']} pzs" for t in tiendas])
                print(f"\n  🔔 NUEVO STOCK DETECTADO — enviando alerta")
                notificar_telegram(msg)

    return estado_actual


def modo_monitor():
    print(f"""
╔══════════════════════════════════════════════════════╗
║        Liverpool Monitor de Inventario               ║
║        Intervalo: cada {INTERVALO_MINUTOS} minutos                    ║
╚══════════════════════════════════════════════════════╝
""")
    estado = revisar_todos()

    def job():
        nonlocal estado
        estado = revisar_todos(estado_anterior=estado)
        print(f"\n  ⏳ Próxima revisión en {INTERVALO_MINUTOS} minutos...")

    schedule.every(INTERVALO_MINUTOS).minutes.do(job)
    print(f"\n  ⏳ Próxima revisión en {INTERVALO_MINUTOS} minutos...")

    while True:
        schedule.run_pending()
        time.sleep(30)


def modo_consulta():
    """Consulta una sola vez y muestra resultados."""
    revisar_todos()
    print()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "monitor":
        modo_monitor()
    else:
        modo_consulta()
