from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import os

app = Flask(__name__)

TODOS_LOS_ESTADOS = [
    "AGUASCALIENTES", "BAJA CALIFORNIA", "BAJA CALIFORNIA SUR", "CAMPECHE",
    "CDMX/ZONA METROPOLITANA", "CHIAPAS", "CHIHUAHUA", "COAHUILA", "COLIMA",
    "DURANGO", "GUANAJUATO", "GUERRERO", "HIDALGO", "JALISCO", "MICHOACAN",
    "MORELOS", "NAYARIT", "NUEVO LEON", "OAXACA", "PUEBLA", "QUERETARO",
    "QUINTANA ROO", "SAN LUIS POTOSI", "SINALOA", "SONORA", "TABASCO",
    "TAMAULIPAS", "TLAXCALA", "VERACRUZ", "YUCATAN", "ZACATECAS",
]

URL = "https://www.liverpool.com.mx/realtimeinventorycheckservice"

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.liverpool.com.mx/",
    "Origin": "https://www.liverpool.com.mx",
}

PAYLOAD_TEMPLATE = {
    "ïsStoreListforEDD": "false",
    "onlyAvailableStore": "false",
    "productType": "S",
}


def consultar_estado(sku: str, estado: str) -> list:
    payload = {**PAYLOAD_TEMPLATE, "skuId": sku, "state": estado}
    try:
        r = requests.post(URL, headers=HEADERS, json=payload, timeout=15)
        r.raise_for_status()
        data = r.json()
        tiendas = data.get("storeInventoryDetails", [])
        return [
            t for t in tiendas
            if t.get("available") == "true"
            and t.get("numberOfPieces", 0) > 0
            and "suburbia" not in t.get("storeName", "").lower()
        ]
    except Exception:
        return []


def buscar_nacional(sku: str) -> list:
    tiendas = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futuros = {executor.submit(consultar_estado, sku, est): est for est in TODOS_LOS_ESTADOS}
        for futuro in as_completed(futuros):
            tiendas += futuro.result()
    return tiendas


@app.route("/")
def index():
    return render_template("index.html", estados=TODOS_LOS_ESTADOS)


@app.route("/api/buscar", methods=["POST"])
def buscar():
    data = request.get_json()
    sku = (data.get("sku") or "").strip()
    estado = (data.get("estado") or "NACIONAL").strip().upper()

    if not sku:
        return jsonify({"error": "Ingresa un SKU válido"}), 400

    if estado == "NACIONAL":
        tiendas = buscar_nacional(sku)
    else:
        tiendas = consultar_estado(sku, estado)

    tiendas.sort(key=lambda t: t.get("numberOfPieces", 0), reverse=True)

    return jsonify({
        "tiendas": tiendas,
        "total": len(tiendas),
        "sku": sku,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
