import React, { useState, useMemo } from "react";
import { Plus, Trash2, Library, Layers, MapPin, Sparkles, Check } from "lucide-react";
import { SavedSkuItem, BrandConfig } from "../types";

// DynamicStoreCreator sub-component
interface DynamicStoreCreatorProps {
  adminCustomStores: any[];
  setAdminCustomStores: (stores: any[]) => void;
  addTelemetryLog: (message: string, type: "info" | "success" | "warning" | "error") => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function DynamicStoreCreator({
  adminCustomStores,
  setAdminCustomStores,
  addTelemetryLog,
  showToast
}: DynamicStoreCreatorProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [logoText, setLogoText] = useState("");
  const [hq, setHq] = useState("");
  const [url, setUrl] = useState("");

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "");
    if (!name || !cleanKey || !logoText) {
      showToast("Falta rellenar campos obligatorios del canal.", "error");
      return;
    }

    // Check if key already exists on STORES or custom ones
    if (["liverpool", "suburbia", "palacio", "sears", "coppel", "sanborns", "healthenl"].includes(cleanKey) || adminCustomStores.some(s => s.key === cleanKey)) {
      showToast("El identificador clave ya se encuentra ocupado por otra tienda.", "error");
      return;
    }

    const availableColors = [
      { bg: "bg-indigo-600 hover:bg-indigo-700", text: "text-white", border: "border-indigo-700", accent: "#4f46e5" },
      { bg: "bg-amber-600 hover:bg-amber-700", text: "text-white", border: "border-amber-700", accent: "#d97706" },
      { bg: "bg-cyan-600 hover:bg-cyan-700", text: "text-slate-950", border: "border-cyan-700", accent: "#0891b2" },
      { bg: "bg-teal-600 hover:bg-teal-700", text: "text-white", border: "border-teal-700", accent: "#0d9488" },
      { bg: "bg-fuchsia-600 hover:bg-fuchsia-700", text: "text-white", border: "border-fuchsia-700", accent: "#c026d3" }
    ];
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const colorTheme = availableColors[randomIndex];

    const newStore = {
      key: cleanKey,
      name: name.trim(),
      color: colorTheme.bg,
      bgColor: colorTheme.bg,
      borderColor: colorTheme.border,
      textColor: colorTheme.text,
      accentColor: colorTheme.accent,
      placeholderSku: "100" + Math.floor(Math.random() * 900),
      urlTemplateString: url.trim() || `https://www.google.com/search?q=${name}+{sku}`,
      logoText: logoText.trim().substring(0, 5).toUpperCase(),
      isReal: false,
      category: "Simulado",
      pokemonHQ: hq.trim() || "Gimnasio del Administrador"
    };

    const updated = [...adminCustomStores, newStore];
    setAdminCustomStores(updated);
    localStorage.setItem("poke_admin_custom_stores_v2", JSON.stringify(updated));

    addTelemetryLog(`[CANAL-ADD] Creado nuevo canal simulado "${newStore.name}" (${newStore.key}) bajo gimnasio ${newStore.pokemonHQ}.`, "success");
    showToast(`Canal "${newStore.name}" habilitado para consultas.`, "success");

    // Reset form
    setName("");
    setKey("");
    setLogoText("");
    setHq("");
    setUrl("");
  };

  const handleDeleteStore = (storeKey: string, storeName: string) => {
    const updated = adminCustomStores.filter(s => s.key !== storeKey);
    setAdminCustomStores(updated);
    localStorage.setItem("poke_admin_custom_stores_v2", JSON.stringify(updated));
    addTelemetryLog(`[CANAL-DELETE] Canal "${storeName}" removido de la base general de Kanto.`, "warning");
    showToast(`Canal "${storeName}" eliminado exitosamente.`, "info");
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-rose-100/55 pb-2">
          <Layers className="w-4 h-4 text-amber-500" />
          Creación de Canales de Consulta Personalizados
        </h3>

        {/* Store creation form */}
        <form onSubmit={handleAddStore} className="space-y-3.5 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Nombre Comercial *</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                placeholder="Ej. Juguetron"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">ID Clave (Lowercase) *</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-amber-500"
                placeholder="Ej. juguetron"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Acrónimo Logo (Max 3 letras) *</label>
              <input
                type="text"
                required
                maxLength={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-center uppercase focus:ring-1 focus:ring-amber-500"
                placeholder="Ej. JGT"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Gimnasio Pokémon HQ *</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                placeholder="Ej. Gimnasio Celeste"
                value={hq}
                onChange={(e) => setHq(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Estructura URL de PDP (Simulado)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono focus:ring-1 focus:ring-amber-500"
              placeholder="https://www.juguetron.mx/product/{sku}"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-[8px] text-slate-400 mt-0.5 leading-none font-semibold">
              Reemplaza el código ingresado con el comodín <code className="font-bold text-slate-650">{`{sku}`}</code> para renderizado dinámico.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-950 shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            Habilitar Nuevo Canal ⚡
          </button>
        </form>
      </div>

      {/* Custom added stores directory brief */}
      <div className="border-t border-slate-100 pt-3">
        <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Canales Personalizados Activos ({adminCustomStores.length})</h4>
        {adminCustomStores.length === 0 ? (
          <p className="text-[9.5px] text-slate-400 italic text-center py-2">No has configurado ningún canal personalizado para consultas aún.</p>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {adminCustomStores.map((cs) => (
              <div key={cs.key} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`text-[8.5px] px-1 font-black text-white rounded ${cs.bgColor}`}>{cs.logoText}</span>
                  <span className="font-extrabold text-slate-800 truncate">{cs.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteStore(cs.key, cs.name)}
                  className="p-1 hover:bg-white border hover:border-slate-200 rounded-md transition-all text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Eliminar Canal"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// StockOverridesManager sub-component
interface StockOverridesManagerProps {
  combinedStores: any[];
  activeFixedSkus: SavedSkuItem[];
  activeUserCustomSkus: SavedSkuItem[];
  adminFixedSkus: SavedSkuItem[];
  userCustomSkus: SavedSkuItem[];
  adminStockOverrides: Record<string, { quantity: number; available: string }>;
  setAdminStockOverrides: (overrides: Record<string, { quantity: number; available: string }>) => void;
  addTelemetryLog: (message: string, type: "info" | "success" | "warning" | "error") => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function StockOverridesManager({
  combinedStores,
  activeFixedSkus,
  activeUserCustomSkus,
  adminFixedSkus,
  userCustomSkus,
  adminStockOverrides,
  setAdminStockOverrides,
  addTelemetryLog,
  showToast
}: StockOverridesManagerProps) {
  const [selectedSku, setSelectedSku] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedState, setSelectedState] = useState("CDMX");
  const [overrideQuantity, setOverrideQuantity] = useState(12);
  const [stockAvailable, setStockAvailable] = useState("true");

  // Compile all available SKUs to populate select options: combins fixed and custom skus across all shops
  const allAvailableProducts = useMemo(() => {
    const list: SavedSkuItem[] = [];
    const keys = new Set<string>();

    const feedList = (items: SavedSkuItem[]) => {
      items.forEach(item => {
        if (!keys.has(item.sku)) {
          keys.add(item.sku);
          list.push(item);
        }
      });
    };

    feedList(adminFixedSkus);
    feedList(userCustomSkus);
    feedList(activeFixedSkus);
    feedList(activeUserCustomSkus);

    return list;
  }, [adminFixedSkus, userCustomSkus, activeFixedSkus, activeUserCustomSkus]);

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku || !selectedStore) {
      showToast("Por favor selecciona un SKU y canal comercial.", "error");
      return;
    }

    const key = `${selectedStore}-${selectedSku}-${selectedState}`;
    const value = {
      quantity: Number(overrideQuantity),
      available: stockAvailable
    };

    const updated = {
      ...adminStockOverrides,
      [key]: value
    };

    setAdminStockOverrides(updated);
    localStorage.setItem("poke_admin_stock_overrides_v2", JSON.stringify(updated));

    const storeLabel = combinedStores.find(s => s.key === selectedStore)?.name || selectedStore;
    addTelemetryLog(`[OVERRIDE-INJECTED] Inyectado override para SKU ${selectedSku} en ${storeLabel} (${selectedState}): Unidades: ${overrideQuantity}, Disponible: ${stockAvailable}.`, "success");
    showToast(`Injectado stock override para ${storeLabel}`, "success");
  };

  const handleClearOverride = (overrideKey: string) => {
    const updated = { ...adminStockOverrides };
    delete updated[overrideKey];
    setAdminStockOverrides(updated);
    localStorage.setItem("poke_admin_stock_overrides_v2", JSON.stringify(updated));
    addTelemetryLog(`[OVERRIDE-CLEAR] Removido override "${overrideKey}". Retornando a simulación determinística.`, "info");
    showToast("Override de stock removido.", "info");
  };

  const mexicanStates = ["CDMX", "ESTADO DE MEXICO", "JALISCO", "NUEVO LEON", "PUEBLA", "QUERETARO", "NACIONAL"];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-rose-100/55 pb-2">
          <Library className="w-4 h-4 text-amber-500" />
          Generados de Overrides de Stock en Vivo (Inyector)
        </h3>

        {/* Injector Form */}
        <form onSubmit={handleApplyOverride} className="space-y-3.5 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Producto SKU *</label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold leading-tight focus:ring-1 focus:ring-amber-500"
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
              >
                <option value="">-- Escoger SKU --</option>
                {allAvailableProducts.map(p => (
                  <option key={p.sku} value={p.sku}>{p.sku} - {p.label!.substring(0, 22)}...</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Canal Comercial *</label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold leading-tight focus:ring-1 focus:ring-amber-500"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="">-- Escoger Tienda --</option>
                {combinedStores.map(s => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Estado Mexicano *</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold leading-tight"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {mexicanStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Pzs Inyectadas *</label>
              <input
                type="number"
                required
                min="0"
                max="999"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center"
                value={overrideQuantity}
                onChange={(e) => setOverrideQuantity(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-[8.5px] uppercase font-black text-slate-500 mb-1">Estatus *</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold leading-tight"
                value={stockAvailable}
                onChange={(e) => setStockAvailable(e.target.value)}
              >
                <option value="true">🟢 Con Stock</option>
                <option value="false">🔴 Agotado</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-amber-600 shadow-xs"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-slate-950" />
            Inyectar Stock Override 💉
          </button>
        </form>
      </div>

      {/* Overrides directory table */}
      <div className="border-t border-slate-100 pt-3">
        <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Overrides Activos ({Object.keys(adminStockOverrides).length})</h4>
        {Object.keys(adminStockOverrides).length === 0 ? (
          <p className="text-[9.5px] text-slate-400 italic text-center py-2">No hay stock overrides cargados. La simulación opera con sus fórmulas nativas.</p>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {Object.entries(adminStockOverrides).map(([keyString, valObj]) => {
              const segments = keyString.split("-");
              const storeKey = segments[0];
              const sku = segments[1];
              const state = segments.slice(2).join("-");

              const shopName = combinedStores.find(cs => cs.key === storeKey)?.name || storeKey;

              return (
                <div key={keyString} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-[10px] text-slate-900 truncate">
                      📦 SKU: <span className="font-mono bg-white border px-1 rounded text-slate-700">{sku}</span>
                    </p>
                    <p className="text-[9.5px] text-slate-550 truncate mt-0.5">
                      🏠 <span className="font-semibold text-slate-750">{shopName}</span> • 🧭 {state}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded ${valObj.available === "true" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`} title={valObj.available === "true" ? "Disponible" : "Sin Existencias"}>
                      {valObj.quantity} pzs
                    </span>

                    <button
                      onClick={() => handleClearOverride(keyString)}
                      className="p-1 hover:bg-white border rounded-md transition-all text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Override de Stock"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
