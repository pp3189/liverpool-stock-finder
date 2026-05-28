export interface StoreStock {
  storeId: string;
  storeName: string;
  numberOfPieces: number;
  available: string;
  stateName: string;
  _productUrl?: string;
  _price?: string;
  _seller?: string;
}

export interface SearchResult {
  tiendas: StoreStock[];
  total: number;
  sku: string;
  estado: string;
  timestamp: string;
  storeKey?: string; // which store this search was for
}

export interface SearchHistoryItem {
  sku: string;
  estado: string;
  timestamp: string;
  totalPieces: number;
  storeCount: number;
  storeKey: string;
}

export interface SavedSkuItem {
  sku: string;
  label: string;
  category: string;
  storeKey: string; // "liverpool" | "palacio" | "sams" | "amazon" | "chedraui" | "walmart" | "toysrus" | "juguetibici"
}

export interface BrandConfig {
  key: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  placeholderSku: string;
  urlTemplate: (sku: string) => string;
  logoText: string;
  isReal: boolean;
  category: string;
  pokemonHQ: string;
}

