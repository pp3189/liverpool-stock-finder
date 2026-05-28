import { useState, useEffect, useMemo, FormEvent } from "react";
import { 
  Search, 
  MapPin, 
  Clock, 
  Copy, 
  ExternalLink, 
  ArrowUpDown, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  Boxes, 
  Store, 
  Activity,
  Bookmark,
  ChevronRight,
  Info,
  Edit,
  Plus,
  PlusCircle,
  Save,
  X,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  RotateCcw,
  Flame,
  Droplets,
  Zap,
  Leaf,
  Shield,
  Award,
  Star,
  User,
  Settings,
  Bell,
  CreditCard,
  Radio,
  Send,
  RefreshCw,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StoreStock, SearchResult, SearchHistoryItem, SavedSkuItem, BrandConfig } from "./types";
import { DynamicStoreCreator, StockOverridesManager } from "./components/AdminWidgets";

const STORES: BrandConfig[] = [
  {
    key: "liverpool",
    name: "Liverpool",
    color: "bg-rose-600 hover:bg-rose-700",
    bgColor: "bg-rose-50/40",
    borderColor: "border-rose-200",
    textColor: "text-rose-700",
    accentColor: "#DF1B25",
    placeholderSku: "1153164748",
    urlTemplate: (sku) => `https://www.liverpool.com.mx/tienda/pdp/${sku}`,
    logoText: "L",
    isReal: true,
    category: "Gimnasio Central",
    pokemonHQ: "Kanto Hub"
  },
  {
    key: "palacio",
    name: "Palacio de Hierro",
    color: "bg-amber-700 hover:bg-amber-800",
    bgColor: "bg-amber-50/40",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    accentColor: "#cda250",
    placeholderSku: "pikachu",
    urlTemplate: (sku) => `https://www.elpalaciodehierro.com/buscar?q=${sku}`,
    logoText: "PH",
    isReal: true,
    category: "Boutique de Lujo",
    pokemonHQ: "Saffron Elite"
  },
  {
    key: "sams",
    name: "Sam's Club",
    color: "bg-blue-800 hover:bg-blue-900",
    bgColor: "bg-blue-50/40",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    accentColor: "#002d62",
    placeholderSku: "980012555",
    urlTemplate: (sku) => `https://www.sams.com.mx/search?Ntt=${sku}`,
    logoText: "SC",
    isReal: true,
    category: "Distribuidora Mayorista",
    pokemonHQ: "Mt. Moon Depot"
  },
  {
    key: "juguetibici",
    name: "Juguetibici",
    color: "bg-green-600 hover:bg-green-700",
    bgColor: "bg-green-50/40",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    accentColor: "#16a34a",
    placeholderSku: "rompecabezas-4d-build-pokemon-pikachu-6075061",
    urlTemplate: (sku) => `https://juguetibici.com/search?q=${sku}&type=product`,
    logoText: "JB",
    isReal: true,
    category: "Juguetería Online",
    pokemonHQ: "Viridian Forest Shop"
  },
  {
    key: "amazon",
    name: "Amazon México",
    color: "bg-orange-500 hover:bg-orange-600",
    bgColor: "bg-orange-50/40",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    accentColor: "#ff9900",
    placeholderSku: "B09V7N86Y1",
    urlTemplate: (sku) => `https://www.amazon.com.mx/dp/${sku}`,
    logoText: "AMZ",
    isReal: true,
    category: "Mercado Global",
    pokemonHQ: "Cinnabar Dock"
  },
  {
    key: "chedraui",
    name: "Chedraui",
    color: "bg-orange-600 hover:bg-orange-700",
    bgColor: "bg-orange-50/40",
    borderColor: "border-orange-250",
    textColor: "text-orange-800",
    accentColor: "#f07c00",
    placeholderSku: "3022567",
    urlTemplate: (sku) => `https://www.chedraui.com.mx/search?text=${sku}`,
    logoText: "CH",
    isReal: true,
    category: "Súper Centro",
    pokemonHQ: "Celadon Bazaar"
  },
  {
    key: "walmart",
    name: "Walmart",
    color: "bg-sky-600 hover:bg-sky-700",
    bgColor: "bg-sky-50/40",
    borderColor: "border-sky-200",
    textColor: "text-sky-700",
    accentColor: "#0071dc",
    placeholderSku: "0007501056",
    urlTemplate: (sku) => `https://www.walmart.com.mx/search?q=${sku}`,
    logoText: "WM",
    isReal: false,
    category: "Proveduría Local",
    pokemonHQ: "Pewter Store"
  },
  {
    key: "toysrus",
    name: "Toys \"R\" Us",
    color: "bg-indigo-600 hover:bg-indigo-700",
    bgColor: "bg-indigo-50/40",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    accentColor: "#0155a5",
    placeholderSku: "824965",
    urlTemplate: (sku) => `https://www.toysrus.com.mx/search?q=${sku}`,
    logoText: "TRU",
    isReal: false,
    category: "Arcade de Juguetes",
    pokemonHQ: "Goldenrod Game"
  },
];

// Curated Initial Fixed Pokémon SKUs by Store Key
const DEFAULT_ADMIN_FIXED_SKUS: SavedSkuItem[] = [
  // Liverpool
  { sku: "1153164748", label: "Colosal Pokémon TCG: Colección de Combate Poder Supremo (Foil)", category: "Cartas TCG", storeKey: "liverpool" },
  { sku: "1134567222", label: "Videojuego Nintendo Switch: Pokémon Scarlet Standard", category: "Videojuegos", storeKey: "liverpool" },
  { sku: "1145678123", label: "Pokémon TCG: Elite Trainer Box Scarlet & Violet Base", category: "Cartas TCG", storeKey: "liverpool" },
  { sku: "1128761234", label: "Peluche de Pikachu Gigante de Felpa Premium (60cm)", category: "Peluches", storeKey: "liverpool" },

  // Palacio de Hierro — accepts keyword search (e.g. "pikachu", "pokemon tcg")
  { sku: "pikachu", label: "Búsqueda: Pikachu en Palacio de Hierro", category: "Búsqueda por Keyword", storeKey: "palacio" },
  { sku: "pokemon tcg", label: "Búsqueda: Pokemon TCG en Palacio de Hierro", category: "Búsqueda por Keyword", storeKey: "palacio" },
  { sku: "pokemon", label: "Búsqueda: Pokemon en Palacio de Hierro", category: "Búsqueda por Keyword", storeKey: "palacio" },

  // Sam's Club
  { sku: "980012555", label: "Multi-Pack Familiar: Figuras de Acción de Batalla Pokémon (8 Pzs)", category: "Figuras", storeKey: "sams" },
  { sku: "980012999", label: "Caja Master League Booster Set TCG (60 Paquetes)", category: "Cartas TCG", storeKey: "sams" },
  { sku: "980011888", label: "Peluche de Pikachu Pareja 2-Pack (Macho & Hembra Cosplay)", category: "Peluches", storeKey: "sams" },

  // Amazon México
  { sku: "B09V7N86Y1", label: "Pokémon TCG: Charizard Ultra-Premium Collection Box (Metal)", category: "Cartas TCG", storeKey: "amazon" },
  { sku: "B0B8QL531F", label: "Peluche Oficial Pokémon Squirtle Suave de 8 Pulgadas", category: "Peluches", storeKey: "amazon" },
  { sku: "B09S8H1L72", label: "Consola Nintendo Switch Lite Edición Dialga & Palkia", category: "Consolas", storeKey: "amazon" },
  { sku: "B0C5Z9K3LM", label: "Caja Booster Box Temporal Forces (36 Sobres TCG)", category: "Cartas TCG", storeKey: "amazon" },

  // Chedraui
  { sku: "3022567", label: "Colección Metálica Poké Ball Clásica con 3 Booster Packs", category: "Cartas TCG", storeKey: "chedraui" },
  { sku: "3022599", label: "Figura de Batalla Oficial 2\": Charmander Flamante", category: "Figuras", storeKey: "chedraui" },
  { sku: "3022112", label: "Álbum Expositor Poké Ball Texturizado para 240 Cartas", category: "Accesorios", storeKey: "chedraui" },

  // Walmart
  { sku: "0007501056", label: "Juego de Estrategia de Mesa Pokémon TCG Battle Academy 2.0", category: "Juegos de Mesa", storeKey: "walmart" },
  { sku: "0007501089", label: "Figura de Combate Articulada Epic Battle: Mewtwo de 12\"", category: "Figuras", storeKey: "walmart" },
  { sku: "0007501101", label: "Peluche Detective Pokémon Pikachu con Gorra de Lupa", category: "Peluches", storeKey: "walmart" },

  // Toys "R" Us
  { sku: "824965", label: "Set Bloques Mega Construx: Centro Pokémon de Kanto Monumental", category: "Juguetes de Construcción", storeKey: "toysrus" },
  { sku: "824911", label: "Cinturón Clip 'N' Go Poké Ball con mini figura Gengar", category: "Accesorios", storeKey: "toysrus" },
  { sku: "824922", label: "Estadio Arena de Combates Pokémon Coliseum Deluxe Set", category: "Juguetes de Acción", storeKey: "toysrus" },

  // Juguetibici — accepts product handle (URL slug) or keyword
  { sku: "rompecabezas-4d-build-pokemon-pikachu-6075061", label: "Rompecabezas 4D Build Pokémon Pikachu", category: "Juguetes", storeKey: "juguetibici" },
  { sku: "pikachu", label: "Búsqueda: Pikachu en Juguetibici", category: "Búsqueda por Keyword", storeKey: "juguetibici" },
  { sku: "pokemon", label: "Búsqueda: Pokemon en Juguetibici", category: "Búsqueda por Keyword", storeKey: "juguetibici" }
];

const POKEMON_LOCATIONS = [
  "Centro Pokémon Ciudad Celeste (Cerulean)",
  "Bazar Central Ciudad Azulona (Celadon)",
  "Gimnasio Volcánico de Isla Canela (Cinnabar)",
  "Centro de Investigaciones Pueblo Paleta (Pallet)",
  "Muelle Marítimo Ciudad Carmín (Vermilion)",
  "Tienda Oficial rascacielos Ciudad Azafrán (Saffron)",
  "Museo de Ciencia Fósil Ciudad Plateada (Pewter)",
  "Santuario Sagrado de Ciudad Iris (Ecruteak)",
  "Torre Legendaria de Pueblo Lavanda (Lavender)",
  "Zona de Recreación Ciudad Trigal (Goldenrod)",
  "Estación Eléctrica Central de Kanto",
  "Estadio Principal Ciudad Luminalia (Lumiose)"
];

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [selectedStoreKey, setSelectedStoreKey] = useState("liverpool");

  // Premium Tier & Simulated Checkout States
  const [activePanelTab, setActivePanelTab] = useState<"individual" | "pro">("individual");
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("poke_premium_active") === "true";
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentCard, setPaymentCard] = useState("");
  const [paymentExpiry, setPaymentExpiry] = useState("");
  const [paymentCvv, setPaymentCvv] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState("");

  // Telegram Configuration
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem("poke_telegram_token") || "");
  const [telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem("poke_telegram_chat_id") || "");

  // Multiconsulta States
  const [proSelectedSkuIds, setProSelectedSkuIds] = useState<string[]>([]);
  const [multiResults, setMultiResults] = useState<Record<string, SearchResult>>({});
  const [isMultiScanning, setIsMultiScanning] = useState(false);

  // Programmed Monitoring Parameters & Bulk Importer & Simulated Telegram
  const [alertStockThreshold, setAlertStockThreshold] = useState<number>(1);
  const [alertSelectedState, setAlertSelectedState] = useState<string>("NACIONAL");
  const [bulkImportInput, setBulkImportInput] = useState<string>("");
  const [mockTelegramChat, setMockTelegramChat] = useState<boolean>(true);
  const [mockTelegramMessages, setMockTelegramMessages] = useState<Array<{
    id: number;
    timestamp: string;
    sender: string;
    text: string;
    isBot: boolean;
  }>>([
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: "Sistema de Alertas",
      text: "⚡ <b>Simulador de Telegram Inicializado</b><br/>Aquí aparecerán las notificaciones instantáneas de rastreo que pkmonster enviará a tu cuenta.",
      isBot: true
    }
  ]);

  // Background Auto-monitoring States
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState(15); // checking interval in seconds
  const [monitoringLog, setMonitoringLog] = useState<Array<{ timestamp: string; label: string; text: string; sku: string; type: "info" | "success" | "warning" | "error" }>>([]);
  const [sku, setSku] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("NACIONAL");
  const [chedrauiCp, setChedrauiCp] = useState("");
  const [estados, setEstados] = useState<string[]>([]);

  // Sam's Club PX cookie management
  const [samsCookieValid, setSamsCookieValid] = useState(false);
  const [samsCookieExpiresInMs, setSamsCookieExpiresInMs] = useState<number | undefined>(undefined);
  const [showSamsCookieModal, setShowSamsCookieModal] = useState(false);
  const [samsCookieInput, setSamsCookieInput] = useState("");
  const [samsCookieSaving, setSamsCookieSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  
  // Custom User Saved SKUs States (at user's will)
  const [userCustomSkus, setUserCustomSkus] = useState<SavedSkuItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomSku, setNewCustomSku] = useState("");
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("Colección Personal");
  
  // Administrator Settings States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminFixedSkus, setAdminFixedSkus] = useState<SavedSkuItem[]>([]);
  
  // Admin Form details to append new/edit fixed skus for the SELECTED store
  const [showAdminAddForm, setShowAdminAddForm] = useState(false);
  const [newAdminSku, setNewAdminSku] = useState("");
  const [newAdminLabel, setNewAdminLabel] = useState("");
  const [newAdminCategory, setNewAdminCategory] = useState("Colección Pokémon");
  
  // Edit items
  const [editingItemKey, setEditingItemKey] = useState<{sku: string; isFixed: boolean} | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingCategory, setEditingCategory] = useState("");

  // Dynamic administrative console states
  const [adminCustomStores, setAdminCustomStores] = useState<BrandConfig[]>(() => {
    try {
      const saved = localStorage.getItem("poke_admin_custom_stores_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const combinedStores = useMemo(() => {
    const processedCustom: BrandConfig[] = adminCustomStores.map(store => ({
      ...store,
      urlTemplate: (skuNum: string) => {
        const rawTemplate = (store as any).urlTemplateString || `https://www.google.com/search?q=${store.name}+${skuNum}`;
        return rawTemplate.replace("{sku}", skuNum);
      }
    }));
    return [...STORES, ...processedCustom];
  }, [adminCustomStores]);

  const [adminLatency, setAdminLatency] = useState<number>(() => {
    const saved = localStorage.getItem("poke_admin_latency");
    return saved ? Number(saved) : 600;
  });

  const [adminSuccessRate, setAdminSuccessRate] = useState<number>(() => {
    const saved = localStorage.getItem("poke_admin_success_rate");
    return saved ? Number(saved) : 100;
  });

  const [adminStoreStates, setAdminStoreStates] = useState<Record<string, "ONLINE" | "LAGGY" | "OFFLINE">>(() => {
    try {
      const saved = localStorage.getItem("poke_admin_store_statuses_v2");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Admin stock overrides state: Key: `${storeValue}-${skuValue}-${estadoValue}` -> value
  const [adminStockOverrides, setAdminStockOverrides] = useState<Record<string, { quantity: number; available: string }>>(() => {
    try {
      const saved = localStorage.getItem("poke_admin_stock_overrides_v2");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Log system inside administration
  const [adminTelemetryLog, setAdminTelemetryLog] = useState<Array<{ id: number; timestamp: string; message: string; type: "info" | "success" | "warning" | "error" }>>(() => [
    {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message: "Consola de Telemetría Administrativa iniciada.",
      type: "info"
    }
  ]);

  const addTelemetryLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setAdminTelemetryLog(prev => [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      },
      ...prev
    ].slice(0, 100));
  };

  // Filtering and sorting state for stock results
  const [textFilter, setTextFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "HIGH" | "LOW">("ALL");
  const [sortBy, setSortBy] = useState<"PIECES_DESC" | "PIECES_ASC" | "NAME_ASC">("PIECES_DESC");

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Computed selected store metadata
  const currentStore = useMemo(() => {
    return combinedStores.find(s => s.key === selectedStoreKey) || combinedStores[0];
  }, [selectedStoreKey, combinedStores]);
  const isAvailabilityOnlyResult = results?.storeKey === "sams" || results?.storeKey === "palacio" || results?.storeKey === "amazon";

  // Load list of states, custom user items, and admin fixed items (with fallback)
  useEffect(() => {
    fetch("/api/estados")
      .then(res => res.json())
      .then(data => {
        if (data.estados) {
          setEstados(data.estados);
        }
      })
      .catch(() => {
        setEstados([
          "AGUASCALIENTES", "BAJA CALIFORNIA", "BAJA CALIFORNIA SUR", "CAMPECHE",
          "CDMX/ZONA METROPOLITANA", "CHIAPAS", "CHIHUAHUA", "COAHUILA", "COLIMA",
          "DURANGO", "GUANAJUATO", "GUERRERO", "HIDALGO", "JALISCO", "MICHOACAN",
          "MORELOS", "NAYARIT", "NUEVO LEON", "OAXACA", "PUEBLA", "QUERETARO",
          "QUINTANA ROO", "SAN LUIS POTOSI", "SINALOA", "SONORA", "TABASCO",
          "TAMAULIPAS", "TLAXCALA", "VERACRUZ", "YUCATAN", "ZACATECAS"
        ]);
      });

    // Load search history
    const savedHistory = localStorage.getItem("poke_stock_history_v1");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    }

    // Load USER Custom SKUs (added by users at will)
    const savedUserSkus = localStorage.getItem("poke_user_custom_skus");
    if (savedUserSkus) {
      try {
        setUserCustomSkus(JSON.parse(savedUserSkus));
      } catch {
        setUserCustomSkus([]);
      }
    } else {
      setUserCustomSkus([]);
    }

    // Load ADMIN Fixed SKUs
    const savedAdminSkus = localStorage.getItem("poke_admin_fixed_skus_v1");
    if (savedAdminSkus) {
      try {
        setAdminFixedSkus(JSON.parse(savedAdminSkus));
      } catch {
        setAdminFixedSkus(DEFAULT_ADMIN_FIXED_SKUS);
      }
    } else {
      setAdminFixedSkus(DEFAULT_ADMIN_FIXED_SKUS);
      localStorage.setItem("poke_admin_fixed_skus_v1", JSON.stringify(DEFAULT_ADMIN_FIXED_SKUS));
    }
  }, []);

  // Premium configurations local storage sync
  useEffect(() => {
    localStorage.setItem("poke_telegram_token", telegramToken);
  }, [telegramToken]);

  useEffect(() => {
    localStorage.setItem("poke_telegram_chat_id", telegramChatId);
  }, [telegramChatId]);

  // Sam's Club cookie status polling (every 2 min)
  useEffect(() => {
    const checkStatus = () => {
      fetch("/api/sams/cookie-status")
        .then(res => res.json())
        .then((data: { valid: boolean; expiresInMs?: number }) => {
          setSamsCookieValid(data.valid);
          setSamsCookieExpiresInMs(data.expiresInMs);
        })
        .catch(() => {});
    };
    checkStatus();
    const id = setInterval(checkStatus, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleSaveSamsCookies = async () => {
    if (!samsCookieInput.trim()) return;
    setSamsCookieSaving(true);
    try {
      const res = await fetch("/api/sams/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookies: samsCookieInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSamsCookieValid(true);
        setSamsCookieExpiresInMs(90 * 60 * 1000);
        setShowSamsCookieModal(false);
        setSamsCookieInput("");
        setToast({ message: data.message || "Cookies actualizadas.", type: "success" });
      } else {
        setToast({ message: data.error || "Error al guardar cookies.", type: "error" });
      }
    } catch {
      setToast({ message: "No se pudo conectar al servidor.", type: "error" });
    } finally {
      setSamsCookieSaving(false);
    }
  };

  // Automated Background Monitor Polling Ticker
  useEffect(() => {
    if (!isMonitoring) return;

    // Run immediately on engagement
    runMonitoringCycle();

    const intervalId = setInterval(() => {
      runMonitoringCycle();
    }, monitoringInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isMonitoring, monitoringInterval, proSelectedSkuIds, telegramToken, telegramChatId, selectedStoreKey]);

  // Append new telemetry alerts to logs
  const appendMonitoringLog = (label: string, text: string, type: "info" | "success" | "warning" | "error", skuCode: string) => {
    setMonitoringLog(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        label,
        text,
        sku: skuCode,
        type
      },
      ...prev
    ].slice(0, 50));
  };

  // Send real-time notification alert via official bot proxy
  const sendTelegramAlert = async (token: string, chat: string, name: string, skuId: string, total: number, branches: any[]) => {
    const storeName = combinedStores.find(s => s.key === selectedStoreKey)?.name || "Comercio";
    const branchSummary = branches.length > 0
      ? branches.slice(0, 3).map(b => `• 📍 <i>${b.storeName} (${b.stateName})</i>: <b>${b.numberOfPieces}</b> pzs`).join("\n")
      : "• ⚠️ Almacenes sin existencias físicas hoy.";

    const message = `🚨 <b>[MONITOR AUTOMÁTICO DE INVENTARIO]</b>\n\n🎯 <b>Producto:</b> ${name}\n📦 <b>SKU:</b> <code>${skuId}</code>\n🏪 <b>Canal:</b> ${storeName}\n📈 <b>Existencias (${alertSelectedState}):</b> <b>${total}</b> piezas\n🏢 <b>Bodegas con Stock:</b> ${branches.length}\n\n📍 <b>Mayores existencias detectadas:</b>\n${branchSummary}\n\n⚡ Verificado por <b>pkmonster PRO</b>.`;

    try {
      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chatId: chat, message })
      });
    } catch (e) {
      console.error("Falla de red mandando alerta a Telegram", e);
    }
  };

  // Test linkage with bot Chat ID
  const sendManualTelegramTest = async () => {
    if (!telegramToken || !telegramChatId) {
      // If we are simulating, let us allow a simulated alert!
      showToast("Falta configurar campos indispensables: Token de Bot y Chat ID del Destinatario (Pero se emite alerta simulada en pantalla).", "info");
    } else {
      showToast("Mandando notificación real de prueba y simulada a Telegram...", "info");
    }

    const message = `⚡ <b>CONEXIÓN ESTABLECIDA • PKMONSTER PRO</b><br/><br/>¡Enhorabuena Entrenador Súper! La vinculación de alertas se ha concretado de forma óptima.<br/><br/>📱 Recibirás informes periódicos automáticos sobre existencias de tus artículos seleccionados directo en tu chat de Telegram.`;

    // Always push to simulated local smart widget
    setMockTelegramMessages(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: "Bot de Alertas",
        text: message,
        isBot: true
      },
      ...prev
    ]);

    if (telegramToken && telegramChatId) {
      try {
        const res = await fetch("/api/telegram/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: telegramToken, chatId: telegramChatId, message: `⚡ CONEXIÓN ESTABLECIDA • PKMONSTER PRO\n\n¡Enhorabuena Entrenador Súper! La vinculación de alertas se ha concretado de forma óptima.` })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("¡Mensaje enviado en Telegram! Valida tu app de mensajería.", "success");
        } else {
          throw new Error(data.error || "Falla de red externa.");
        }
      } catch (err: any) {
        showToast(`Telegram real rechazó la petición: ${err.message}`, "error");
      }
    }
  };

  // Core Monitoring Cycle Logic
  const runMonitoringCycle = async () => {
    if (proSelectedSkuIds.length === 0) {
      appendMonitoringLog("Sistema", "Monitoreo cancelado. Elige al menos un SKU de Pokémon para iniciar.", "warning", "");
      setIsMonitoring(false);
      return;
    }

    appendMonitoringLog("Ciclo Pro", `Escaneando existencias para ${proSelectedSkuIds.length} productos en la red ${currentStore.name} [Filtro Geo: ${alertSelectedState}]...`, "info", "");

    for (const skuId of proSelectedSkuIds) {
      const itemMeta = adminFixedSkus.concat(userCustomSkus).find(item => item.sku === skuId && item.storeKey === selectedStoreKey);
      const labelText = itemMeta?.label || `SKU Pokémon ${skuId}`;

      try {
        let currentStockDetails: SearchResult;

        if (selectedStoreKey === "liverpool" || selectedStoreKey === "chedraui" || selectedStoreKey === "sams" || selectedStoreKey === "palacio" || selectedStoreKey === "juguetibici" || selectedStoreKey === "amazon") {
          const response = await fetch("/api/buscar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku: skuId, estado: alertSelectedState, storeKey: selectedStoreKey, cp: selectedStoreKey === "chedraui" || selectedStoreKey === "sams" ? chedrauiCp.replace(/\D/g, "").trim() : "" })
          });
          if (!response.ok) throw new Error("API Limit excedida");
          currentStockDetails = await response.json();
        } else {
          // Fluctuate simulation slightly
          const simulated = generateSimulatedStock(skuId, selectedStoreKey, alertSelectedState);
          const modFactor = Math.floor(Date.now() / 4000) % 3;
          if (modFactor === 1) {
            simulated.tiendas = simulated.tiendas.map((t, idx) => idx === 0 ? { ...t, numberOfPieces: Math.max(0, t.numberOfPieces - 1) } : t);
          } else if (modFactor === 2) {
            simulated.tiendas = simulated.tiendas.map((t, idx) => idx === 1 ? { ...t, numberOfPieces: t.numberOfPieces + 3 } : t);
          }
          currentStockDetails = simulated;
        }

        // Filter the branches by selected state if not "NACIONAL"
        const filteredBranches = alertSelectedState === "NACIONAL"
          ? currentStockDetails.tiendas
          : currentStockDetails.tiendas.filter(b => b.stateName.toUpperCase() === alertSelectedState.toUpperCase());

        const totalStock = filteredBranches.reduce((acc, t) => acc + t.numberOfPieces, 0);
        const logType = totalStock >= alertStockThreshold ? "success" : totalStock > 0 ? "info" : "warning";
        const messageText = `Escaneo finalizado [Filtro: ${alertSelectedState}]: Encontradas ${totalStock} piezas físicas distribuidas en ${filteredBranches.length} sucursales.`;

        appendMonitoringLog(labelText, messageText, logType, skuId);

        // If total stock meets user threshold limit, send alerts!
        if (totalStock >= alertStockThreshold) {
          const storeName = combinedStores.find(s => s.key === selectedStoreKey)?.name || "Comercio";
          const branchSummaryHTML = filteredBranches.length > 0
            ? filteredBranches.slice(0, 3).map(b => `• 📍 <i>${b.storeName} (${b.stateName})</i>: <b>${b.numberOfPieces}</b> pzs`).join("<br/>")
            : "• ⚠️ Almacenes sin existencias físicas hoy.";

          const htmlMessage = `🚨 <b>[MONITOR AUTOMÁTICO DE INVENTARIO]</b><br/><br/>🎯 <b>Producto:</b> ${labelText}<br/>📦 <b>SKU:</b> <code>${skuId}</code><br/>🏪 <b>Canal:</b> ${storeName}<br/>📈 <b>Existencias (${alertSelectedState}):</b> <b>${totalStock}</b> piezas<br/>🏢 <b>Bodegas en Filtro:</b> ${filteredBranches.length}<br/><br/>📍 <b>Mayores existencias detectadas:</b><br/>${branchSummaryHTML}<br/><br/>⚡ Verificado por <b>pkmonster PRO</b>.`;

          // Post to visual on-screen mockup Telegram chat
          setMockTelegramMessages(prev => [
            {
              id: Date.now() + Math.random(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: storeName + " Bot",
              text: htmlMessage,
              isBot: true
            },
            ...prev
          ]);

          if (telegramToken && telegramChatId) {
            sendTelegramAlert(telegramToken, telegramChatId, labelText, skuId, totalStock, filteredBranches);
          }
        } else if (totalStock > 0) {
          appendMonitoringLog(labelText, `Alerta de Telegram omitida: Stock hallado (${totalStock} pzs) es menor que tu umbral mínimo configurado (${alertStockThreshold} pzs).`, "info", skuId);
        }
      } catch (err: any) {
        appendMonitoringLog(labelText, `Falla transitoria conectando con el servidor de la tienda: ${err.message || "Timeout"}`, "error", skuId);
      }
    }
  };

  // Perform parallel batch multi-scanning
  const handleMultiScan = async () => {
    if (proSelectedSkuIds.length === 0) {
      showToast("Selecciona primero productos marcando sus casillas de verificación.", "error");
      return;
    }

    setIsMultiScanning(true);
    showToast(`Comenzando búsqueda por lote de ${proSelectedSkuIds.length} productos [Geo: ${alertSelectedState}]...`, "info");
    const collectedResults: Record<string, SearchResult> = {};

    for (const skuId of proSelectedSkuIds) {
      try {
        let lookupResult: SearchResult;
        if (selectedStoreKey === "liverpool" || selectedStoreKey === "chedraui" || selectedStoreKey === "sams" || selectedStoreKey === "palacio" || selectedStoreKey === "juguetibici" || selectedStoreKey === "amazon") {
          const response = await fetch("/api/buscar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku: skuId, estado: alertSelectedState, storeKey: selectedStoreKey, cp: selectedStoreKey === "chedraui" || selectedStoreKey === "sams" ? chedrauiCp.replace(/\D/g, "").trim() : "" })
          });
          if (!response.ok) throw new Error("Rate limit");
          lookupResult = await response.json();
        } else {
          lookupResult = generateSimulatedStock(skuId, selectedStoreKey, alertSelectedState);
        }
        collectedResults[skuId] = lookupResult;
      } catch {
        collectedResults[skuId] = generateSimulatedStock(skuId, selectedStoreKey, alertSelectedState);
      }
    }

    setMultiResults(collectedResults);
    setIsMultiScanning(false);
    showToast("¡La multiconsulta de inventario ha concluido!", "success");
  };

  // Comma-separated or whitespace bulk importer
  const handleBulkImport = () => {
    if (!bulkImportInput.trim()) {
      showToast("Ingresa una lista de códigos separados por coma o espacios.", "error");
      return;
    }

    const skusToImport = bulkImportInput
      .split(/[\s,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2);
    
    if (skusToImport.length === 0) {
      showToast("No se encontraron códigos SKU legítimos válidos para procesar.", "error");
      return;
    }

    let importedCount = 0;
    const updatedUserList = [...userCustomSkus];

    skusToImport.forEach(skuToImport => {
      const alreadyUser = userCustomSkus.some(item => item.sku === skuToImport && item.storeKey === selectedStoreKey);
      const alreadyAdmin = adminFixedSkus.some(item => item.sku === skuToImport && item.storeKey === selectedStoreKey);

      if (!alreadyUser && !alreadyAdmin) {
        const newItem: SavedSkuItem = {
          sku: skuToImport,
          label: `SKU Copiado: ${skuToImport}`,
          category: "Lote Multiconsulta",
          storeKey: selectedStoreKey
        };
        updatedUserList.push(newItem);
        importedCount++;
      }
    });

    if (importedCount > 0) {
      setUserCustomSkus(updatedUserList);
      localStorage.setItem("poke_user_custom_skus", JSON.stringify(updatedUserList));
      showToast(`¡Importación exitosa! Se añadieron ${importedCount} SKUs al observatorio del canal actual.`, "success");
      setBulkImportInput("");
    } else {
      showToast("Todos los códigos SKUs ingresados ya se encontraban registrados.", "info");
    }

    // Auto-select those newly added SKUs for multiconsulta too!
    const allAvailable = activeFixedSkus.concat(updatedUserList.filter(item => item.storeKey === selectedStoreKey)).map(item => item.sku);
    setProSelectedSkuIds(allAvailable);
  };

  // Simulated Checkout credit card sequence
  const handleUpgradePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!paymentEmail || !paymentName || !paymentCard || !paymentExpiry || !paymentCvv) {
      showToast("Ingresa todos los datos requeridos para efectuar el pago.", "error");
      return;
    }

    setPaymentLoading(true);
    
    const steps = [
      "Contactando pasarela de pagos Visa/MasterCard de PokéStock...",
      "Estableciendo canal seguro SSL con la Liga Pokémon...",
      "Validando fondos y código CVV...",
      "Autorizando cargo electrónico de $99.00 MXN...",
      "Generando credenciales y Firma Criptográfica PRO..."
    ];

    let currentStep = 0;
    setPaymentStepText(steps[0]);

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setPaymentStepText(steps[currentStep]);
      } else {
        clearInterval(timer);
        setIsPremium(true);
        localStorage.setItem("poke_premium_active", "true");
        setPaymentLoading(false);
        setPaymentStepText("");
        setShowPaymentModal(false);
        showToast("¡MEMBRESÍA PRO ACTIVADA! Bienvenido al Olimpo de Entrenadores.", "success");
      }
    }, 1200);
  };

  // Show auto-dismiss toast
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Quick fill placeholder helper
  const handleUsePlaceholder = () => {
    setSku(currentStore.placeholderSku);
  };

  // Get fixed admin items corresponding ONLY to current selected Store
  const activeFixedSkus = useMemo(() => {
    return adminFixedSkus.filter(item => item.storeKey === selectedStoreKey);
  }, [adminFixedSkus, selectedStoreKey]);

  // Get user custom items corresponding ONLY to current selected Store
  const activeUserCustomSkus = useMemo(() => {
    return userCustomSkus.filter(item => item.storeKey === selectedStoreKey);
  }, [userCustomSkus, selectedStoreKey]);

  // Handle addition of Custom Sku (User at will)
  const handleAddUserCustomSku = (e: FormEvent) => {
    e.preventDefault();
    const cleanSku = newCustomSku.trim();
    const cleanLabel = newCustomLabel.trim();
    const cleanCategory = newCustomCategory.trim() || "Colección Personal";

    if (!cleanSku) {
      showToast("Ingresa un código SKU válido.", "error");
      return;
    }
    if (!cleanLabel) {
      showToast("Ingresa un nombre de referencia (ej. Charmander Tin Box).", "error");
      return;
    }

    // Check duplication in user list
    if (userCustomSkus.some(item => item.sku === cleanSku && item.storeKey === selectedStoreKey)) {
      showToast("Este SKU ya existe en tus favoritos para esta tienda.", "info");
      return;
    }

    const updated = [
      ...userCustomSkus,
      { sku: cleanSku, label: cleanLabel, category: cleanCategory, storeKey: selectedStoreKey }
    ];
    setUserCustomSkus(updated);
    localStorage.setItem("poke_user_custom_skus", JSON.stringify(updated));

    // Reset Form
    setNewCustomSku("");
    setNewCustomLabel("");
    setNewCustomCategory("Colección Personal");
    setShowAddForm(false);
    showToast("¡SKU agregado a tu observatorio personal!", "success");
  };

  // Add Fixed Sku (Admin Dashboard)
  const handleAddAdminFixedSku = (e: FormEvent) => {
    e.preventDefault();
    const cleanSku = newAdminSku.trim();
    const cleanLabel = newAdminLabel.trim();
    const cleanCategory = newAdminCategory.trim() || "Colección Pokémon";

    if (!cleanSku) {
      showToast("Ingresa un código SKU válido.", "error");
      return;
    }
    if (!cleanLabel) {
      showToast("Ingresa un nombre oficial para el producto Pokémon.", "error");
      return;
    }

    // Check duplication in fixed list for this store
    if (adminFixedSkus.some(item => item.sku === cleanSku && item.storeKey === selectedStoreKey)) {
      showToast("Este SKU ya está registrado como código fijo para esta tienda.", "error");
      return;
    }

    const updated = [
      ...adminFixedSkus,
      { sku: cleanSku, label: cleanLabel, category: cleanCategory, storeKey: selectedStoreKey }
    ];
    setAdminFixedSkus(updated);
    localStorage.setItem("poke_admin_fixed_skus_v1", JSON.stringify(updated));

    // Reset Form
    setNewAdminSku("");
    setNewAdminLabel("");
    setNewAdminCategory("Colección Pokémon");
    setShowAdminAddForm(false);
    showToast("¡Código Fijo de Administrador registrado exitosamente!", "success");
  };

  // Delete a User Custom SKU
  const handleDeleteUserSku = (skuToDelete: string) => {
    const updated = userCustomSkus.filter(item => !(item.sku === skuToDelete && item.storeKey === selectedStoreKey));
    setUserCustomSkus(updated);
    localStorage.setItem("poke_user_custom_skus", JSON.stringify(updated));
    showToast("Producto removido de tu observatorio", "info");
    if (editingItemKey?.sku === skuToDelete && !editingItemKey.isFixed) {
      setEditingItemKey(null);
    }
  };

  // Delete an Admin Fixed SKU
  const handleDeleteAdminSku = (skuToDelete: string) => {
    const updated = adminFixedSkus.filter(item => !(item.sku === skuToDelete && item.storeKey === selectedStoreKey));
    setAdminFixedSkus(updated);
    localStorage.setItem("poke_admin_fixed_skus_v1", JSON.stringify(updated));
    showToast("Código Fijo removido del catálogo global", "info");
    if (editingItemKey?.sku === skuToDelete && editingItemKey.isFixed) {
      setEditingItemKey(null);
    }
  };

  // Edit SKU Item Label and Category Inline
  const startEditingItem = (skuNum: string, currentLabel: string, currentCategory: string, isFixed: boolean) => {
    setEditingItemKey({ sku: skuNum, isFixed });
    setEditingLabel(currentLabel);
    setEditingCategory(currentCategory);
  };

  // Save Inline Edit
  const handleSaveItemEdit = (skuNum: string, isFixed: boolean) => {
    const cleanLabel = editingLabel.trim();
    const cleanCategory = editingCategory.trim() || "General";

    if (!cleanLabel) {
      showToast("El alias no puede estar vacío.", "error");
      return;
    }

    if (isFixed) {
      // Modify admin list
      const updated = adminFixedSkus.map(item => {
        if (item.sku === skuNum && item.storeKey === selectedStoreKey) {
          return { ...item, label: cleanLabel, category: cleanCategory };
        }
        return item;
      });
      setAdminFixedSkus(updated);
      localStorage.setItem("poke_admin_fixed_skus_v1", JSON.stringify(updated));
      showToast("Código fijo de tienda actualizado.", "success");
    } else {
      // Modify user list
      const updated = userCustomSkus.map(item => {
        if (item.sku === skuNum && item.storeKey === selectedStoreKey) {
          return { ...item, label: cleanLabel, category: cleanCategory };
        }
        return item;
      });
      setUserCustomSkus(updated);
      localStorage.setItem("poke_user_custom_skus", JSON.stringify(updated));
      showToast("Producto favorito actualizado.", "success");
    }

    setEditingItemKey(null);
  };

  // Reset Admin Fixed SKUs to factory defaults
  const handleResetAdminDefaults = () => {
    if (window.confirm("¿Seguro que deseas restablecer TODOS los códigos fijos Pokémon de fábrica en las 8 tiendas?")) {
      setAdminFixedSkus(DEFAULT_ADMIN_FIXED_SKUS);
      localStorage.setItem("poke_admin_fixed_skus_v1", JSON.stringify(DEFAULT_ADMIN_FIXED_SKUS));
      showToast("Códigos fijos Pokémon restablecidos por defecto.", "success");
    }
  };

  // Save searched result straight to favorites
  const handleQuickSaveCurrentToUser = () => {
    if (!results || !results.sku) return;
    const currentSkuId = results.sku;

    // See if already exists
    if (userCustomSkus.some(item => item.sku === currentSkuId && item.storeKey === selectedStoreKey)) {
      showToast("Este producto ya se encuentra en tu observatorio personal.", "info");
      return;
    }

    // Try finding product name in current lists to name it elegantly, else default
    const matchedFixed = activeFixedSkus.find(x => x.sku === currentSkuId);
    const matchedUser = activeUserCustomSkus.find(x => x.sku === currentSkuId);
    const defaultLabel = matchedFixed?.label || matchedUser?.label || `Pokémon SKU: ${currentSkuId}`;

    const updated = [
      ...userCustomSkus,
      { sku: currentSkuId, label: defaultLabel, category: "Búsqueda Rápida", storeKey: selectedStoreKey }
    ];
    setUserCustomSkus(updated);
    localStorage.setItem("poke_user_custom_skus", JSON.stringify(updated));
    showToast("¡Guardado en tu observatorio! Modifica el alias en el menú de la izquierda.", "success");
  };

  // Generate simulated stock with Pokémon styled locations
  const generateSimulatedStock = (skuVal: string, storeVal: string, estadoVal: string): SearchResult => {
    // Deterministic random generator based on SKU string
    let numericalSeed = 0;
    for (let char of skuVal) {
      numericalSeed += char.charCodeAt(0);
    }

    const storeMeta = combinedStores.find(s => s.key === storeVal) || combinedStores[0];
    const numberOfLocations = 3 + (numericalSeed % 5); // 3 to 7 shops
    const locationsList: StoreStock[] = [];

    // Shuffle Pokémon locations based on seed
    const places = [...POKEMON_LOCATIONS];
    
    for (let i = 0; i < numberOfLocations; i++) {
      const placeIndex = (numericalSeed + i * 13) % places.length;
      const originalPlaceName = places[placeIndex];
      
      // Determine state: if state is NACIONAL, distribute among a few Mexican states
      const randomMexicanStates = ["CDMX", "ESTADO DE MEXICO", "JALISCO", "NUEVO LEON", "PUEBLA", "QUERETARO"];
      const computedState = estadoVal === "NACIONAL" 
        ? randomMexicanStates[(numericalSeed + i) % randomMexicanStates.length] 
        : estadoVal;

      let pieces = 1 + ((numericalSeed * (i + 5)) % 22);
      let available = "true";

      // Apply admin stock overrides if configured
      const stateOverrideKey = `${storeVal}-${skuVal}-${computedState}`;
      const nationalOverrideKey = `${storeVal}-${skuVal}-NACIONAL`;
      const resolvedOverride = adminStockOverrides[stateOverrideKey] || adminStockOverrides[nationalOverrideKey];

      if (resolvedOverride) {
        pieces = resolvedOverride.quantity;
        available = resolvedOverride.available;
      }

      locationsList.push({
        storeId: `POKE-${storeVal.toUpperCase()}-${100 + i}`,
        storeName: `${originalPlaceName} (${storeMeta.pokemonHQ})`,
        numberOfPieces: pieces,
        available: available,
        stateName: computedState
      });
    }

    return {
      tiendas: locationsList,
      total: locationsList.length,
      sku: skuVal,
      estado: estadoVal,
      timestamp: new Date().toISOString(),
      storeKey: storeVal
    };
  };

  // Core Search Process (Live Liverpool request or Simulated otherwise)
  const handleSearch = async (targetSku?: string, targetStore?: string, targetEstado?: string) => {
    const activeSku = (targetSku || sku).trim();
    const activeStore = targetStore || selectedStoreKey;
    const activeEstado = targetEstado || selectedEstado;
    const activeCp = activeStore === "chedraui" || activeStore === "sams" ? chedrauiCp.replace(/\D/g, "").trim() : "";

    if (!activeSku && activeStore !== "amazon") {
      setError("Por favor ingresa un código SKU.");
      showToast("Ingresa un SKU de producto", "error");
      return;
    }

    setLoading(true);
    setError(null);
    
    if (!targetSku) {
      setSku(activeSku);
    }

    const storeMeta = combinedStores.find(s => s.key === activeStore) || combinedStores[0];
    const status = adminStoreStates[activeStore] || "ONLINE";

    // 1. Check if store server status is OFFLINE
    if (status === "OFFLINE") {
      setTimeout(() => {
        const failMsg = `Error de Conexión [503] - El canal ${storeMeta.name} está fuera de servicio por mantenimiento preventivo del administrador.`;
        setError(failMsg);
        setLoading(false);
        addTelemetryLog(`[SIM-GATEWAY] Cancelado escaneo SKU ${activeSku} en ${storeMeta.name}: Servidor en estado OFFLINE configurado en Consola Admin.`, "error");
        showToast(`Canal ${storeMeta.name} inactivo en Consola`, "error");
      }, 300);
      return;
    }

    // 2. Check Success Rate Simulation
    const successRoll = Math.random() * 100;
    if (successRoll > adminSuccessRate) {
      setTimeout(() => {
        const failMsg = `Falla de Sincronización [500 Internal Server Error] - Transmisión truncada. Inestabilidad simulada al ${100 - adminSuccessRate}%.`;
        setError(failMsg);
        setLoading(false);
        addTelemetryLog(`[SIM-FAILURE] Fallo de enlace HTTP para SKU ${activeSku} en ${storeMeta.name} (Inestabilidad al ${100 - adminSuccessRate}% activa).`, "error");
        showToast(`Conexión fallida con ${storeMeta.name}`, "error");
      }, 500);
      return;
    }

    // 3. Compute final processing latency
    const baseLatency = adminLatency;
    const finalLatency = status === "LAGGY" ? baseLatency * 2.5 : baseLatency;

    // Simulate delay
    setTimeout(async () => {
      // Non-real stores: use Pokémon-themed simulation
      if (activeStore !== "liverpool" && activeStore !== "chedraui" && activeStore !== "sams" && activeStore !== "palacio" && activeStore !== "juguetibici" && activeStore !== "amazon") {
        const simulatedData = generateSimulatedStock(activeSku, activeStore, activeEstado);
        setResults(simulatedData);
        setLoading(false);

        // Add to history
        const totalPieces = simulatedData.tiendas.reduce((acc, item) => acc + item.numberOfPieces, 0);
        const newHistoryItem: SearchHistoryItem = {
          sku: activeSku,
          estado: activeEstado,
          timestamp: new Date().toISOString(),
          totalPieces,
          storeCount: simulatedData.tiendas.length,
          storeKey: activeStore
        };

        setHistory(prev => {
          const updated = [
            newHistoryItem,
            ...prev.filter(item => !(item.sku === activeSku && item.storeKey === activeStore))
          ].slice(0, 15);
          localStorage.setItem("poke_stock_history_v1", JSON.stringify(updated));
          return updated;
        });

        // Try getting a clean product nickname
        const labelText = activeFixedSkus.find(f => f.sku === activeSku)?.label || activeUserCustomSkus.find(u => u.sku === activeSku)?.label || "Artículo";
        showToast(`Stock de Pokémon localizado para "${labelText.substring(0, 20)}...".`, "success");
        addTelemetryLog(`[ESCÁNER] Consulta SKU ${activeSku} finalizada con éxito en ${storeMeta.name} (${activeEstado}). Localizado un total de ${totalPieces} pzs. Latencia: ${Math.round(finalLatency)}ms.`, "success");
        return;
      }

      // Live API request (Liverpool or Chedraui)
      try {
        const response = await fetch("/api/buscar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sku: activeSku, estado: activeEstado, storeKey: activeStore, cp: activeCp })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ocurrió un error al realizar la consulta.");
        }

        setResults({
          ...data,
          storeKey: activeStore
        });

        // Track Search History
        const totalPieces = data.tiendas.reduce((acc: number, item: StoreStock) => acc + item.numberOfPieces, 0);
        const newHistoryItem: SearchHistoryItem = {
          sku: activeSku,
          estado: activeEstado,
          timestamp: new Date().toISOString(),
          totalPieces,
          storeCount: data.tiendas.length,
          storeKey: activeStore
        };

        setHistory(prev => {
          const updated = [
            newHistoryItem,
            ...prev.filter(item => !(item.sku === activeSku && item.storeKey === activeStore))
          ].slice(0, 15);
          localStorage.setItem("poke_stock_history_v1", JSON.stringify(updated));
          return updated;
        });

        showToast(`Datos de stock de ${storeMeta.name} recibidos por API nacional.`, "success");
        addTelemetryLog(`[${activeStore.toUpperCase()}-API] Consulta real exitosa para SKU ${activeSku} en ${storeMeta.name}. Encontrado total: ${totalPieces} pzs. Latencia: ${Math.round(finalLatency)}ms.`, "success");
      } catch (err: any) {
        const msg = err.message || `Error al conectar con el servidor nacional de ${storeMeta.name}.`;
        setError(msg);
        // If Sam's blocked the request, prompt for cookie injection
        if (activeStore === "sams" && (msg.includes("412") || msg.includes("PerimeterX") || msg.includes("bloqueó"))) {
          setSamsCookieValid(false);
          setShowSamsCookieModal(true);
        }
        showToast(`Falla de enlace API con ${storeMeta.name}`, "error");
        addTelemetryLog(`[${activeStore.toUpperCase()}-ERROR] Petición fallida para SKU ${activeSku}: ${msg}`, "error");
      } finally {
        setLoading(false);
      }
    }, finalLatency);
  };

  // Navigation and formatting helpers
  const deleteHistoryItem = (e: any, indexToDelete: number) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToDelete);
      localStorage.setItem("poke_stock_history_v1", JSON.stringify(updated));
      return updated;
    });
    showToast("Entrada borrada del historial pokemon", "info");
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem("poke_stock_history_v1");
    showToast("Historial de consultas borrado", "info");
  };

  const copySKU = (skuText: string) => {
    navigator.clipboard.writeText(skuText);
    showToast(`SKU ${skuText} copiado al portapapeles de Entrenador`, "success");
  };

  const copyStoreDetails = (item: StoreStock) => {
    const storeBrand = combinedStores.find(s => s.key === selectedStoreKey)?.name || "Comercio";
    const text = `🛒 PokéStock México Reporte\n🏪 Establecimiento: ${storeBrand}\n📍 Sucursal/Gimnasio: ${item.storeName}\n📍 Estado: ${item.stateName}\n🔥 SKU Disponible: ${results?.sku}\n📈 Unidades: ${item.numberOfPieces} pzs`;
    navigator.clipboard.writeText(text);
    showToast(`Reporte copiado: ${item.storeName}`, "success");
  };

  // Detect product details from current SKU in active lists to render Pokédex
  const detectedProductInfo = useMemo(() => {
    if (!results) return null;
    const currentSkuId = results.sku;
    
    // Look in active catalogs
    const foundInFixed = activeFixedSkus.find(item => item.sku === currentSkuId);
    const foundInUser = activeUserCustomSkus.find(item => item.sku === currentSkuId);
    const product = foundInFixed || foundInUser;

    if (!product) {
      return {
        label: `SKU Genérico: ${currentSkuId}`,
        category: "Artículo Pokémon General",
        type: "Normal",
        badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
        icon: <Shield className="w-4 h-4 text-slate-500" />
      };
    }

    const titleStr = product.label.toLowerCase();
    let type = "Normal";
    let badgeColor = "bg-slate-100 text-slate-800 border-slate-200";
    let icon = <Shield className="w-4 h-4 text-slate-500" />;

    if (titleStr.includes("pikachu") || titleStr.includes("electric") || titleStr.includes("trueno")) {
      type = "Cactus / Eléctrico";
      badgeColor = "bg-yellow-50 text-yellow-800 border-yellow-200";
      icon = <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    } else if (titleStr.includes("charizard") || titleStr.includes("scarlet") || titleStr.includes("fuego") || titleStr.includes("flam") || titleStr.includes("fres") || titleStr.includes("tin")) {
      type = "Fuego";
      badgeColor = "bg-orange-50 text-orange-850 border-orange-200";
      icon = <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />;
    } else if (titleStr.includes("squirtle") || titleStr.includes("violet") || titleStr.includes("agua") || titleStr.includes("azul") || titleStr.includes("marine") || titleStr.includes("wand")) {
      type = "Agua / Colección";
      badgeColor = "bg-blue-50 text-blue-800 border-blue-200";
      icon = <Droplets className="w-4 h-4 text-blue-500 fill-blue-500" />;
    } else if (titleStr.includes("bulbasaur") || titleStr.includes("verde") || titleStr.includes("nature") || titleStr.includes("kanto") || titleStr.includes("floral")) {
      type = "Planta / Tierra";
      badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
      icon = <Leaf className="w-4 h-4 text-emerald-500 fill-emerald-500" />;
    } else if (titleStr.includes("mewtwo") || titleStr.includes("gengar") || titleStr.includes("fantas") || titleStr.includes("legend")) {
      type = "Psíquico / Fantasma";
      badgeColor = "bg-purple-50 text-purple-800 border-purple-200";
      icon = <Sparkles className="w-4 h-4 text-purple-500 fill-purple-300" />;
    }

    return {
      label: product.label,
      category: product.category,
      type,
      badgeColor,
      icon
    };
  }, [results, activeFixedSkus, activeUserCustomSkus]);

  // Handle local lists filtered search inside results page
  const filteredAndSortedTiendas = useMemo(() => {
    if (!results || !results.tiendas) return [];

    let temp = [...results.tiendas];

    if (textFilter.trim()) {
      const filterLower = textFilter.toLowerCase();
      temp = temp.filter(t => 
        t.storeName.toLowerCase().includes(filterLower) ||
        t.stateName.toLowerCase().includes(filterLower)
      );
    }

    if (stockFilter === "HIGH") {
      temp = temp.filter(t => t.numberOfPieces >= 10);
    } else if (stockFilter === "LOW") {
      temp = temp.filter(t => t.numberOfPieces < 10);
    }

    if (sortBy === "PIECES_DESC") {
      temp.sort((a, b) => b.numberOfPieces - a.numberOfPieces);
    } else if (sortBy === "PIECES_ASC") {
      temp.sort((a, b) => a.numberOfPieces - b.numberOfPieces);
    } else if (sortBy === "NAME_ASC") {
      temp.sort((a, b) => a.storeName.localeCompare(b.storeName));
    }

    return temp;
  }, [results, textFilter, stockFilter, sortBy]);

  // Summarize pieces stats
  const summaryMetrics = useMemo(() => {
    if (!results || !results.tiendas) return { totalPieces: 0, highStockCount: 0, averageStock: 0 };
    if (results.storeKey === "sams" || results.storeKey === "palacio" || results.storeKey === "amazon") {
      return { totalPieces: results.tiendas.length, highStockCount: results.tiendas.length, averageStock: "N/D" };
    }
    const totalPieces = results.tiendas.reduce((acc, t) => acc + t.numberOfPieces, 0);
    const highStockCount = results.tiendas.filter(t => t.numberOfPieces >= 10).length;
    const averageStock = results.tiendas.length > 0 ? (totalPieces / results.tiendas.length).toFixed(1) : 0;
    return { totalPieces, highStockCount, averageStock };
  }, [results]);

  if (showLanding) {
    return (
      <div id="landing-screen" className="min-h-screen bg-[#FDFEFE] text-slate-850 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
        {/* Ambient background decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-50/40 blur-3xl pointer-events-none select-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-100/60 blur-3xl pointer-events-none select-none" />
        
        {/* Top bar */}
        <header className="flex items-center justify-between w-full max-w-5xl mx-auto relative z-10 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest uppercase font-black px-2 py-0.5 rounded bg-slate-900 text-white leading-none">
              PKM
            </span>
            <span className="text-xs tracking-widest uppercase font-bold text-slate-500">
              Central Hub
            </span>
          </div>
          <div className="text-xs tracking-widest uppercase font-bold text-slate-400">
            v1.2.0
          </div>
        </header>

        {/* Central visual block (minimalist logo, name, button) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full relative z-10 my-12">
          {/* Logo - Minimalist abstract vector Pokéball */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative mb-8 group"
          >
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full text-slate-900 stroke-current group-hover:rotate-12 transition-transform duration-750"
              fill="none" 
              strokeWidth="1.5"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Outer circle */}
              <circle cx="50" cy="50" r="45" strokeWidth="2.5" />
              {/* Middle horizontal division line */}
              <line x1="5" y1="50" x2="38" y2="50" strokeWidth="2.5" />
              <line x1="62" y1="50" x2="95" y2="50" strokeWidth="2.5" />
              {/* Central double button circle */}
              <circle cx="50" cy="50" r="12" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="5" className="fill-slate-900 stroke-slate-900" />
              {/* Dynamic dash arrays */}
              <path d="M 22 25 A 35 35 0 0 1 78 25" strokeDasharray="4 4" opacity="0.45" />
              <path d="M 22 75 A 35 35 0 0 0 78 75" strokeDasharray="4 4" opacity="0.45" />
            </svg>
            
            {/* Glowing background ring */}
            <div className="absolute -inset-4 rounded-full bg-rose-500/5 blur-xl group-hover:bg-rose-500/10 transition-all duration-750 -z-10" />
          </motion.div>

          {/* Site name & subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-none uppercase">
              pkmonster
            </h1>
            <p className="mt-4 text-xs sm:text-xs text-slate-500 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              Consola General de Distribución y Existencias de Artículos Pokémon
            </p>
          </motion.div>

          {/* Centered minimalist button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <button
              onClick={() => {
                setShowLanding(false);
                showToast("Bienvenido a PokéStock México", "success");
              }}
              className="py-4 px-10 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs tracking-widest uppercase rounded-full shadow-md hover:shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all cursor-pointer inline-flex items-center gap-2 group border border-slate-950"
            >
              <span>Ingresar a PokéStock</span>
              <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </motion.div>
        </main>

        {/* Footer listing store networks */}
        <footer className="w-full max-w-5xl mx-auto text-center relative z-10 border-t border-slate-100 pt-6">
          <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-3.5">
            Canales Conectados en la República Mexicana
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500 max-w-3xl mx-auto">
            <span>LIVERPOOL</span>
            <span className="text-rose-450">•</span>
            <span>PALACIO DE HIERRO</span>
            <span className="text-rose-450">•</span>
            <span>AMAZON MÉXICO</span>
            <span className="text-rose-450">•</span>
            <span>SAM'S CLUB</span>
            <span className="text-rose-450">•</span>
            <span>CHEDRAUI</span>
            <span className="text-rose-450">•</span>
            <span>WALMART</span>
            <span className="text-rose-450">•</span>
            <span>TOYS "R" US</span>
            <span className="text-rose-450">•</span>
            <span>JUGUETIBICI</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-5 font-semibold">
            pkmonster • Monitores de Inventario. Todos los derechos reservados. Marcas registradas propiedad de sus respectivos dueños.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-[#FDFEFE] text-slate-800 font-sans antialiased pb-20 selection:bg-rose-500 selection:text-white">
      
      {/* Toast popup notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === "success" 
                ? "bg-emerald-50 text-emerald-900 border-emerald-100" 
                : toast.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-100"
                : "bg-amber-50 text-amber-900 border-amber-100"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {toast.type === "info" && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Navigation / Header Brand Bar with Pokémon layout styling */}
        <nav id="navbar-brand" className="flex flex-col sm:flex-row items-center justify-between py-5 mb-6 border-b border-rose-100 gap-4">
          <div 
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-3.5 cursor-pointer hover:opacity-85 transition-opacity"
            title="Volver a Inicio (pkmonster)"
          >
            {/* Elegant Premium Pokéball SVG Emblem */}
            <div className="w-12 h-12 flex-shrink-0 bg-rose-600 rounded-full flex flex-col justify-between items-center p-0.5 border-3 border-slate-900 relative shadow-md overflow-hidden animate-pulse">
              {/* Upper half (Rose) */}
              <div className="bg-rose-550 w-full h-1/2 rounded-t-full" />
              {/* Middle Line */}
              <div className="absolute top-[21px] left-0 right-0 h-1 bg-slate-900 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center z-10">
                  <div className="w-1 h-1 rounded-full bg-slate-900" />
                </div>
              </div>
              {/* Lower half (White) */}
              <div className="bg-white w-full h-1/2 rounded-b-full" />
            </div>

            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-rose-600 block bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-max leading-none mb-1">
                Pokédex Stock Tracker
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 leading-none flex items-center gap-1.5 tracking-tight">
                POKÉSTOCK MÉXICO
              </h1>
            </div>
          </div>

          {/* MODE SELECTOR (Ordinary User vs administrator Dashboard) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[10px] font-extrabold text-slate-500 pl-2.5">Console Mode:</span>
            
            <div className="inline-flex rounded-xl bg-slate-200/60 p-0.5 border border-slate-200">
              <button
                onClick={() => {
                  setIsAdminMode(false);
                  setActivePanelTab("individual");
                  showToast("Modo de Consulta (Entrenador) Activado", "success");
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  !isAdminMode 
                    ? "bg-white text-rose-600 shadow-sm font-extrabold" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="w-3 h-3" />
                Entrenador Súper
              </button>
              
              <button
                onClick={() => {
                  setIsAdminMode(true);
                  setActivePanelTab("admin");
                  showToast("Consola de Administrador Activada. Carga y edita códigos fijos.", "info");
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  isAdminMode 
                    ? "bg-slate-900 text-yellow-400 shadow-sm font-extrabold" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Settings className="w-3 h-3" />
                Administrador ⚙️
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section Page Banner with Pokémon layout details */}
        <header id="welcome-banner" className="relative bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-lg overflow-hidden border-b-6 border-rose-650">
          <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-rose-600/10 rounded-full flex items-center justify-center border border-rose-600/5 select-none pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 animate-spin" />
                  Sincronización Pokémon Activa
                </span>
                <span className="text-xs text-slate-350 font-semibold">• Monitores en República Mexicana</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                Consola General de Distribución y Existencias de Artículos Pokémon
              </h2>
              <p className="mt-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Sincroniza el inventario en tiendas mexicanas para localizar cartas de colección TCG, peluches oficiales, llaveros, réplicas metálicas de Poké Balls y lanzamientos de videojuegos de Nintendo Switch.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 to-rose-550 flex items-center justify-center text-slate-900 font-extrabold shadow-sm border border-white/20">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">Base de Datos</p>
                <p className="text-xs font-black text-white">Pokémon HG/SS Red</p>
                <p className="text-[9px] text-slate-400">Totalmente Protegido Encryption</p>
              </div>
            </div>
          </div>
        </header>

        {/* 1. SELECCIÓN DE TIENDA / GIMNASIOS DE COMPRA */}
        <section id="store-selector-panel" className="mb-6">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-rose-600" />
              1. Selecciona la Tienda / Centro de Canje:
            </h3>
            <span className="text-[10px] bg-rose-50 border border-rose-100 px-3 py-1 rounded-full font-black text-rose-600">
              {combinedStores.length} Canales de Kanto e Hisui habilitados
            </span>
          </div>

          {/* Grid Layout of Stores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {combinedStores.map((store) => {
              const isSelected = selectedStoreKey === store.key;
              return (
                <button
                  key={store.key}
                  onClick={() => {
                    setSelectedStoreKey(store.key);
                    setResults(null); 
                    setError(null);
                  }}
                  className={`relative p-4 rounded-2xl text-left transition-all overflow-hidden border cursor-pointer select-none group focus:outline-none ${
                    isSelected
                      ? `bg-slate-900 border-slate-950 ring-4 ring-rose-500/10 shadow-md scale-101 z-10 text-white`
                      : "bg-white hover:bg-slate-50/80 border-slate-200"
                  }`}
                >
                  {/* Decorative type tag in store button background */}
                  {isSelected && (
                    <div className="absolute right-[-15px] bottom-[-15px] text-white/5 font-black text-4xl pointer-events-none select-none italic">
                      {store.pokemonHQ}
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[75px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        isSelected 
                          ? "bg-rose-600 text-white shadow" 
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {store.logoText}
                      </span>
                      
                      {store.isReal ? (
                        <span className="text-[8px] uppercase tracking-widest bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                          Live API
                        </span>
                      ) : (
                        <span className="text-[8px] uppercase tracking-widest bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-full border border-slate-200">
                          Sinc Poké
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-[9px] text-rose-500 font-black mb-0.5 uppercase tracking-wider">{store.pokemonHQ}</p>
                      <h4 className={`text-xs sm:text-sm font-extrabold ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {store.name}
                      </h4>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Workspace Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CONTROL CENTER (LEFT COLUMN) - Span 4 */}
          <section id="form-column" className="lg:col-span-4 flex flex-col gap-6">
            
            {/* ESCÁNER PRINCIPAL SKU */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 relative">
              <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 tracking-tight">
                <Search className="w-5 h-5 text-rose-600" />
                Escáner Directo de SKU
              </h3>

              <p className="text-xs text-slate-500 mb-4 font-medium leading-normal">
                Ingresa el identificador SKU de {currentStore.name} ({currentStore.pokemonHQ}) para rastrear existencias físicas inmediatas en toda la red nacional.
              </p>

              <div className="space-y-4">
                {/* SKU Code Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="pdp-sku" className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
                      {selectedStoreKey === "amazon" ? "ASIN de producto (opcional)" : `Código de Producto (${currentStore.name})`}
                    </label>
                    {selectedStoreKey !== "amazon" && (
                      <button
                        onClick={handleUsePlaceholder}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                      >
                        Copiar SKU Prueba
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="pdp-sku"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-950 font-mono text-sm tracking-wider font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                      placeholder={selectedStoreKey === "amazon" ? "Vacío = catálogo oficial Pokémon · O ingresa ASIN (ej. B09V7N86Y1)" : `Ej. ${currentStore.placeholderSku}`}
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          handleSearch();
                        }
                      }}
                    />
                    {sku && (
                      <button 
                        onClick={() => copySKU(sku)}
                        title="Copiar SKU"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* State dropdown selector — hidden for Amazon (online catalog, no geo) */}
                {selectedStoreKey !== "amazon" && (
                  <div>
                    <label htmlFor="geo-state" className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                      Ubicación Geográfica de Consulta
                    </label>
                    <select
                      id="geo-state"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                      value={selectedEstado}
                      onChange={(e) => setSelectedEstado(e.target.value)}
                    >
                      <option value="NACIONAL">🇲🇽 Toda la República Mexicana</option>
                      {estados.map((est) => (
                        <option key={est} value={est}>
                          📍 {est}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(selectedStoreKey === "chedraui" || selectedStoreKey === "sams") && (
                  <div>
                    <label htmlFor="chedraui-cp" className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                      Código Postal {selectedStoreKey === "sams" ? "Sam's Club (opcional)" : "Chedraui (opcional)"}
                    </label>
                    <input
                      id="chedraui-cp"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-950 font-mono text-sm tracking-wider font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                      placeholder={selectedStoreKey === "sams" ? "Opcional — vacío busca en todos los clubs" : "Ej. 91070; vacío = escaneo por estado/nacional"}
                      value={chedrauiCp}
                      onChange={(e) => setChedrauiCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                          handleSearch();
                        }
                      }}
                    />
                    <p className="mt-1.5 text-[9px] text-slate-400 font-semibold leading-relaxed">
                      {selectedStoreKey === "sams"
                        ? "Sin CP → revisa todos los clubs registrados. Con CP → solo clubs cercanos a esa zona postal."
                        : "Si lo llenas, Chedraui valida compra real para ese CP. Si lo dejas vacío, escanea CPs representativos de la ubicación elegida."}
                    </p>
                    {selectedStoreKey === "sams" && (
                      <div className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-[9px] font-bold ${samsCookieValid ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
                        <span>
                          {samsCookieValid
                            ? `Sesion web activa — expira en ${Math.ceil((samsCookieExpiresInMs || 0) / 60000)} min`
                            : "Sin sesion web — Sam's puede bloquear la consulta"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSamsCookieModal(true)}
                          className={`ml-2 px-2 py-0.5 rounded-lg text-[8px] uppercase font-black tracking-wider cursor-pointer transition-colors ${samsCookieValid ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800" : "bg-amber-200 hover:bg-amber-300 text-amber-900"}`}
                        >
                          {samsCookieValid ? "Renovar" : "Inyectar cookies"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit query trigger */}
                <button
                  id="checkout-stock"
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-white transition-all transform flex items-center justify-center gap-2 select-none cursor-pointer ${
                    loading 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : `bg-rose-600 hover:bg-rose-700 active:scale-[0.98] shadow-sm`
                  }`}
                  style={{ backgroundColor: !loading ? currentStore.accentColor : undefined }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {selectedStoreKey === "amazon" ? "Cargando catálogo Amazon..." : "Escaneando Bodegas Pokémon..."}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      {selectedStoreKey === "amazon" ? "Ver catálogo oficial Pokémon" : "Localizar Inventario 🔍"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CÓDIGOS FIJOS PRE-ESTABLECIDOS (Varian según la tienda elegida, administrables por panel) */}
            <div className="bg-[#FAFBFB] rounded-3xl p-6 shadow-xs border border-rose-100/40">
              <div className="flex items-center justify-between mb-3 border-b border-rose-100/50 pb-2.5">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1">
                    <Star className="w-4 h-4 text-rose-500 fill-yellow-400" />
                    Códigos Oficiales (Fijos)
                  </h3>
                  <span className="text-[9px] text-slate-400 font-bold italic">Pokémon en {currentStore.name}</span>
                </div>
                
                <span className="text-[10px] bg-rose-50 border border-rose-100 font-extrabold text-rose-600 px-2 py-0.5 rounded-lg">
                  {activeFixedSkus.length} Items fijos
                </span>
              </div>

              {activeFixedSkus.length === 0 ? (
                <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <p className="text-xs font-semibold">No hay códigos fijos fijados por el Administrador.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Habilita "Administrador" para cargar códigos fijos de esta tienda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                  {activeFixedSkus.map((item, idx) => {
                    const isEditing = editingItemKey?.sku === item.sku && editingItemKey.isFixed;
                    return (
                      <div 
                        key={item.sku + "-fixed-" + idx}
                        className="p-3 bg-white border border-slate-200/60 hover:border-rose-400 rounded-2xl transition-all"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-rose-600 uppercase">Modificar Código Fijo</p>
                            <input
                              type="text"
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              placeholder="Nombre del Producto"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                            <input
                              type="text"
                              value={editingCategory}
                              onChange={(e) => setEditingCategory(e.target.value)}
                              placeholder="Categoría"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                            />
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button 
                                onClick={() => setEditingItemKey(null)}
                                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => handleSaveItemEdit(item.sku, true)}
                                className="px-3 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                              >
                                Aplicar Cambios
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1.5">
                            <div 
                              onClick={() => {
                                setSku(item.sku);
                                handleSearch(item.sku, selectedStoreKey, "NACIONAL");
                              }}
                              className="flex-1 cursor-pointer select-none group"
                            >
                              <p className="font-extrabold text-slate-900 text-xs hover:text-rose-600 group-hover:text-rose-600 transition-colors line-clamp-2">
                                {item.label}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="font-mono text-[9px] font-semibold text-slate-400 bg-slate-100 rounded px-1">{item.sku}</span>
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50/60 px-1.5 py-0.2 rounded border border-rose-100">
                                  {item.category}
                                </span>
                              </div>
                            </div>

                            {/* Options if Admin toggle is enabled */}
                            {isAdminMode && (
                              <div className="flex items-center shrink-0">
                                <button
                                  onClick={() => startEditingItem(item.sku, item.label, item.category, true)}
                                  title="Editar Código Fijo"
                                  className="p-1 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-50"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdminSku(item.sku)}
                                  title="Eliminar Código Fijo"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OBSERVATORIO DEL USUARIO (Su propia voluntad para agregar códigos) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
              <div className="flex items-center justify-between mb-3 border-b border-rose-100/50 pb-2.5">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-rose-600" />
                    Observatorio Personal
                  </h3>
                  <span className="text-[9px] text-slate-450 font-semibold block">Agrega códigos a tu gusto</span>
                </div>
                
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 border border-rose-100 transition-all cursor-pointer"
                >
                  {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showAddForm ? "Cerrar" : "Añadir"}
                </button>
              </div>

              {/* Add Custom User SKU Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddUserCustomSku}
                    className="mb-4 p-4 bg-slate-50 border border-rose-100/20 rounded-2xl overflow-hidden space-y-3"
                  >
                    <p className="text-[10px] text-rose-700 font-black leading-none uppercase">Agregar a: {currentStore.name}</p>
                    
                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-0.5">Código SKU del Producto</label>
                      <input
                        type="text"
                        placeholder={`Ej: ${currentStore.placeholderSku}`}
                        value={newCustomSku}
                        onChange={(e) => setNewCustomSku(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-0.5">Nombre / Apodo del Producto</label>
                      <input
                        type="text"
                        placeholder="Ej: Lata de Cartas Pokémon Eevee"
                        value={newCustomLabel}
                        onChange={(e) => setNewCustomLabel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-0.5">Categoría / Tipo</label>
                      <input
                        type="text"
                        placeholder="Ej: Sobres TCG, Peluches"
                        value={newCustomCategory}
                        onChange={(e) => setNewCustomCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-rose-600 text-white rounded-xl text-[10px] tracking-wider uppercase font-black hover:bg-rose-750 cursor-pointer w-full transition-colors"
                    >
                      Guardar en Favoritos 🎯
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {activeUserCustomSkus.length === 0 ? (
                <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-xs font-semibold">Tu observatorio de favoritos está vacío.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Haz clic en "Añadir" para registrar tus propios SKUs de Pokémon.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {activeUserCustomSkus.map((item, idx) => {
                    const isEditing = editingItemKey?.sku === item.sku && !editingItemKey.isFixed;
                    return (
                      <div 
                        key={item.sku + "-custom-" + idx}
                        className="p-3 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-2xl transition-all"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Modificar Favorito de Entrenador</p>
                            <input
                              type="text"
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                            <input
                              type="text"
                              value={editingCategory}
                              onChange={(e) => setEditingCategory(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                            />
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button 
                                onClick={() => setEditingItemKey(null)}
                                className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-250 rounded"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => handleSaveItemEdit(item.sku, false)}
                                className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 rounded"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1.5">
                            <div 
                              onClick={() => {
                                setSku(item.sku);
                                handleSearch(item.sku, selectedStoreKey, "NACIONAL");
                              }}
                              className="flex-1 cursor-pointer select-none"
                            >
                              <p className="font-extrabold text-slate-800 text-xs hover:text-rose-600 transition-colors line-clamp-2">
                                {item.label}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="font-mono text-[9px] text-slate-400 bg-white rounded px-1 border border-slate-200">{item.sku}</span>
                                <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border">
                                  {item.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center shrink-0">
                              <button
                                onClick={() => startEditingItem(item.sku, item.label, item.category, false)}
                                title="Editar Alias"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUserSku(item.sku)}
                                title="Eliminar de favoritos"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PANEL DE MONITOREO DE ADMINISTRADOR (Visible únicamente si isAdminMode está encendido) */}
            {isAdminMode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border-t-4 border-yellow-400"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-xs font-extrabold uppercase text-yellow-400 tracking-wider">
                    Consola de Administrador (Catálogos)
                  </h3>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal mb-4">
                  Carga nuevos códigos fijos oficiales que estarán fijados permanentemente para todos los entrenadores consultando la tienda de **{currentStore.name}**.
                </p>

                <div className="space-y-3.5">
                  <button
                    onClick={() => setShowAdminAddForm(!showAdminAddForm)}
                    className="w-full text-xs bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {showAdminAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showAdminAddForm ? "Cerrar Panel Registro" : "Cargar Nuevo Código Fijo"}
                  </button>

                  <AnimatePresence>
                    {showAdminAddForm && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAddAdminFixedSku}
                        className="p-4 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden space-y-3"
                      >
                        <div>
                          <label className="block text-[9px] uppercase font-black text-slate-350 mb-0.5">Tienda Receptor</label>
                          <input
                            type="text"
                            disabled
                            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                            value={`${currentStore.name} (${currentStore.pokemonHQ})`}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-black text-slate-350 mb-0.5">Código SKU Principal</label>
                          <input
                            type="text"
                            placeholder="Ej: 1153164748"
                            className="w-full bg-slate-750 text-white border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-yellow-400"
                            value={newAdminSku}
                            onChange={(e) => setNewAdminSku(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-black text-slate-350 mb-0.5">Nombre Oficial (Catálogo)</label>
                          <input
                            type="text"
                            placeholder="Ej: Pokémon TCG: Elite Trainer Box (Scarlet)"
                            className="w-full bg-slate-750 text-white border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            value={newAdminLabel}
                            onChange={(e) => setNewAdminLabel(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-black text-slate-350 mb-0.5">Categoría General</label>
                          <input
                            type="text"
                            placeholder="Ej: Cartas TCG, Figuras de Acción"
                            className="w-full bg-slate-750 text-white border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                            value={newAdminCategory}
                            onChange={(e) => setNewAdminCategory(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Fijar Código de Tienda 📌
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleResetAdminDefaults}
                    className="w-full text-xs bg-slate-800 hover:bg-slate-750 text-rose-450 border border-rose-900/30 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-450" />
                    Restablecer de Fábrica ⚙️
                  </button>
                </div>
              </motion.div>
            )}

            {/* REGISTRO HISTÓRICO DE BÚSQUEDAS */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
              <div className="flex items-center justify-between mb-3 border-b border-rose-100/50 pb-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
                  Rastreador Histórico
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={clearAllHistory}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-700 cursor-pointer italic"
                  >
                    Limpiar Bitácora
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Sin búsquedas de inventario previas.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {history.map((h, index) => {
                    const shopMeta = combinedStores.find(s => s.key === h.storeKey) || combinedStores[0];
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedStoreKey(h.storeKey);
                          setSku(h.sku);
                          setSelectedEstado(h.estado);
                          handleSearch(h.sku, h.storeKey, h.estado);
                        }}
                        className="group flex items-center justify-between gap-1 text-xs hover:bg-slate-50 p-2.5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 bg-slate-50/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono font-bold text-slate-750 truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {h.sku}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-450 mt-0.5 flex-wrap">
                            <span className="font-bold text-slate-700">{shopMeta.name}</span>
                            <span>•</span>
                            <span className="font-semibold text-rose-600">{h.storeCount} sucursales</span>
                            <span>•</span>
                            <span className="text-slate-400 text-[8px]">{h.estado}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteHistoryItem(e, index)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded bg-transparent hover:bg-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>

          {/* ACTIVE DISPATCHED stock Results - Span 8 */}
          <section id="results-display" className="lg:col-span-8">
            
            {/* Elegant premium tab bar */}
            <div className="flex bg-slate-100/90 border border-slate-200 p-1.5 rounded-3xl mb-6 shadow-sm">
              <button
                onClick={() => setActivePanelTab("individual")}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activePanelTab === "individual"
                    ? "bg-white text-slate-900 shadow-sm font-black border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Search className="w-4 h-4 text-rose-600" />
                Consulta Individual
              </button>
              
              <button
                onClick={() => setActivePanelTab("pro")}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                  activePanelTab === "pro"
                    ? "bg-slate-900 text-yellow-400 shadow-lg font-black border border-slate-950"
                    : "text-slate-500 hover:text-slate-850 hover:bg-white/40"
                }`}
              >
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse shrink-0" />
                <span>Multiconsulta y Alertas PRO</span>
                <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-sm leading-none animate-bounce">
                  PRO
                </span>
              </button>
            </div>

            {activePanelTab === "individual" && (
              <>
                {/* Loading Display with Poké anims */}
                {loading && (
                  <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-100 text-center flex flex-col items-center justify-center min-h-[460px]">
                    {/* Custom Elegant Pokéball Loading Spinner */}
                    <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-rose-600 flex flex-col justify-between items-center p-0.5 relative shadow-md overflow-hidden animate-spin">
                      <div className="bg-rose-550 w-full h-1/2 rounded-t-full" />
                      <div className="absolute top-[26px] left-0 right-0 h-[6px] bg-slate-900 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
                        </div>
                      </div>
                      <div className="bg-white w-full h-1/2 rounded-b-full" />
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-6 mb-1">
                      Enlazando con el Gimnasio Financiero de {currentStore.name}...
                    </h3>
                    <p className="text-slate-500 text-xs max-w-sm leading-normal">
                      Consultando bases de datos de existencias en sucursales físicas para el estado de: <span className="font-bold text-rose-600">{selectedEstado === "NACIONAL" ? "Todo México" : selectedEstado}</span>.
                    </p>
                    <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 mt-6 overflow-hidden border border-slate-200">
                      <div className="bg-rose-600 h-1.5 rounded-full animate-infinite-loading w-2/3" style={{ backgroundColor: currentStore.accentColor }} />
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && !loading && (
                  <div className="bg-white rounded-3xl p-10 shadow-xs border border-rose-150 text-center flex flex-col items-center justify-center min-h-[360px]">
                    <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 border border-rose-100">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-rose-950 mb-1">
                      {selectedStoreKey === "sams" ? "Error de Consulta por CP" : "Error de Enlace Nacional"}
                    </h3>
                    <p className="text-slate-500 text-xs max-w-md mb-6 leading-relaxed">
                      {error}
                      {selectedStoreKey === "sams"
                        ? " Sam's puede bloquear consultas automáticas aunque el SKU y CP sean correctos."
                        : ` Esto ocurre comúnmente si el código SKU ingresado no pertenece a la base de datos de ${currentStore.name} o si hubo un bloqueo en la pasarela.`}
                    </p>
                    <button
                      onClick={() => handleSearch()}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs cursor-pointer transition-colors shadow"
                    >
                      Intentar Escáner de Nuevo 🔄
                    </button>
                  </div>
                )}

                {/* Initial Welcome Placeholder representing Kanto Pokedex */}
                {!results && !loading && !error && (
                  <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-100 text-center py-20 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
                    <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-slate-50 rounded-full border border-slate-100/40 select-none pointer-events-none" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-rose-50/60 text-rose-500 flex items-center justify-center mb-6 border border-rose-100 shadow-inner relative group">
                      <Store className="w-8 h-8 group-hover:scale-105 transition-transform" />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-900">
                        !
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-2">Monitor Nacional PokéStock Listo</h3>
                    <p className="text-slate-500 text-xs max-w-lg leading-relaxed font-medium">
                      Selecciona cualquiera de las 8 tiendas integradas arriba, luego introduce su SKU de producto de Pokémon o utiliza nuestros accesos rápidos predeterminados a la izquierda para desplegar la red de existencias.
                    </p>

                    {/* Helpful Instruction Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-xl text-left">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 font-extrabold shrink-0 flex items-center justify-center">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 mb-0.5">Catálogo Curado Pokémon</p>
                          <p className="text-slate-500 text-[11px] leading-normal font-medium">
                            Cada tienda dispone de códigos de prueba oficiales cargados para facilitarte las pruebas instantáneas.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 font-extrabold shrink-0 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 mb-0.5">Consulta Directa API</p>
                          <p className="text-slate-500 text-[11px] leading-normal font-medium">
                            El stock de **Liverpool** realiza peticiones SSL a bases de datos nacionales en vivo para mayor rango de veracidad.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pokédex styling notice */}
                    <div className="mt-8 p-4 bg-yellow-50/60 border border-yellow-250/50 rounded-2xl text-left max-w-xl">
                      <div className="flex items-start gap-3 text-xs text-yellow-900 font-medium leading-relaxed">
                        <Sparkles className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-slate-950 block mb-0.5">📌 ¿Sabías que puedes cargar códigos?</span>
                          Usa el botón **"Administrador"** de la esquina superior para personalizar los accesos directos oficiales (fijos) de cada tienda, o añade productos libres a tu **"Observatorio Personal"** con un clic.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* REAL MONITORING RESULT INTERFACES */}
                {results && !loading && !error && (
                  <div className="flex flex-col gap-6">
                    
                    {/* Product Meta Header Panel (Pokédex Style Card) */}
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 relative overflow-hidden">
                      {/* Themed colorful Type Striped Background Indicator */}
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-rose-600/10 pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {/* Logo indicator */}
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-black text-sm shrink-0" style={{ backgroundColor: currentStore.bgColor, color: currentStore.accentColor, borderColor: currentStore.borderColor }}>
                            {currentStore.logoText}
                          </div>

                          <div>
                            {/* Store and Type Tags */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Canal Escaneado:</span>
                              <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg border border-slate-950 uppercase">
                                {currentStore.name} ({currentStore.pokemonHQ})
                              </span>
                              
                              {detectedProductInfo && (
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black border uppercase flex items-center gap-1 ${detectedProductInfo.badgeColor}`}>
                                  {detectedProductInfo.icon}
                                  Tipo: {detectedProductInfo.type}
                                </span>
                              )}
                            </div>

                            {/* Title of the article or fallback */}
                            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 leading-tight">
                              {detectedProductInfo ? detectedProductInfo.label : `Producto SKU: ${results.sku}`}
                            </h2>
                            
                            <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                              Código de Consulta: <span className="font-mono text-slate-900 bg-slate-100 px-1 py-0.2 rounded font-bold">{results.sku}</span>
                              <button
                                onClick={() => copySKU(results.sku)}
                                title="Copiar SKU"
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </p>
                          </div>
                        </div>

                        {/* Meta Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Watchlist add shortcut */}
                          {userCustomSkus.some(item => item.sku === results.sku && item.storeKey === selectedStoreKey) ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-100 rounded-xl px-3.5 py-2 inline-flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              En Tu Listado
                            </span>
                          ) : (
                            <button
                              onClick={handleQuickSaveCurrentToUser}
                              className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 font-black border border-amber-200 rounded-xl px-3.5 py-2 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              ⭐ Favorito Entrenador
                            </button>
                          )}

                          <a
                            href={currentStore.urlTemplate(results.sku)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-650 font-black rounded-xl px-3.5 py-2 inline-flex items-center gap-1.5 cursor-pointer border border-rose-100 transition-all"
                          >
                            Navegar al Sitio Real
                            <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                          </a>
                        </div>
                      </div>

                      {/* Simulator description if non Real stores */}
                      {selectedStoreKey !== "liverpool" && selectedStoreKey !== "chedraui" && selectedStoreKey !== "sams" && (
                        <div className="mt-4 p-3 bg-amber-50/40 rounded-xl border border-amber-250/40 text-[10px] text-amber-900 font-semibold leading-relaxed">
                          ⚠️ **Simulador Inteligente Pokédex**: {currentStore.name} no dispone de acceso de consulta por API directo. El sistema proyecta la distribución del producto en territorio nacional basado en los promedios locales de {results.estado}.
                        </div>
                      )}

                      <hr className="my-4 border-slate-100" />

                      {/* Three Segment Pieces Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{results?.storeKey === "amazon" ? "Artículos en Catálogo" : isAvailabilityOnlyResult ? "Clubs Disponibles" : "Unidades Totales"}</p>
                          <p className="text-xl font-black text-rose-600">{summaryMetrics.totalPieces}{isAvailabilityOnlyResult ? "" : " pzs"}</p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{results?.storeKey === "amazon" ? "Vendidos por Amazon/Pokémon" : "Bodegas con Existencias"}</p>
                          <p className="text-xl font-black text-slate-950">{filteredAndSortedTiendas.length}</p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{isAvailabilityOnlyResult ? "Cantidad Exacta" : "Promedio por Tienda"}</p>
                          <p className="text-xl font-black text-slate-700">{isAvailabilityOnlyResult ? "N/D" : `${summaryMetrics.averageStock} pzs`}</p>
                        </div>
                      </div>
                    </div>

                    {/* Filters Tools */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder={results?.storeKey === "amazon" ? "Filtrar por nombre de producto..." : "Filtrar por nombre de Bodega o Estado..."}
                          value={textFilter}
                          onChange={(e) => setTextFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="inline-flex rounded-xl bg-slate-150 p-0.5 border">
                          <button
                            onClick={() => setStockFilter("ALL")}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${stockFilter === "ALL" ? "bg-white shadow-2xs text-rose-600 font-extrabold" : "text-slate-500"}`}
                          >
                            Todos
                          </button>
                          <button
                            onClick={() => setStockFilter("HIGH")}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${stockFilter === "HIGH" ? "bg-white shadow-2xs text-rose-600 font-extrabold" : "text-slate-500"}`}
                          >
                            Abundante (10+)
                          </button>
                          <button
                            onClick={() => setStockFilter("LOW")}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${stockFilter === "LOW" ? "bg-white shadow-2xs text-rose-600 font-extrabold" : "text-slate-500"}`}
                          >
                            Limitante
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-750"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                          >
                            <option value="PIECES_DESC">Existencias desc.</option>
                            <option value="PIECES_ASC">Existencias asc.</option>
                            <option value="NAME_ASC">Nombre Bodega A-Z</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Branch Listing Cards */}
                    {filteredAndSortedTiendas.length === 0 ? (
                      <div className="bg-white rounded-3xl p-8 border border-slate-150 text-center py-12">
                        <p className="text-slate-500 text-xs font-extrabold">Sin bodegas encontradas bajo el filtro de búsqueda.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Ajusta tu búsqueda de nombre o restringe los límites de piezas para desplegarlas.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredAndSortedTiendas.map((item, index) => (
                          <motion.div
                            key={`${item.storeId}-${index}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-rose-300 hover:shadow-2xs transition-all flex flex-col justify-between relative group overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-200 group-hover:bg-rose-600 transition-colors" style={{ backgroundColor: currentStore.accentColor }} />
                            
                            {results?.storeKey === "amazon" ? (
                              /* Amazon product card */
                              <>
                                <div className="mb-3 flex-1">
                                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-orange-600 transition-colors line-clamp-3">
                                    {item.storeName}
                                  </h4>
                                  {item._price && (
                                    <p className="text-base font-black text-orange-500 mt-2">{item._price}</p>
                                  )}
                                  <p className="text-[9px] uppercase font-black text-slate-400 mt-1">
                                    Vendido por {item._seller || "Amazon.com.mx"}
                                  </p>
                                </div>
                                <div className="border-t border-slate-50/80 pt-3 flex items-center justify-between mt-3">
                                  <span className="inline-flex px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    DISPONIBLE
                                  </span>
                                  <a
                                    href={item._productUrl || currentStore.urlTemplate(item.storeId.replace("AMAZON-", ""))}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors flex items-center gap-1 text-[10px] font-black rounded-lg border border-orange-100"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver en Amazon
                                  </a>
                                </div>
                              </>
                            ) : (
                              /* Standard store card */
                              <>
                                <div className="mb-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-rose-650 transition-colors truncate">
                                        {item.storeName}
                                      </h4>
                                      <p className="text-[9px] uppercase font-black text-rose-600 flex items-center gap-1 mt-1.5">
                                        <MapPin className="w-3 h-3 text-rose-500" />
                                        {item.stateName}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`inline-flex px-2.5 py-1 rounded-xl text-xs font-black shadow-inner border ${
                                        isAvailabilityOnlyResult || item.numberOfPieces >= 10
                                          ? "bg-emerald-50 text-emerald-850 border-emerald-100"
                                          : "bg-amber-50 text-amber-850 border-amber-150"
                                      }`}>
                                        {isAvailabilityOnlyResult ? "DISPONIBLE" : `${item.numberOfPieces} pzs`}
                                      </span>
                                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-wider">
                                        {isAvailabilityOnlyResult ? "CANTIDAD NO PUBLICADA" : item.numberOfPieces >= 10 ? "STOCK SEGURO" : "PIEZAS CRÍTICAS"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="border-t border-slate-50/80 pt-3.5 flex items-center justify-between mt-3">
                                  <button
                                    onClick={() => copyStoreDetails(item)}
                                    className="p-1 px-2.5 hover:bg-slate-50 text-[10px] font-black hover:text-rose-600 text-slate-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-450" />
                                    Copiar Reporte
                                  </button>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${currentStore.name} ${item.storeName} ${item.stateName}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1 text-[10px] font-black rounded-lg"
                                  >
                                    🗺️ Ver Mapa
                                  </a>
                                </div>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activePanelTab === "pro" && (
              /* =======================================================================
                 PRO SERVICES AND AUTOPILOT CONSOLE WITH TELEGRAM
                 ======================================================================= */
              <div id="premium-tab-console" className="space-y-6">
                {!isPremium ? (
                  // PRO SALES DECK (If NOT Premium)
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-900 overflow-hidden relative shadow-xl"
                  >
                    {/* Glowing Accent background lines */}
                    <div className="absolute right-[-20%] top-[-10%] w-72 h-72 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute left-[-20%] bottom-[-10%] w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

                    <div className="relative z-10 text-center max-w-xl mx-auto py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-yellow-400 text-slate-950 mb-4 tracking-widest shadow-md">
                        <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                        MEMBRESÍA ACTIVA PRO
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-none">
                        Desbloquea Multiconsulta y Monitoreo Automático
                      </h2>
                      <p className="mt-3.5 text-slate-350 text-xs sm:text-xs leading-relaxed max-w-lg mx-auto">
                        Eleva tu capacidad de caza TCG y lanzamientos. Vincula alertas Push inmediatas vía Telegram y escanea múltiples códigos simultáneamente sin intervención manual alguna.
                      </p>

                      {/* Professional Pricing Card Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left max-w-lg mx-auto">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <RefreshCw className="w-6 h-6 text-yellow-400 mb-2 shadow" />
                          <h4 className="text-xs font-black text-white uppercase">Sincronización en Lote</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                            Ejecuta consultas concurrentes para multiples artículos a la vez. Olvídate de buscar uno por uno.
                          </p>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <Bell className="w-6 h-6 text-yellow-400 mb-2 shadow" />
                          <h4 className="text-xs font-black text-white uppercase">Alarmas Directo a Telegram</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                            Monitoreo cada 15 segundos en segundo plano. Te avisamos por celular al instante si hay stock disponible.
                          </p>
                        </div>
                      </div>

                      {/* Pricing Tier */}
                      <div className="mt-8 border-t border-slate-800 pt-6">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="text-3xl font-black text-white">$99.00</span>
                          <span className="text-xs text-slate-450 uppercase font-black tracking-wider">MXN / MES</span>
                        </div>

                        <button
                          onClick={() => {
                            setPaymentEmail(localStorage.getItem("payment_email_cache") || "");
                            setPaymentName(localStorage.getItem("payment_name_cache") || "");
                            setShowPaymentModal(true);
                          }}
                          className="py-4 px-8 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs tracking-widest uppercase rounded-full shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer inline-flex items-center gap-2 border border-yellow-500"
                        >
                          <CreditCard className="w-4 h-4 fill-slate-950 text-slate-950" />
                          <span>Adquirir Cuenta PRO 💎</span>
                        </button>
                        <p className="text-[9px] text-slate-450 mt-3 font-semibold">
                          Cancelación inmediata en 1 clic. Pasarela de cobros segura de simulación de cuenta.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // ACTIVE ADVANCED PRO INSTRUMENT PANEL (If PREMIUM acquired)
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    
                    {/* Header welcome bar */}
                    <div className="lg:col-span-12 bg-linear-to-r from-slate-900 to-rose-950 border border-slate-950 p-5 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden shadow-md">
                      <div className="absolute right-0 top-0 bottom-0 w-32 bg-yellow-500/5 blur-2xl pointer-events-none" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] uppercase font-black bg-yellow-400 text-slate-950 px-2 py-0.5 rounded leading-none font-bold">
                            NIVEL PRO
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-350 tracking-widest">
                            Consola Central Premium
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5 leading-none font-black text-white hover:scale-[1.01] transition-transform">
                          <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          Dashboard del Maestro de Alertas Pokémon
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-300">
                          Estado: <span className="text-yellow-400 font-extrabold uppercase">Premium Activo 💎</span>
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm("¿Seguro que deseas degradar tu cuenta a la versión gratuita para pruebas?")) {
                              setIsPremium(false);
                              setIsMonitoring(false);
                              localStorage.removeItem("poke_premium_active");
                              showToast("Cuenta PRO degradada a estándar.", "info");
                            }
                          }}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[9px] border border-white/10 text-white rounded-lg font-black transition-colors cursor-pointer"
                        >
                          Apagar PRO
                        </button>
                      </div>
                    </div>

                    {/* Left Column - Telegram configurations and mobile simulator screen */}
                    <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-rose-50">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                            <Send className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-950 uppercase">Canal de Telegram ✈️</h4>
                            <p className="text-[9px] text-slate-405 font-semibold">Configuración e informe visual en vivo</p>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-slate-500 leading-normal mb-4 font-medium">
                          Ingresa las credenciales de tu Bot y Chat de Telegram para recibir alertas directamente en tu celular en tiempo real cada vez que arranque un ciclo de monitoreo.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Bot Token Oficial</label>
                            <input
                              type="text"
                              value={telegramToken}
                              onChange={(e) => setTelegramToken(e.target.value)}
                              placeholder="Ej: 1234567890:AAH-b16J2-4b2O..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-rose-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">ID de Chat (Chat ID)</label>
                            <input
                              type="text"
                              value={telegramChatId}
                              onChange={(e) => setTelegramChatId(e.target.value)}
                              placeholder="Ej: 9876543210"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-rose-500 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="mt-3.5 flex gap-2">
                          <button
                            onClick={sendManualTelegramTest}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                            Probar Canal de Alertas ⚡
                          </button>
                        </div>

                        {/* Help helper */}
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-[9.5px] text-slate-500 space-y-1">
                          <p className="font-bold text-slate-900 border-b border-slate-200 pb-0.5">💡 ¿Cómo consigo estos datos?</p>
                          <p>1. Crea un bot en Telegram buscando al usuario <span className="font-bold text-rose-600">@BotFather</span> y envía <code className="bg-slate-150 p-0.5 font-bold">/newbot</code> para recibir tu **Bot Token**.</p>
                          <p>2. Busca en Telegram al bot <span className="font-bold text-rose-600">@userinfobot</span>, envíale hola y te responderá con tu **ID numérico** personal.</p>
                          <p>3. ¡Inicia conversación con tu bot creado (presionando Start / Iniciar) antes de realizar una prueba!</p>
                        </div>
                      </div>

                      {/* PHYSICAL VIRTUAL TELEGRAM SMARTPHONE SIMULATOR WIDGET */}
                      <div className="border border-slate-205 rounded-2xl p-3.5 bg-slate-100 shadow-inner">
                        <div className="flex justify-between items-center text-[7.5px] font-black text-slate-400 uppercase tracking-widest px-1 pb-1.5 border-b border-slate-200 mb-2">
                          <span>PKMONSTER TELEGRAM CONNECT</span>
                          <span className="text-emerald-500 flex items-center gap-1">● BOT ACTIVO</span>
                        </div>

                        <div className="bg-sky-950/5 rounded-xl p-2.5 border border-slate-200 text-xs min-h-48 max-h-56 overflow-y-auto space-y-2.5 flex flex-col-reverse relative">
                          {mockTelegramMessages.length === 0 ? (
                            <p className="text-center text-slate-400 text-[10px] my-auto italic">El simulador está desocupado.</p>
                          ) : (
                            mockTelegramMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`rounded-xl p-2.5 max-w-[85%] text-[10px] leading-relaxed block ${
                                  msg.isBot 
                                    ? "bg-white text-slate-800 border border-slate-150 mr-auto" 
                                    : "bg-sky-500 text-white ml-auto"
                                }`}
                              >
                                <div className="flex justify-between text-[7px] font-black tracking-wider text-slate-400 uppercase mb-1 border-b border-slate-100/65 pb-0.5">
                                  <span>{msg.sender}</span>
                                  <span>{msg.timestamp}</span>
                                </div>
                                <div 
                                  className="font-semibold select-text chat-msg-body"
                                  dangerouslySetInnerHTML={{ __html: msg.text }}
                                />
                              </div>
                            ))
                          )}
                          <div className="sticky top-0 bg-sky-50 text-sky-800 border border-sky-150 py-1.5 px-3 rounded-lg text-center text-[9px] font-black tracking-wide uppercase shadow-sm">
                            📱 Chat Activo en Pantalla: Simulador de Mensajería
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Programmed Auto-monitoring Rules & Custom parameters & Bulk import copy paste area */}
                    <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-rose-50">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Radio className="w-4 h-4 animate-pulse text-amber-650" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-950 uppercase">Auto-Monitoreo Programado ⏱️</h4>
                            <p className="text-[9px] text-slate-405 font-semibold">Parámetros avanzados y rastreo en vivo</p>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-slate-500 leading-normal mb-4 font-medium">
                          Activa el rastreador automático en lote para buscar de forma persistente. El sistema checará el estado de los artículos que selecciones abajo y reportará en tu bitácora e informe de Telegram.
                        </p>

                        <div className="space-y-4">
                          {/* Parameter 1 - Geo filter region */}
                          <div>
                            <label className="block text-[9px] uppercase font-black text-slate-400 mb-1.5">
                              Ubicación de Filtro para Alertas
                            </label>
                            <select
                              value={alertSelectedState}
                              onChange={(e) => {
                                setAlertSelectedState(e.target.value);
                                showToast(`Filtro geográfico automático asignado a: ${e.target.value}`, "info");
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:bg-white"
                            >
                              <option value="NACIONAL">🇲🇽 Toda la República Mexicana (Nacional)</option>
                              {estados.map((est) => (
                                <option key={"alert-est-" + est} value={est}>
                                  📍 Solo {est}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Parameter 2 - Alarm Minimum Threshold */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] uppercase font-black text-slate-400">
                                Disparar Alarma si el Stock es Mayor o Igual a:
                              </label>
                              <span className="text-[10.5px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg shrink-0">
                                {alertStockThreshold} {alertStockThreshold === 1 ? "pieza" : "piezas"}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={30}
                              step={1}
                              value={alertStockThreshold}
                              onChange={(e) => {
                                setAlertStockThreshold(Number(e.target.value));
                              }}
                              className="w-full accent-rose-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                            />
                            <p className="text-[8.5px] text-slate-400 font-semibold mt-1">
                              Evita Spam: No recibirás avisos si el stock hallado es menor a este mínimo.
                            </p>
                          </div>

                          {/* Parameter 3 - Timer Interval selection */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Intervalo de Escaneo</label>
                              <select
                                value={monitoringInterval}
                                onChange={(e) => {
                                  setMonitoringInterval(Number(e.target.value));
                                  if (isMonitoring) {
                                    showToast("Intervalo actualizado en vivo.", "info");
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-755 focus:outline-none cursor-pointer focus:bg-white"
                              >
                                <option value="15">⏱️ Cada 15s (Simulación)</option>
                                <option value="30">⏱️ Cada 30s (Automático)</option>
                                <option value="60">⏱️ Cada 60s (Sincronizado)</option>
                                <option value="300">⏱️ Cada 5 min (Producción)</option>
                              </select>
                            </div>

                            <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-250 flex flex-col justify-center text-center">
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase leading-none">Canal de Enlace:</span>
                              <span className="text-xs font-black text-slate-900 uppercase mt-1">
                                {currentStore.name} 🦖
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        {isMonitoring ? (
                          <button
                            onClick={() => {
                              setIsMonitoring(false);
                              showToast("Monitoreo en segundo plano apagado.", "info");
                            }}
                            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md border-b-4 border-rose-800 transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                          >
                            <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping shrink-0" />
                            DETENER MONITOREO AUTOMÁTICO 🛑
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (proSelectedSkuIds.length === 0) {
                                showToast("Selecciona al menos un artículo en la lista de abajo para escanear.", "error");
                                return;
                              }
                              setIsMonitoring(true);
                              showToast("Servicio de Monitoreo automático en vivo INICIADO.", "success");
                            }}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md border-b-4 border-emerald-800 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Radio className="w-4 h-4 text-white hover:rotate-12 transition-transform" />
                            ACTIVAR MONITOREO DE LOTES (AUTOPILOT)
                          </button>
                        )}
                      </div>

                      {/* BULK SKU CODES COPY PASTE IMPORTER COMPONENT */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                          <PlusCircle className="w-4 h-4 text-slate-600" />
                          <h5 className="text-[9.5px] font-black uppercase text-slate-800 tracking-wider">Carga Rápida en Lote (Copy-Paste)</h5>
                        </div>

                        <p className="text-[9px] text-slate-450 font-semibold leading-relaxed">
                          Pega múltiples códigos SKU separados por comas, saltos de línea o espacios para darlos de alta en masa dentro del canal actual:
                        </p>

                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={bulkImportInput}
                            onChange={(e) => setBulkImportInput(e.target.value)}
                            placeholder="Ej: 1114251, 10982512, 11210492"
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-rose-500 focus:outline-none placeholder-slate-400"
                          />

                          <button
                            onClick={handleBulkImport}
                            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] uppercase font-black tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            ➕ Cargar Lote SKU al Observatorio
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grid Section 3 - Target selection for multivariable batches */}
                    <div className="md:col-span-12 bg-white rounded-3xl p-6 border border-slate-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-rose-50 mb-4">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase">
                            Selección de Artículos Habilitados para Multiconsulta ({proSelectedSkuIds.length} seleccionados)
                          </h4>
                          <span className="text-[9.5px] text-slate-400 font-semibold block">Elige los códigos a incluir en el escaneo en lote simultáneo</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const allAvailable = activeFixedSkus.concat(activeUserCustomSkus).map(item => item.sku);
                              setProSelectedSkuIds(allAvailable);
                              showToast("Todos los códigos seleccionados.", "success");
                            }}
                            className="text-[9px] bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Seleccionar Todos
                          </button>
                          <button
                            onClick={() => {
                              setProSelectedSkuIds([]);
                              setIsMonitoring(false);
                              showToast("Selección de códigos limpiada.", "info");
                            }}
                            className="text-[9px] border border-rose-100 hover:bg-rose-50 text-rose-600 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Deseleccionar Todos
                          </button>
                        </div>
                      </div>

                      {/* SKUs selection visual catalog lists */}
                      {activeFixedSkus.concat(activeUserCustomSkus).length === 0 ? (
                        <div className="text-center py-10 text-slate-405 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                          <Boxes className="w-8 h-8 mx-auto text-slate-350 mb-2" />
                          <p className="text-xs font-semibold text-slate-950">No dispones de códigos registrados para esta tienda.</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Agrega códigos usando tu Observatorio Personal o códigos fijos de administrador en el panel izquierdo.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {activeFixedSkus.concat(activeUserCustomSkus).map((item, idx) => {
                            const isChecked = proSelectedSkuIds.includes(item.sku);
                            return (
                              <div
                                key={item.sku + "-pro-select-" + idx}
                                onClick={() => {
                                  if (isChecked) {
                                    setProSelectedSkuIds(prev => prev.filter(id => id !== item.sku));
                                  } else {
                                    setProSelectedSkuIds(prev => [...prev, item.sku]);
                                  }
                                }}
                                className={`p-3 border rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 relative select-none ${
                                  isChecked
                                    ? "bg-slate-900 border-slate-950 text-white font-extrabold shadow-sm"
                                    : "bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-900 hover:bg-slate-50"
                                }`}
                              >
                                <div className="pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="accent-rose-550 w-3.5 h-3.5 cursor-pointer rounded shrink-0 pointer-events-none"
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs line-clamp-1 leading-tight font-extrabold`}>{item.label}</p>
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className={`text-[8.5px] font-mono px-1 rounded font-bold ${isChecked ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                      {item.sku}
                                    </span>
                                    <span className={`text-[8.5px] px-1 py-0.2 rounded font-black border leading-none font-semibold ${
                                      isChecked 
                                        ? "bg-rose-550 text-white border-rose-950" 
                                        : "bg-rose-50 text-rose-700 border-rose-100"
                                    }`}>
                                      {item.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Multi-scan query execution controls */}
                      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                          <p className="text-[11px] font-black text-slate-950 uppercase leading-none">Lanzar Multiconsulta Simultánea</p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">Búsqueda síncrona multivariable de todos los productos elegidos.</p>
                        </div>

                        <button
                          onClick={handleMultiScan}
                          disabled={isMultiScanning || proSelectedSkuIds.length === 0}
                          className={`py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all transform flex items-center justify-center gap-2 select-none cursor-pointer ${
                            isMultiScanning || proSelectedSkuIds.length === 0
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-slate-950 hover:bg-slate-850 shadow active:translate-y-0.5"
                          }`}
                        >
                          {isMultiScanning ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                              Escaneando Multi-SKUs...
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 text-rose-550" />
                              LOCALIZAR LOTES SELECCIONADOS ⚡
                            </>
                          )}
                        </button>
                      </div>

                      {/* Display of multiconsulta results */}
                      {Object.keys(multiResults).length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
                          <h5 className="text-[10.5px] uppercase font-black tracking-wider text-slate-400 mb-2">Resultados Obtenidos por Lote:</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {proSelectedSkuIds.map(skuId => {
                              const itemResult = multiResults[skuId];
                              const itemMeta = adminFixedSkus.concat(userCustomSkus).find(item => item.sku === skuId && item.storeKey === selectedStoreKey);
                              const labelText = itemMeta?.label || `SKU Pokémon ${skuId}`;

                              if (!itemResult) return null;

                              const totalCount = itemResult.tiendas.reduce((acc, t) => acc + t.numberOfPieces, 0);

                              return (
                                <div
                                  key={"multi-res-item-" + skuId}
                                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                                >
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="min-w-0">
                                      <p className="font-extrabold text-xs text-slate-950 truncate" title={labelText}>{labelText}</p>
                                      <p className="text-[9.5px] font-mono text-slate-450 mt-0.5">SKU ID: <span className="font-bold text-slate-800 bg-white px-1 py-0.2 border border-slate-150 rounded">{skuId}</span></p>
                                    </div>

                                    <span className={`px-2 py-1 rounded-xl text-[11px] font-black shrink-0 border ${
                                      totalCount >= 10
                                        ? "bg-emerald-50 text-emerald-850 border-emerald-100"
                                        : totalCount > 0
                                        ? "bg-amber-50 text-amber-850 border-amber-100"
                                        : "bg-red-50 text-red-850 border-red-100"
                                    }`}>
                                      {totalCount} pzs
                                    </span>
                                  </div>

                                  {/* Sub branch results brief inline breakdown */}
                                  <div className="space-y-1.5 pt-2 border-t border-slate-200 max-h-32 overflow-y-auto mt-2">
                                    {itemResult.tiendas.length === 0 ? (
                                      <p className="text-[9.5px] text-slate-400 italic">⚠️ Producto totalmente agotado a nivel nacional.</p>
                                    ) : (
                                      itemResult.tiendas.slice(0, 4).map((t, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[10px] text-slate-600 bg-white hover:bg-slate-100/50 p-1.5 rounded-lg border border-slate-150">
                                          <span className="truncate pr-2 font-medium">📍 {t.storeName} ({t.stateName})</span>
                                          <span className="font-black shrink-0 text-slate-900 border-l border-slate-150 pl-2">{t.numberOfPieces} pzs</span>
                                        </div>
                                      ))
                                    )}
                                    {itemResult.tiendas.length > 4 && (
                                      <p className="text-[9px] text-rose-650 font-black text-right pt-0.5 hover:underline cursor-pointer" onClick={() => {
                                        setSku(skuId);
                                        setResults(itemResult);
                                        setActivePanelTab("individual");
                                        showToast(`Direccionado al monitor individual para ${skuId}.`, "success");
                                      }}>
                                        + {itemResult.tiendas.length - 4} bodegas más. Ver desglose detallado completo 🗺️
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 4 - Realtime monitoring terminal stream logs */}
                    <div className="md:col-span-12 bg-white rounded-3xl p-6 border border-slate-100">
                      <div className="flex justify-between items-center pb-3 border-b border-rose-50 mb-3.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <h4 className="text-xs font-black text-slate-900 uppercase">
                              Bitácora de Telemetría (Live Stream Logging) — {monitoringLog.length} ticks
                            </h4>
                          </div>
                          <span className="text-[9.5px] text-slate-400 font-semibold block">Historial de las peticiones periódicas hechas en segundo plano</span>
                        </div>

                        {monitoringLog.length > 0 && (
                          <button
                            onClick={() => {
                              setMonitoringLog([]);
                              showToast("Bitácora de telemetría borrada.", "info");
                            }}
                            className="text-[9px] font-black text-rose-500 hover:text-rose-700 cursor-pointer italic"
                          >
                            Limpiar Telemetría
                          </button>
                        )}
                      </div>

                      {monitoringLog.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-xs font-medium">
                          Sin logs generados. Enciende la antena de **"Auto-Monitoreo"** o ejecuta una consulta en lote para desplegar datos de red.
                        </div>
                      ) : (
                        <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[10.5px] text-slate-350 max-h-72 overflow-y-auto space-y-2 select-text border border-slate-900 leading-relaxed shadow-inner">
                          <p className="text-cyan-450 border-b border-white/5 pb-1 font-black uppercase text-[9px] tracking-widest flex justify-between">
                            <span>● LIVE TELEMETRY RADAR STREAM ACTIVATED</span>
                            <span className="text-slate-500">{new Date().toLocaleDateString()}</span>
                          </p>
                          {monitoringLog.map((log, index) => {
                            let textClass = "text-slate-400";
                            let prefix = "📎";
                            if (log.type === "success") {
                              textClass = "text-emerald-400 font-bold";
                              prefix = "✨ [STOCK DETECTADO]";
                            } else if (log.type === "warning") {
                              textClass = "text-yellow-400";
                              prefix = "⚠️ [SIN EXISTENCIA]";
                            } else if (log.type === "error") {
                              textClass = "text-rose-550 font-black animate-pulse";
                              prefix = "🚨 [ERROR DE CONEXIÓN]";
                            } else if (log.type === "info") {
                              textClass = "text-cyan-400";
                              prefix = "📡 [MONITOR ENLACE]";
                            }

                            return (
                              <div key={"log-entry-" + index} className="flex items-start gap-1.5 py-0.5 hover:bg-white/5 rounded px-1 transition-colors">
                                <span className="text-slate-600 shrink-0 font-semibold select-none">[{log.timestamp}]</span>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="text-white font-extrabold pr-1.5 uppercase tracking-wide">{log.label}</span>
                                  <span className={textClass}>— {prefix} {log.text}</span>
                                  {log.sku && <span className="text-[9.5px] text-slate-500 font-mono pl-1.5 select-all">SKU: {log.sku}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </motion.div>
                )}
              </div>
            )}

            {activePanelTab === "admin" && isAdminMode && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Admin Hub Title Banner */}
                <div className="bg-gradient-to-r from-amber-550 to-yellow-600 border border-amber-600 p-5 rounded-3xl text-slate-950 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden shadow-md">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] uppercase font-black bg-slate-950 text-white px-2 py-0.5 rounded leading-none font-extrabold tracking-wider animate-pulse">
                        CONSOLA DE CONTROL ABSOLUTO
                      </span>
                    </div>
                    <h2 className="text-base font-black tracking-tight leading-tight uppercase">
                      Hub Supremo de Administración (Simuladores y Apis) ⚙️
                    </h2>
                    <p className="text-slate-900/80 text-[10.5px] font-bold leading-normal mt-1 max-w-xl">
                      Modifica latencias de red, activa fallos simulados y haz stock overrides en tiempo real sobre la base de datos simulada para probar el bot de Telegram y las alertas.
                    </p>
                  </div>
                </div>

                {/* Simulation Latency, success rate and store status lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Simulation Controls Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-rose-100/55 pb-2">
                        <Activity className="w-4 h-4 text-amber-500 animate-pulse animate-spin shrink-0" />
                        Latencia e Inestabilidad de Red
                      </h3>
                      
                      <div className="space-y-5">
                        {/* Latency Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                              ⏱️ Latencia Base de Conexión
                            </label>
                            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                              adminLatency < 600 ? "bg-emerald-50 text-emerald-700" :
                              adminLatency < 1800 ? "bg-yellow-50 text-yellow-750" : "bg-rose-50 text-rose-700"
                            }`}>
                              {adminLatency} ms
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="4000"
                            step="50"
                            value={adminLatency}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setAdminLatency(val);
                              localStorage.setItem("poke_admin_latency", String(val));
                              addTelemetryLog(`[CONFIG-LATENCIA] Latencia base ajustada a ${val}ms.`, "info");
                            }}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <p className="text-[8px] text-slate-400 font-semibold mt-1">
                            Las tiendas configuradas en "LAGGY" operarán a 2.5x esta latencia.
                          </p>
                        </div>

                        {/* Success Rate Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                              💥 Tasa de Éxito de Peticiones API
                            </label>
                            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                              adminSuccessRate > 80 ? "bg-emerald-50 text-emerald-700" :
                              adminSuccessRate > 40 ? "bg-yellow-50 text-yellow-750" : "bg-rose-50 text-rose-700"
                            }`}>
                              {adminSuccessRate}% de Éxito
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={adminSuccessRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setAdminSuccessRate(val);
                              localStorage.setItem("poke_admin_success_rate", String(val));
                              addTelemetryLog(`[CONFIG-ERROR] Tasa de éxito API de simulación definida al ${val}%.`, val === 100 ? "success" : "warning");
                            }}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <p className="text-[8px] text-slate-400 font-semibold mt-1">
                            Define la tasa de inestabilidad. Un valor inferior a 100% simula fallos HTTP 500 aleatorios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store server status controls */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-rose-100/55 pb-2">
                      <Settings className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "8s" }} />
                      Control de Canales (Gimnasios)
                    </h3>
                    <div className="space-y-2.5 max-h-[195px] overflow-y-auto pr-1">
                      {combinedStores.map((store) => {
                        const currentStatus = adminStoreStates[store.key] || "ONLINE";
                        return (
                          <div key={"admin-store-status-" + store.key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-150 rounded-2xl">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black text-white shrink-0 ${store.bgColor}`}>
                                {store.logoText}
                              </span>
                              <span className="text-xs font-extrabold text-slate-800 truncate" title={store.name}>{store.name}</span>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              {(["ONLINE", "LAGGY", "OFFLINE"] as const).map((statusOption) => {
                                let activeStyles = "bg-slate-200 text-slate-600 hover:bg-slate-300";
                                if (currentStatus === statusOption) {
                                  if (statusOption === "ONLINE") activeStyles = "bg-emerald-500 text-white font-black shadow-sm scale-102";
                                  if (statusOption === "LAGGY") activeStyles = "bg-amber-400 text-slate-950 font-black shadow-sm scale-102";
                                  if (statusOption === "OFFLINE") activeStyles = "bg-rose-500 text-white font-black shadow-sm scale-102";
                                }

                                return (
                                  <button
                                    key={statusOption}
                                    onClick={() => {
                                      const updated = { ...adminStoreStates, [store.key]: statusOption };
                                      setAdminStoreStates(updated);
                                      localStorage.setItem("poke_admin_store_statuses_v2", JSON.stringify(updated));
                                      addTelemetryLog(`[ESTADO-SUCURSAL] Servidor ${store.name} transicionado a ${statusOption}.`, statusOption === "OFFLINE" ? "error" : statusOption === "LAGGY" ? "warning" : "success");
                                    }}
                                    className={`text-[8.5px] font-black px-2 py-1 rounded-lg transition-all cursor-pointer ${activeStyles}`}
                                  >
                                    {statusOption}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sub row widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dynamic Custom Channel Creator */}
                  <DynamicStoreCreator
                    adminCustomStores={adminCustomStores}
                    setAdminCustomStores={setAdminCustomStores}
                    addTelemetryLog={addTelemetryLog}
                    showToast={showToast}
                  />

                  {/* Stock Overrides Manager Injector */}
                  <StockOverridesManager
                    combinedStores={combinedStores}
                    activeFixedSkus={activeFixedSkus}
                    activeUserCustomSkus={activeUserCustomSkus}
                    adminFixedSkus={adminFixedSkus}
                    userCustomSkus={userCustomSkus}
                    adminStockOverrides={adminStockOverrides}
                    setAdminStockOverrides={setAdminStockOverrides}
                    addTelemetryLog={addTelemetryLog}
                    showToast={showToast}
                  />
                </div>

                {/* Real-time administrative logging telemetry console */}
                <div className="bg-slate-950 rounded-3xl p-6 border border-slate-900 shadow-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-1.5 leading-none">
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-450 animate-ping mr-1" />
                      TERMINAL DE DIAGNÓSTICOS DE TELEMETRÍA GUBERNAMENTAL DE KANTO
                    </h4>
                    <button
                      onClick={() => {
                        setAdminTelemetryLog([]);
                        showToast("Bitácora de telemetría borrada.", "info");
                      }}
                      className="text-[9px] text-slate-500 hover:text-white transition-colors cursor-pointer italic font-bold"
                    >
                      Limpiar Pantalla
                    </button>
                  </div>

                  <div className="font-mono text-[9.5px] text-slate-300 max-h-48 overflow-y-auto space-y-1.5 select-text border border-white/5 p-3.5 rounded-2xl bg-black/90 shadow-inner">
                    {adminTelemetryLog.length === 0 ? (
                      <p className="text-slate-600 text-center py-4 italic select-none">No hay ticks históricos registrados todavía.</p>
                    ) : (
                      adminTelemetryLog.map((log) => {
                        let textClass = "text-slate-400";
                        if (log.type === "success") textClass = "text-emerald-450 font-bold";
                        if (log.type === "warning") textClass = "text-yellow-400";
                        if (log.type === "error") textClass = "text-rose-500 font-extrabold animate-pulse";
                        if (log.type === "info") textClass = "text-cyan-400";

                        return (
                          <div key={"admin-log-" + log.id} className="flex gap-2 items-start py-0.5 hover:bg-white/5 rounded px-1.5 transition-colors">
                            <span className="text-slate-650 font-semibold select-none">[{log.timestamp}]</span>
                            <span className={textClass}>{log.message}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </section>

        </div>

      </div>

      {/* =========================================================================
         SIMULATED SECURE PAYMENT MODAL DIALOG (CREDIT CARD SUBSCRIPTION ENGINE)
         ========================================================================= */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!paymentLoading) {
                  setShowPaymentModal(false);
                }
              }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Card content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FAFBFB] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-200 z-10 font-sans"
            >
              {/* Luxury header glow */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-rose-500 to-rose-600" />
              
              {paymentLoading ? (
                // LOADING STEPS SCREEN
                <div className="text-center py-12 flex flex-col items-center justify-center min-h-[340px]">
                  {/* Glowing custom Pokéball spinner */}
                  <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-rose-600 flex flex-col justify-between items-center p-0.5 relative shadow-lg overflow-hidden animate-spin mb-6">
                    <div className="bg-rose-550 w-full h-1/2 rounded-t-full" />
                    <div className="absolute top-[21px] left-0 right-0 h-[6px] bg-slate-900 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center z-10" />
                    </div>
                    <div className="bg-white w-full h-1/2 rounded-b-full" />
                  </div>

                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest animate-pulse">
                    Procesando Cobro Seguro...
                  </h3>
                  <p className="text-slate-500 text-xs max-w-sm mt-3.5 px-3 leading-relaxed font-semibold italic text-rose-650 min-h-[40px]">
                    ● {paymentStepText}
                  </p>
                  
                  <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 mt-8 overflow-hidden border">
                    <div className="bg-slate-900 h-1.5 rounded-full animate-infinite-loading w-1/2" />
                  </div>
                </div>
              ) : (
                // THE FORM ITSELF
                <form onSubmit={handleUpgradePayment} className="space-y-4">
                  
                  <div className="flex justify-between items-start pb-3 border-b border-rose-50">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-550 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded">
                        Membresía PRO
                      </span>
                      <h4 className="text-base font-black text-slate-900 tracking-tight uppercase mt-1 leading-none">
                        Adquirir Acceso PRO
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing Description and summary */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                    <div>
                      <p className="text-slate-950">PokéStock Telemetría PRO</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">Vencimiento mensual. Renueva solo si te gusta.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-rose-600 font-extrabold text-sm">$99 MXN</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Por Mes</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Tu Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-rose-500"
                        placeholder="ejemplo@entrenador.com"
                        value={paymentEmail}
                        onChange={(e) => {
                          setPaymentEmail(e.target.value);
                          localStorage.setItem("payment_email_cache", e.target.value);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Nombre Completo del Titular</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-rose-500"
                        placeholder="Ej: Ash Ketchum"
                        value={paymentName}
                        onChange={(e) => {
                          setPaymentName(e.target.value);
                          localStorage.setItem("payment_name_cache", e.target.value);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Tarjeta de Crédito o Débito</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          required
                          maxLength={19}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs font-mono font-bold tracking-widest focus:ring-1 focus:ring-rose-500"
                          placeholder="4000 1234 5678 9010"
                          value={paymentCard}
                          onChange={(e) => {
                            // Quick trim non digits and add spacing
                            const raw = e.target.value.replace(/\D/g, "");
                            const chunked = raw.match(/.{1,4}/g)?.join(" ") || raw;
                            setPaymentCard(chunked.substring(0, 19));
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Vencimiento (MM/AA)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-rose-500 text-center"
                          placeholder="12/29"
                          value={paymentExpiry}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            if (raw.length >= 3) {
                              setPaymentExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
                            } else {
                              setPaymentExpiry(raw);
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">CVV / Firma</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-rose-500 text-center"
                          placeholder="•••"
                          value={paymentCvv}
                          onChange={(e) => setPaymentCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer sandbox info */}
                  <div className="p-3 bg-rose-50/50 border border-rose-150 rounded-xl text-[9.5px] text-slate-500 font-semibold leading-relaxed">
                    ⚙️ **Entorno de Demostración Seguro**: Esta pasarela no se enlaza con bancos comerciales reales ni efectúa transacciones de fondos verdaderos. Puedes ingresar información ficticia o de simulación para validar la secuencia completa de desbloqueo Premium de suscriptores.
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer border border-slate-950 shadow-md transform active:translate-y-0.5"
                  >
                    AUTORIZAR CARGO ELECTRÓNICO 💳
                  </button>

                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sam's Club PX Cookie Injection Modal */}
      <AnimatePresence>
        {showSamsCookieModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
              onClick={() => setShowSamsCookieModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Sesion Web Sam's Club</h2>
                  <p className="text-[10px] text-slate-400 font-semibold">Inyectar cookies reales del navegador</p>
                </div>
                <button
                  onClick={() => setShowSamsCookieModal(false)}
                  className="ml-auto p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[10px] text-blue-800 font-semibold leading-relaxed space-y-1">
                <p className="font-black text-blue-900">Como obtener las cookies:</p>
                <p>1. Abre <strong>sams.com.mx</strong> en Chrome y navega normalmente.</p>
                <p>2. Abre DevTools (F12) → pestaña <strong>Network</strong> → cualquier peticion.</p>
                <p>3. Clic derecho sobre la peticion → <strong>Copy → Copy as cURL</strong>.</p>
                <p>4. Pega el cURL completo aqui abajo. O solo la cadena del header <strong>Cookie:</strong>.</p>
              </div>

              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                rows={6}
                placeholder="Pega aqui el cURL completo o solo el valor del header Cookie: ..."
                value={samsCookieInput}
                onChange={(e) => {
                  let val = e.target.value;
                  // Auto-extract cookie value from cURL if pasted
                  const curlMatch = val.match(/-H\s+['"]?[Cc]ookie:\s*([^'"\\n]+)/);
                  if (curlMatch) val = curlMatch[1].trim();
                  setSamsCookieInput(val);
                }}
              />

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowSamsCookieModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSamsCookies}
                  disabled={samsCookieSaving || !samsCookieInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-xs font-black cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {samsCookieSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {samsCookieSaving ? "Guardando..." : "Activar sesion"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
