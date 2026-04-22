export type RouletteItem = {
  id: string;
  label: string;
  image?: string; // data URL
};

export type HistoryEntry = {
  id: string;
  itemId: string;
  label: string;
  image?: string;
  drawnAt: number;
};

const ITEMS_KEY = "roulette:items";
const HISTORY_KEY = "roulette:history";

export const loadItems = (): RouletteItem[] => {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (raw === null) return defaultItems(); // 初回のみデフォルト
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const saveItems = (items: RouletteItem[]) => {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
};

export const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addHistory = (entry: HistoryEntry) => {
  const list = loadHistory();
  list.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

const defaultItems = (): RouletteItem[] =>
  Array.from({ length: 10 }, (_, i) => ({
    id: crypto.randomUUID(),
    label: String(i + 1),
  }));
