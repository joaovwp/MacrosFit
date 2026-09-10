"use strict";

/* ---------------- constants ---------------- */
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const FULL_WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const TREND_DAYS = 21;
const AMBER_SCALE = ["var(--amber0)", "var(--amber1)", "var(--amber2)", "var(--amber3)", "var(--amber4)"];
const STORAGE_KEYS = { profile: "ft-profile", library: "ft-food-library", diary: "ft-diary" };
const MEAL_TYPES = [
  { id: "cafe", label: "Café da manhã", icon: "sun" },
  { id: "almoco", label: "Almoço", icon: "flame" },
  { id: "lanche", label: "Lanche", icon: "sparkles" },
  { id: "jantar", label: "Jantar", icon: "moon" },
  { id: "ceia", label: "Ceia", icon: "star" },
  { id: "outro", label: "Outro", icon: "plus" }
];
const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentário", multiplier: 1.2 },
  { id: "light", label: "Levemente ativo", multiplier: 1.375 },
  { id: "moderate", label: "Moderadamente ativo", multiplier: 1.55 },
  { id: "active", label: "Muito ativo", multiplier: 1.725 },
  { id: "very_active", label: "Extremamente ativo", multiplier: 1.9 }
];
const DEFAULT_PROFILE = { 
  goals: null, 
  settings: { trackWeight: false, trackWater: false, trackWorkout: false },
  biometrics: { weight: null, height: null, age: null, gender: null, activityLevel: null }
};

/* ---------------- helpers ---------------- */
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const normalize = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round = (v) => Math.round(v * 10) / 10;
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function parseKey(k) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function emptyDay() { 
  return { 
    entries: [], 
    weight: null, 
    water: 0, 
    workout: { done: false, note: "" } 
  }; 
}
function dayTotals(day) {
  if (!day || !day.entries.length) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  return day.entries.reduce((acc, e) => ({
    kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}
function dayScore(day, goals) {
  if (!goals || !day || !day.entries.length) return null;
  const t = dayTotals(day);
  const metrics = [[t.kcal, goals.calories], [t.protein, goals.protein], [t.carbs, goals.carbs], [t.fat, goals.fat]];
  const devs = metrics.filter(([, g]) => g > 0).map(([v, g]) => Math.min(1, Math.abs(v - g) / g));
  if (!devs.length) return null;
  const avg = devs.reduce((a, b) => a + b, 0) / devs.length;
  return clamp(1 - avg, 0, 1);
}
function scoreLevel(score) {
  if (score == null) return -1;
  if (score >= 0.9) return 4;
  if (score >= 0.72) return 3;
  if (score >= 0.5) return 2;
  if (score >= 0.28) return 1;
  return 0;
}

function calculateBMR(weight, height, age, gender) {
  if (!weight || !height || !age || !gender) return null;
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = parseFloat(age);
  if (gender === "male") {
    return (10 * w) + (6.25 * h) - (5 * a) + 5;
  } else {
    return (10 * w) + (6.25 * h) - (5 * a) - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  if (!bmr || !activityLevel) return null;
  const level = ACTIVITY_LEVELS.find(l => l.id === activityLevel);
  if (!level) return null;
  return Math.round(bmr * level.multiplier);
}



/* ---------------- storage ---------------- */
function loadAll() {
  const out = { profile: DEFAULT_PROFILE, library: {}, diary: {} };
  try { 
    const p = localStorage.getItem(STORAGE_KEYS.profile); 
    if (p) {
      const parsed = JSON.parse(p);
      out.profile = { 
        ...DEFAULT_PROFILE, 
        ...parsed,
        biometrics: { ...DEFAULT_PROFILE.biometrics, ...parsed.biometrics },
        settings: { ...DEFAULT_PROFILE.settings, ...parsed.settings }
      }; 
    } 
  } catch (e) {}
  try { const l = localStorage.getItem(STORAGE_KEYS.library); if (l) out.library = JSON.parse(l); } catch (e) {}
  try { const d = localStorage.getItem(STORAGE_KEYS.diary); if (d) out.diary = JSON.parse(d); } catch (e) {}
  return out;
}
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Falha ao salvar", key, e); }
}

/* ---------------- icons ---------------- */
function icon(name, size, color, extra) {
  size = size || 15; color = color || "currentColor"; extra = extra || "";
  const a = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${extra};flex-shrink:0;display:block"`;
  switch (name) {
    case "plus": return `<svg ${a}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    case "trash": return `<svg ${a}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    case "pencil": return `<svg ${a}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
    case "x": return `<svg ${a}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    case "chevron-left": return `<svg ${a}><polyline points="15 18 9 12 15 6"/></svg>`;
    case "chevron-right": return `<svg ${a}><polyline points="9 18 15 12 9 6"/></svg>`;
    case "chevron-down": return `<svg ${a}><polyline points="6 9 12 15 18 9"/></svg>`;
    case "search": return `<svg ${a}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    case "flame": return `<svg ${a}><path d="M8.5 14.5c0 1.5 1.2 2.5 2.5 2.5s2.5-1 2.5-2.5c0-1.2-.5-2-1-3-1-1.9-.2-3.6 2-5.5.4 2.2 1.8 4.4 3.5 5.8 1.6 1.4 2.5 3 2.5 4.7a7.5 7.5 0 1 1-15 0c0-1 .4-2 1-2.7 1.3 1.3.5 3.5 2 4.7Z"/></svg>`;
    case "droplet": return `<svg ${a}><path d="M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/></svg>`;
    case "dumbbell": return `<svg ${a}><line x1="4" y1="12" x2="20" y2="12"/><circle cx="4" cy="12" r="2.3"/><circle cx="20" cy="12" r="2.3"/><line x1="9" y1="8" x2="9" y2="16"/><line x1="15" y1="8" x2="15" y2="16"/></svg>`;
    case "protein": return `<svg ${a}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
    case "carbs": return `<svg ${a}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10"/></svg>`;
    case "fat": return `<svg ${a}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`;
    case "trending-up": return `<svg ${a}><polyline points="3 17 9 11 13 15 21 6"/><polyline points="14 6 21 6 21 13"/></svg>`;
    case "check": return `<svg ${a}><polyline points="20 6 9 17 4 12"/></svg>`;
    case "alert-triangle": return `<svg ${a}><path d="M12 2 1 21h22L12 2Z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17.3" x2="12" y2="17.4"/></svg>`;
    case "sparkles": return `<svg ${a}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l1.8 1.8M15.7 15.7l1.8 1.8M6.5 17.5l1.8-1.8M15.7 8.3l1.8-1.8"/></svg>`;
    case "list-plus": return `<svg ${a}><line x1="3" y1="6" x2="13" y2="6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/><line x1="18" y1="9" x2="18" y2="17"/><line x1="14" y1="13" x2="22" y2="13"/></svg>`;
    case "sun": return `<svg ${a}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    case "moon": return `<svg ${a}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    case "star": return `<svg ${a}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    case "download": return `<svg ${a}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    case "upload": return `<svg ${a}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    case "copy": return `<svg ${a}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    default: return "";
  }
}

/* ---------------- state ---------------- */
let state = {
  profile: DEFAULT_PROFILE,
  library: {},
  diary: {},
  tab: "hoje",
  viewMonth: new Date(),
  selectedKey: null,
  qa: { name: "", grams: "", mealType: "cafe", manualOpen: false, manual: { kcal: "", protein: "", carbs: "", fat: "" }, saveToLib: true, showSuggest: false, msg: "" },
  entryEdit: { id: null, val: "" },
  trendMetric: "calories",
  lib: { query: "", adding: false, form: { name: "", kcal: "", protein: "", carbs: "", fat: "" }, editingId: null, editingHistory: null },
  goalsForm: null,
  goalsSaved: false,
  confirmDelete: false,
  importExport: { showImport: false, showExport: false, importData: "", showMealImport: false, mealImportData: "" },
  appSettings: { theme: "dark", language: "pt-BR" },
  biometricsForm: null,
  expandedMeals: {},
  historyPeriod: 21,
  historyView: "overview",
};

function qaBasis() {
  const n = normalize(state.qa.name);
  if (!n) return null;
  const exact = Object.values(state.library).find((f) => normalize(f.name) === n);
  return exact ? { kcal: exact.kcal, protein: exact.protein, carbs: exact.carbs, fat: exact.fat } : null;
}
function qaSuggestions() {
  const n = normalize(state.qa.name);
  if (!n) return [];
  return Object.values(state.library).filter((f) => normalize(f.name).includes(n)).slice(0, 6);
}
function qaComputed() {
  const basis = qaBasis();
  const g = parseFloat(state.qa.grams) || 0;
  if (!basis || g <= 0) return null;
  return { kcal: (basis.kcal * g) / 100, protein: (basis.protein * g) / 100, carbs: (basis.carbs * g) / 100, fat: (basis.fat * g) / 100 };
}
function recentFoods() {
  const all = [];
  Object.values(state.diary).forEach((day) => day.entries.forEach((e) => all.push(e)));
  all.sort((a, b) => b.time - a.time);
  const seen = new Set(); const out = [];
  for (const e of all) {
    const n = normalize(e.name);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push({ name: e.name, grams: e.grams, per100: e.per100 });
    if (out.length >= 8) break;
  }
  return out;
}

function groupEntriesByMeal(day) {
  const entries = day.entries || [];
  const grouped = {};
  MEAL_TYPES.forEach(mt => {
    grouped[mt.id] = entries.filter(e => e.mealType === mt.id);
  });
  return grouped;
}

function groupEntriesByMealInstance(day) {
  const entries = day.entries || [];
  const grouped = {};
  
  entries.forEach(e => {
    const key = e.mealType || 'outro';
    const instanceId = e.importInstanceId || e.time;
    const instanceKey = `${key}-${instanceId}`;
    
    if (!grouped[instanceKey]) {
      grouped[instanceKey] = {
        mealType: key,
        instanceId: instanceId,
        entries: [],
        time: e.time
      };
    }
    grouped[instanceKey].entries.push(e);
  });
  
  return Object.values(grouped).sort((a, b) => a.time - b.time);
}

/* ---------------- mutations ---------------- */
function updateDiaryDay(key, updater) {
  const next = { ...state.diary, [key]: updater(state.diary[key] || emptyDay()) };
  state.diary = next;
  persist(STORAGE_KEYS.diary, next);
}
function todayKey() { return dateKey(new Date()); }
function addEntry(entry, saveToLib) {
  updateDiaryDay(todayKey(), (day) => {
    const updatedEntry = { ...entry, mealType: state.qa.mealType };
    return { ...day, entries: [...day.entries, updatedEntry] };
  });
  if (saveToLib) {
    const food = { id: uid(), name: entry.name, ...entry.per100 };
    state.library = { ...state.library, [food.id]: food };
    persist(STORAGE_KEYS.library, state.library);
  }
}
function deleteEntry(id) {
  updateDiaryDay(todayKey(), (day) => {
    const updatedEntries = day.entries.filter((e) => e.id !== id);
    return { ...day, entries: updatedEntries };
  });
}
function editEntryGrams(id, newGrams) {
  updateDiaryDay(todayKey(), (day) => ({
    ...day,
    entries: day.entries.map((e) => {
      if (e.id !== id) return e;
      const p = e.per100;
      return { ...e, grams: newGrams, kcal: (p.kcal * newGrams) / 100, protein: (p.protein * newGrams) / 100, carbs: (p.carbs * newGrams) / 100, fat: (p.fat * newGrams) / 100 };
    }),
  }));
}
function updateExtras(newDay) { updateDiaryDay(todayKey(), () => newDay); }
function upsertFood(food) { state.library = { ...state.library, [food.id]: food }; persist(STORAGE_KEYS.library, state.library); }
function deleteFood(id) { const next = { ...state.library }; delete next[id]; state.library = next; persist(STORAGE_KEYS.library, next); }
function saveGoals(goals) { state.profile = { ...state.profile, goals }; persist(STORAGE_KEYS.profile, state.profile); }
function saveBiometrics(biometrics) { state.profile = { ...state.profile, biometrics }; persist(STORAGE_KEYS.profile, state.profile); }
function toggleSetting(key, val) { state.profile = { ...state.profile, settings: { ...state.profile.settings, [key]: val } }; persist(STORAGE_KEYS.profile, state.profile); }
function resetAll() {
  persist(STORAGE_KEYS.profile, DEFAULT_PROFILE); persist(STORAGE_KEYS.library, {}); persist(STORAGE_KEYS.diary, {});
  state.profile = DEFAULT_PROFILE; state.library = {}; state.diary = {}; state.tab = "hoje"; state.confirmDelete = false;
  state.qa = { name: "", grams: "", mealType: "cafe", manualOpen: false, manual: { kcal: "", protein: "", carbs: "", fat: "" }, saveToLib: true, showSuggest: false, msg: "" };
}

function exportData() {
  const data = {
    profile: state.profile,
    library: state.library,
    diary: state.diary,
    exportDate: new Date().toISOString(),
    version: "2.0"
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fitness-tracker-${dateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData() {
  try {
    const data = JSON.parse(state.importExport.importData);
    if (data.profile) {
      state.profile = { ...DEFAULT_PROFILE, ...data.profile };
      persist(STORAGE_KEYS.profile, state.profile);
    }
    if (data.library) {
      state.library = data.library;
      persist(STORAGE_KEYS.library, state.library);
    }
    if (data.diary) {
      state.diary = data.diary;
      persist(STORAGE_KEYS.diary, state.diary);
    }
    state.importExport.showImport = false;
    state.importExport.importData = "";
    state.qa.msg = "Dados importados com sucesso!";
    render();
    setTimeout(() => { state.qa.msg = ""; render(); }, 2000);
  } catch (e) {
    alert("Erro ao importar dados: formato JSON inválido");
  }
}

function exportMeal(mealType, dateKey) {
  const day = state.diary[dateKey];
  if (!day || !day.entries) {
    alert("Não há alimentos neste dia para exportar");
    return;
  }
  
  const mealEntries = day.entries.filter(e => e.mealType === mealType);
  if (mealEntries.length === 0) {
    alert("Não há alimentos nesta refeição para exportar");
    return;
  }
  
  const mealData = {
    mealType: mealType,
    mealName: MEAL_TYPES.find(mt => mt.id === mealType)?.label || mealType,
    date: dateKey,
    items: mealEntries.map(entry => ({
      name: entry.name,
      grams: entry.grams,
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      per100: entry.per100
    })),
    totals: mealEntries.reduce((acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    exportDate: new Date().toISOString(),
    version: "2.0"
  };
  
  const blob = new Blob([JSON.stringify(mealData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `refeicao-${mealType}-${dateKey}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportMealInstance(instanceId, mealType, dateKey) {
  const day = state.diary[dateKey];
  if (!day || !day.entries) {
    alert("Não há alimentos neste dia para exportar");
    return;
  }
  
  const mealEntries = day.entries.filter(e => 
    (e.importInstanceId === instanceId) || (e.time === instanceId && e.mealType === mealType)
  );
  
  if (mealEntries.length === 0) {
    alert("Não há alimentos nesta refeição para exportar");
    return;
  }
  
  const mealData = {
    mealType: mealType,
    mealName: MEAL_TYPES.find(mt => mt.id === mealType)?.label || mealType,
    date: dateKey,
    items: mealEntries.map(entry => ({
      name: entry.name,
      grams: entry.grams,
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      per100: entry.per100
    })),
    totals: mealEntries.reduce((acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    exportDate: new Date().toISOString(),
    version: "2.0"
  };
  
  const blob = new Blob([JSON.stringify(mealData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `refeicao-${mealType}-${new Date(instanceId).getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importMeal() {
  try {
    const mealData = JSON.parse(state.importExport.mealImportData);
    
    // Validar formato
    if (!mealData.items || !Array.isArray(mealData.items)) {
      throw new Error("Formato inválido: campo 'items' ausente ou não é array");
    }
    
    // Determinar tipo de refeição
    const mealType = mealData.mealType || state.qa.mealType;
    
    // Gerar ID único para esta importação (para agrupar itens juntos)
    const importInstanceId = Date.now();
    
    // Adicionar alimentos à biblioteca se não existirem
    mealData.items.forEach(item => {
      if (item.per100) {
        const existingFood = Object.values(state.library).find(f => normalize(f.name) === normalize(item.name));
        if (!existingFood) {
          const food = { id: uid(), name: item.name, ...item.per100 };
          state.library = { ...state.library, [food.id]: food };
        }
      }
    });
    persist(STORAGE_KEYS.library, state.library);
    
    // Adicionar itens ao dia atual
    const today = state.diary[todayKey()] || emptyDay();
    const updatedEntries = [...today.entries];
    
    mealData.items.forEach(item => {
      const newEntry = {
        id: uid(),
        name: item.name,
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        per100: item.per100 || { kcal: (item.kcal / item.grams) * 100, protein: (item.protein / item.grams) * 100, carbs: (item.carbs / item.grams) * 100, fat: (item.fat / item.grams) * 100 },
        time: Date.now(),
        mealType: mealType,
        importInstanceId: importInstanceId
      };
      updatedEntries.push(newEntry);
    });
    
    updateDiaryDay(todayKey(), () => ({ ...today, entries: updatedEntries }));
    
    state.importExport.showMealImport = false;
    state.importExport.mealImportData = "";
    state.qa.msg = `Refeição importada com sucesso! (${mealData.items.length} itens)`;
    render();
    setTimeout(() => { state.qa.msg = ""; render(); }, 3000);
  } catch (e) {
    alert("Erro ao importar refeição: " + e.message);
  }
}

/* ---------------- small components ---------------- */
function circularGauge(value, max, color, size, label, unit) {
  size = size || 148;
  const pct = max > 0 ? clamp(value / max, 0, 1) : 0;
  const r = (size - 16) / 2, c = 2 * Math.PI * r;
  const over = max > 0 && value > max;
  const dcolor = over ? "var(--over)" : color;
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--surface2)" stroke-width="11" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${dcolor}" stroke-width="11" fill="none" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" stroke-linecap="round" style="transition:stroke-dashoffset .4s ease"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div class="mono" style="font-size:26px;font-weight:700;color:var(--text);line-height:1">${Math.round(value)}</div>
      <div style="font-size:11px;color:var(--textMuted);margin-top:4px">${esc(unit)}</div>
      ${label ? `<div style="font-size:10.5px;color:var(--textFaint);margin-top:2px">${esc(label)}</div>` : ""}
    </div>
  </div>`;
}
function macroBar(label, value, goal, color, unit) {
  unit = unit || "g";
  const pct = goal > 0 ? clamp((value / goal) * 100, 0, 100) : 0;
  const over = goal > 0 && value > goal;
  const remaining = goal - value;
  return `<div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
      <span style="color:var(--text);font-weight:600">${esc(label)}</span>
      <span class="mono" style="color:var(--textMuted)">${round(value)}${unit} / ${goal ? goal : "–"}${goal ? unit : ""}</span>
    </div>
    <div style="height:8px;border-radius:4px;background:var(--surface2);overflow:hidden">
      <div style="width:${pct}%;height:100%;background:${over ? "var(--over)" : color};transition:width .3s ease"></div>
    </div>
    ${goal > 0 ? `<div style="font-size:11px;margin-top:4px;color:${over ? "var(--over)" : "var(--textFaint)"}">${over ? `+${round(value - goal)}${unit} acima da meta` : `faltam ${round(remaining)}${unit}`}</div>` : ""}
  </div>`;
}
function macroDonut(protein, carbs, fat, size) {
  size = size || 168;
  const p = Math.max(0, protein * 4), c = Math.max(0, carbs * 4), f = Math.max(0, fat * 9);
  const total = p + c + f;
  let grad;
  if (total <= 0) {
    grad = "var(--surface2)";
  } else {
    const p1 = (p / total) * 100, p2 = p1 + (c / total) * 100;
    grad = `conic-gradient(var(--protein) 0 ${p1}%, var(--carbs) ${p1}% ${p2}%, var(--fat) ${p2}% 100%)`;
  }
  return `<div class="donut" style="background:${grad}">
    <div class="donut-hole"><div class="mono" style="font-size:20px;font-weight:700">${Math.round(total)}</div><div style="font-size:10.5px;color:var(--textMuted)">kcal</div></div>
  </div>`;
}
function toggleSwitch(checked, dataAction, dataKey) {
  return `<button type="button" class="toggle" data-action="${dataAction}" data-key="${dataKey || ""}" style="background:${checked ? "var(--calories)" : "var(--surface2)"}">
    <div class="toggle-dot" style="left:${checked ? "18px" : "2px"}"></div>
  </button>`;
}

/* ---------------- Hoje: quick add form ---------------- */
function quickAddFormHTML() {
  const recent = recentFoods();
  const suggestions = state.qa.showSuggest ? qaSuggestions() : [];
  const basis = qaBasis();
  const computed = qaComputed();
  const grams = parseFloat(state.qa.grams) || 0;
  const canSubmit = state.qa.name.trim() && grams > 0 && (computed || parseFloat(state.qa.manual.kcal) > 0);

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      ${icon("list-plus", 17, "var(--calories)")}
      <div style="font-weight:700;font-size:15px">Registrar alimento</div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Tipo de refeição</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${MEAL_TYPES.map((mt) => `
          <button type="button" class="chip" data-action="qa-meal-select" data-meal="${mt.id}" 
            style="${state.qa.mealType === mt.id ? "border-color:var(--calories);background:var(--calories);color:#17140A" : ""}">
            ${icon(mt.icon, 12, state.qa.mealType === mt.id ? "#17140A" : "var(--textMuted)")}
            ${esc(mt.label)}
          </button>
        `).join("")}
      </div>
    </div>
    ${recent.length ? `<div class="ft-scroll" style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px">
      ${recent.map((r, i) => `<div class="chip" data-action="qa-pick-recent" data-index="${i}">${esc(r.name)}</div>`).join("")}
    </div>` : ""}
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <div style="position:relative;flex:2">
        <input id="qa-name" class="input" placeholder="Nome do alimento" value="${esc(state.qa.name)}" data-action="qa-name-input" autocomplete="off"/>
        ${suggestions.length ? `<div class="suggest">
          ${suggestions.map((f) => `<div class="suggest-item" data-action="qa-pick-suggestion" data-id="${f.id}"><span>${esc(f.name)}</span><span class="mono" style="color:var(--textMuted)">${Math.round(f.kcal)} kcal/100g</span></div>`).join("")}
        </div>` : ""}
      </div>
      <input id="qa-grams" class="input" placeholder="g" type="number" inputmode="decimal" style="flex:1" value="${esc(state.qa.grams)}" data-action="qa-grams-input"/>
    </div>
    ${computed ? `<div style="display:flex;gap:14px;font-size:12.5px;color:var(--textMuted);margin-bottom:10px;flex-wrap:wrap">
      <span class="mono" style="color:var(--calories)">${Math.round(computed.kcal)} kcal</span>
      <span class="mono" style="color:var(--protein)">P ${round(computed.protein)}g</span>
      <span class="mono" style="color:var(--carbs)">C ${round(computed.carbs)}g</span>
      <span class="mono" style="color:var(--fat)">G ${round(computed.fat)}g</span>
      <a class="link" data-action="qa-open-manual">ajustar manualmente</a>
    </div>` : ""}
    ${!computed && state.qa.name.trim() ? (state.qa.manualOpen ? `<div style="margin-bottom:10px">
      <div style="font-size:12px;color:var(--textMuted);margin-bottom:6px">Alimento novo — valores para ${grams > 0 ? `${grams}g` : "essa quantidade"}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">
        <input class="input" placeholder="kcal" type="number" value="${esc(state.qa.manual.kcal)}" data-action="qa-manual-input" data-field="kcal"/>
        <input class="input" placeholder="prot. g" type="number" value="${esc(state.qa.manual.protein)}" data-action="qa-manual-input" data-field="protein"/>
        <input class="input" placeholder="carb. g" type="number" value="${esc(state.qa.manual.carbs)}" data-action="qa-manual-input" data-field="carbs"/>
        <input class="input" placeholder="gord. g" type="number" value="${esc(state.qa.manual.fat)}" data-action="qa-manual-input" data-field="fat"/>
      </div>
      <label class="checkline"><input type="checkbox" data-action="qa-savelib-toggle" ${state.qa.saveToLib ? "checked" : ""}/> Salvar na biblioteca para reconhecer da próxima vez</label>
    </div>` : `<div style="margin-bottom:10px"><a class="link" data-action="qa-open-manual">não encontrei na biblioteca — inserir valores manualmente</a></div>`) : ""}
    <div style="display:flex;align-items:center;gap:10px">
      <button class="btn btn-primary" data-action="qa-submit" ${canSubmit ? "" : "disabled"}>${icon("plus", 15)} Adicionar</button>
      ${state.qa.msg ? `<span style="font-size:12.5px;color:var(--good)">${esc(state.qa.msg)}</span>` : ""}
    </div>
  </div>`;
}

function todayEntriesHTML(day) {
  const entries = day.entries || [];
  if (!entries.length) return `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Nenhum alimento registrado hoje ainda.</div>`;
  
  const mealInstances = groupEntriesByMealInstance(day);
  
  return `<div style="display:flex;flex-direction:column;gap:8px">
    ${mealInstances.map((instance, idx) => {
      const mt = MEAL_TYPES.find(m => m.id === instance.mealType) || MEAL_TYPES[MEAL_TYPES.length - 1];
      const mealTotals = instance.entries.reduce((acc, e) => ({
        kcal: acc.kcal + e.kcal,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      
      const timeStr = new Date(instance.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const instanceKey = `${instance.mealType}-${instance.instanceId}`;
      const isExpanded = state.expandedMeals[instanceKey];
      
      return `<div class="card" style="padding:10px">
        <div style="display:flex;align-items:center;gap:8px;cursor:pointer" data-action="toggle-meal" data-instance-key="${instanceKey}">
          ${icon(isExpanded ? "chevron-down" : "chevron-right", 14, "var(--textMuted)")}
          ${icon(mt.icon, 14, "var(--calories)")}
          <div style="font-weight:600;font-size:13px">${esc(mt.label)}</div>
          <div style="font-size:10px;color:var(--textFaint);margin-left:auto">${timeStr}</div>
          <div class="mono" style="font-size:12px;color:var(--textMuted);margin-left:8px">
            ${Math.round(mealTotals.kcal)} kcal
          </div>
        </div>
        ${isExpanded ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--borderSoft)">
            <div style="display:flex;gap:8px;margin-bottom:8px;font-size:11px;color:var(--textMuted">
              <span class="mono">P ${round(mealTotals.protein)}g</span>
              <span class="mono">C ${round(mealTotals.carbs)}g</span>
              <span class="mono">G ${round(mealTotals.fat)}g</span>
            </div>
            ${instance.entries.map((e) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--borderSoft)">
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}</div>
                <div class="mono" style="font-size:10px;color:var(--textMuted);margin-top:1px">${Math.round(e.kcal)} kcal · ${e.grams}g</div>
              </div>
              ${state.entryEdit.id === e.id ? `
                <input class="input" style="width:60px" type="number" value="${esc(state.entryEdit.val)}" data-action="entry-edit-input" autofocus/>
                <span style="font-size:10px;color:var(--textFaint)">g</span>
                <button class="btn btn-icon" data-action="entry-edit-confirm" data-id="${e.id}" data-fallback="${e.grams}">${icon("check", 12)}</button>
                <button class="btn btn-icon" data-action="entry-edit-cancel">${icon("x", 12)}</button>
              ` : `
                <button class="btn btn-icon" data-action="entry-edit-start" data-id="${e.id}" data-grams="${e.grams}">${icon("pencil", 12)}</button>
                <button class="btn btn-icon" data-action="entry-delete" data-id="${e.id}">${icon("trash", 12, "var(--over)")}</button>
              `}
            </div>`).join("")}
            <div style="display:flex;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-icon" style="padding:4px" data-action="export-meal-instance" data-instance-id="${instance.instanceId}" data-meal="${instance.mealType}" title="Exportar refeição">${icon("download", 12, "var(--textMuted)")}</button>
            </div>
          </div>
        ` : `
          <div style="display:flex;gap:8px;margin-top:6px;font-size:10px;color:var(--textFaint)">
            <span class="mono">P ${round(mealTotals.protein)}g</span>
            <span class="mono">C ${round(mealTotals.carbs)}g</span>
            <span class="mono">G ${round(mealTotals.fat)}g</span>
          </div>
        `}
      </div>`;
    }).join("")}
  </div>`;
}

function extrasBarHTML(settings, day) {
  if (!settings.trackWeight && !settings.trackWater && !settings.trackWorkout) return "";
  return `<div style="display:flex;gap:10px;flex-wrap:wrap">
    ${settings.trackWeight ? `<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px">
      <span style="font-size:12.5px;color:var(--textMuted)">Peso</span>
      <input id="extras-weight" class="input" type="number" style="width:64px" value="${day.weight != null ? day.weight : ""}" data-action="extras-weight-input"/>
      <span style="font-size:12px;color:var(--textFaint)">kg</span>
    </div>` : ""}
    ${settings.trackWater ? `<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px">
      ${icon("droplet", 14, "var(--protein)")}
      <span class="mono" style="font-size:12.5px">${day.water || 0}ml</span>
      <button class="btn" style="padding:4px 8px;font-size:11.5px" data-action="extras-water-add" data-amt="250">+250</button>
      <button class="btn" style="padding:4px 8px;font-size:11.5px" data-action="extras-water-add" data-amt="500">+500</button>
      <button class="btn" style="padding:4px 8px;font-size:11.5px" data-action="extras-water-reset">zerar</button>
    </div>` : ""}
    ${settings.trackWorkout ? `<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px">
      ${icon("dumbbell", 14, "var(--fat)")}
      <label class="checkline"><input type="checkbox" data-action="extras-workout-toggle" ${day.workout && day.workout.done ? "checked" : ""}/> treinei hoje</label>
    </div>` : ""}
  </div>`;
}

/* ---------------- Histórico ---------------- */
function calendarMonthHTML() {
  const year = state.viewMonth.getFullYear(), month = state.viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const todayK = dateKey(new Date());
  const goals = state.profile.goals;

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button class="btn btn-icon" data-action="cal-prev">${icon("chevron-left", 15)}</button>
      <div style="font-weight:700;font-size:14.5px;text-transform:capitalize">${MONTHS[month]} ${year}</div>
      <button class="btn btn-icon" data-action="cal-next">${icon("chevron-right", 15)}</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:6px">
      ${WEEKDAYS.map((w) => `<div style="font-size:10.5px;color:var(--textFaint);text-align:center;text-transform:uppercase">${w}</div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
      ${cells.map((d) => {
        if (!d) return `<div></div>`;
        const key = dateKey(new Date(year, month, d));
        const day = state.diary[key];
        const isToday = key === todayK;
        const hasData = day && day.entries && day.entries.length > 0;
        
        let cellStyle = "background:var(--surface2);border-color:var(--borderSoft)";
        let dayColor = "var(--textMuted)";
        let dayDetails = "";
        
        if (hasData && goals) {
          const t = dayTotals(day);
          const pct = goals.calories > 0 ? (t.kcal / goals.calories) * 100 : 0;
          const onTarget = Math.abs(pct - 100) <= 10;
          
          if (onTarget) {
            cellStyle = "background:var(--good)20;border-color:var(--good)";
            dayColor = "var(--good)";
          } else if (pct > 110) {
            cellStyle = "background:var(--over)20;border-color:var(--over)";
            dayColor = "var(--over)";
          } else if (pct < 90) {
            cellStyle = "background:var(--calories)20;border-color:var(--calories)";
            dayColor = "var(--calories)";
          }
          
          // Detalhes completos dentro do dia
          dayDetails = `
            <div style="position:absolute;bottom:3px;right:3px;display:flex;flex-direction:column;gap:2px;font-size:9px;text-align:right;">
              <div style="color:var(--calories);font-weight:600">${Math.round(t.kcal)} kcal</div>
              <div style="color:var(--protein)">P: ${Math.round(t.protein)}g</div>
              <div style="color:var(--carbs)">C: ${Math.round(t.carbs)}g</div>
              <div style="color:var(--fat)">G: ${Math.round(t.fat)}g</div>
            </div>
          `;
        }
        
        if (isToday) {
          cellStyle = "background:var(--calories)30;border-color:var(--calories)";
          dayColor = "var(--calories)";
        }
        
        return `<button type="button" class="cal-cell ${hasData ? "has-data" : ""} ${state.selectedKey === key ? "selected" : ""}"
          style="${cellStyle};min-height:65px"
          data-action="cal-select-day" data-key="${key}" ${hasData ? "" : "disabled"}>
          <span style="position:absolute;top:3px;left:5px;font-size:10.5px;color:${dayColor}">${d}</span>
          ${dayDetails}
        </button>`;
      }).join("")}
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px;color:var(--textMuted);flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:var(--good)"></div>Na meta</div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:var(--calories)"></div>Abaixo</div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:var(--over)"></div>Acima</div>
    </div>
  </div>`;
}

function dayDetailHTML() {
  if (!state.selectedKey) return "";
  const day = state.diary[state.selectedKey] || emptyDay();
  const goals = state.profile.goals;
  const t = dayTotals(day);
  const d = parseKey(state.selectedKey);
  
  const mealInstances = groupEntriesByMealInstance(day);
  
  return `<div class="card" style="padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-weight:700;font-size:14.5px">${d.getDate()} de ${MONTHS[d.getMonth()]}</div>
      <button class="btn btn-icon" data-action="daydetail-close">${icon("x", 14)}</button>
    </div>
    ${goals ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
      ${macroBar("Calorias", t.kcal, goals.calories, "var(--calories)", " kcal")}
      ${macroBar("Proteína", t.protein, goals.protein, "var(--protein)")}
      ${macroBar("Carboidratos", t.carbs, goals.carbs, "var(--carbs)")}
      ${macroBar("Gordura", t.fat, goals.fat, "var(--fat)")}
    </div>` : ""}
    <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:8px">Refeições registradas</div>
    ${mealInstances.map(instance => {
      const mt = MEAL_TYPES.find(m => m.id === instance.mealType) || MEAL_TYPES[MEAL_TYPES.length - 1];
      const mealTotals = instance.entries.reduce((acc, e) => ({
        kcal: acc.kcal + e.kcal,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      
      return `<div style="margin-bottom:8px;padding:8px;background:var(--surface2);border-radius:6px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${icon(mt.icon, 12, "var(--calories)")}
          <span style="font-size:12px;font-weight:600">${esc(mt.label)}</span>
          <span class="mono" style="font-size:11px;color:var(--textMuted);margin-left:auto">${Math.round(mealTotals.kcal)} kcal</span>
        </div>
        <div style="font-size:10px;color:var(--textFaint)">
          ${instance.entries.map(e => `${esc(e.name)} (${e.grams}g)`).join(", ")}
        </div>
      </div>`;
    }).join("")}
    ${(day.weight || day.water > 0 || (day.workout && day.workout.done)) ? `<div style="display:flex;gap:14px;margin-top:12px;font-size:12px;color:var(--textMuted)">
      ${day.weight ? `<span>Peso: ${day.weight}kg</span>` : ""}
      ${day.water > 0 ? `<span>Água: ${day.water}ml</span>` : ""}
      ${day.workout && day.workout.done ? `<span>Treino ✓</span>` : ""}
    </div>` : ""}
  </div>`;
}

function trendChartSVG(data, goalVal, color) {
  const w = 660, h = 220, padL = 36, padR = 8, padT = 10, padB = 22;
  const vals = data.map((d) => d.value).filter((v) => v != null);
  if (!vals.length && goalVal == null) {
    return `<div style="height:220px;display:flex;align-items:center;justify-content:center;color:var(--textFaint);font-size:12.5px">Sem dados suficientes ainda.</div>`;
  }
  let min = vals.length ? Math.min(...vals) : (goalVal || 0);
  let max = vals.length ? Math.max(...vals) : (goalVal || 1);
  if (goalVal != null) { min = Math.min(min, goalVal); max = Math.max(max, goalVal); }
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.1;
  const rMin = min - pad, rMax = max + pad;
  const n = data.length;
  const xw = n > 1 ? (w - padL - padR) / (n - 1) : 0;
  const yOf = (v) => h - padB - ((v - rMin) / (rMax - rMin)) * (h - padT - padB);
  const pts = data.map((d, i) => d.value == null ? null : [padL + i * xw, yOf(d.value)]);
  const valid = pts.filter((p) => p);
  const pathD = valid.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const gridVals = [rMin, rMin + (rMax - rMin) * 0.5, rMax];
  const grid = gridVals.map((v) => `<line x1="${padL}" y1="${yOf(v).toFixed(1)}" x2="${w - padR}" y2="${yOf(v).toFixed(1)}" stroke="var(--borderSoft)"/>
    <text x="2" y="${(yOf(v) + 3).toFixed(1)}" font-size="10" fill="var(--textFaint)">${Math.round(v)}</text>`).join("");
  const xLabels = data.map((d, i) => (i % 3 === 0 ? `<text x="${(padL + i * xw).toFixed(1)}" y="${h - 6}" font-size="10" fill="var(--textFaint)" text-anchor="middle">${esc(d.label)}</text>` : "")).join("");
  const goalLine = goalVal != null ? `<line x1="${padL}" y1="${yOf(goalVal).toFixed(1)}" x2="${w - padR}" y2="${yOf(goalVal).toFixed(1)}" stroke="var(--textFaint)" stroke-dasharray="4 4"/>` : "";
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:220px;overflow:visible">
    ${grid}${goalLine}
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.2"/>
    ${xLabels}
  </svg>`;
}
function trendChartHTML() {
  const metrics = [
    { key: "calories", label: "Calorias", color: "var(--calories)", goalKey: "calories", dataKey: "kcal" },
    { key: "protein", label: "Proteína", color: "var(--protein)", goalKey: "protein", dataKey: "protein" },
    { key: "carbs", label: "Carboidratos", color: "var(--carbs)", goalKey: "carbs", dataKey: "carbs" },
    { key: "fat", label: "Gordura", color: "var(--fat)", goalKey: "fat", dataKey: "fat" },
  ];
  const active = metrics.find((m) => m.key === state.trendMetric) || metrics[0];
  const data = [];
  const today = new Date();
  const period = state.historyPeriod || 21;
  
  for (let i = period - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dateKey(d);
    const day = state.diary[k];
    const t = dayTotals(day);
    data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: day && day.entries.length ? t[active.dataKey] : null });
  }
  const goalVal = state.profile.goals ? state.profile.goals[active.goalKey] : null;

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:6px">
        ${icon("trending-up", 15, "var(--calories)")}
        <div style="font-weight:700;font-size:14.5px">Tendência</div>
      </div>
      <div style="display:flex;gap:4px">
        ${[7, 14, 21, 30, 60, 90].map(p => `<button type="button" class="tab" style="padding:5px 9px" data-action="set-period" data-period="${p}">
          <span style="color:${state.historyPeriod === p ? "var(--calories)" : "var(--textMuted)"};font-weight:700">${p}d</span>
        </button>`).join("")}
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:12px">
      ${metrics.map((m) => `<button type="button" class="tab" style="padding:5px 9px" data-action="trend-set-metric" data-metric="${m.key}">
        <span style="color:${state.trendMetric === m.key ? m.color : "var(--textMuted)"};font-weight:700">${m.label}</span>
      </button>`).join("")}
    </div>
    ${trendChartSVG(data, goalVal, active.color)}
  </div>`;
}

function insightsGridHTML() {
  const keys = Object.keys(state.diary).filter((k) => state.diary[k].entries.length > 0).sort();
  if (!keys.length) return `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Registre alguns dias para ver seus insights aqui.</div>`;

  let streak = 0, cursor = new Date();
  while (true) {
    const k = dateKey(cursor);
    if (state.diary[k] && state.diary[k].entries.length > 0) { streak++; cursor = addDays(cursor, -1); } else break;
  }
  const goals = state.profile.goals;
  const period = state.historyPeriod || 21;
  const periodKeys = keys.filter((k) => (new Date() - parseKey(k)) / 86400000 <= period);
  
  let onTarget = 0, calSum = 0, calCount = 0, proteinSum = 0, carbsSum = 0, fatSum = 0;
  const foodCount = {};
  const weekdayScores = Array.from({ length: 7 }, () => []);
  
  periodKeys.forEach((k) => {
    const day = state.diary[k];
    const t = dayTotals(day);
    calSum += t.kcal; calCount++;
    proteinSum += t.protein;
    carbsSum += t.carbs;
    fatSum += t.fat;
    if (goals && goals.calories && Math.abs(t.kcal - goals.calories) / goals.calories <= 0.1) onTarget++;
    day.entries.forEach((e) => { const n = e.name.trim(); foodCount[n] = (foodCount[n] || 0) + 1; });
    const s = dayScore(day, goals);
    if (s != null) weekdayScores[parseKey(k).getDay()].push(s);
  });
  
  const topFood = Object.entries(foodCount).sort((a, b) => b[1] - a[1])[0];
  const avgCal = calCount ? calSum / calCount : 0;
  const avgProtein = calCount ? proteinSum / calCount : 0;
  const avgCarbs = calCount ? carbsSum / calCount : 0;
  const avgFat = calCount ? fatSum / calCount : 0;
  const adherence = periodKeys.length ? Math.round((onTarget / periodKeys.length) * 100) : 0;
  const weekdayAvg = weekdayScores.map((arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null));
  let bestDay = null, bestVal = -1;
  weekdayAvg.forEach((v, i) => { if (v != null && v > bestVal) { bestVal = v; bestDay = i; } });

  const cards = [
    { label: "Sequência atual", value: `${streak} ${streak === 1 ? "dia" : "dias"}`, iconName: "flame" },
    { label: `Média de calorias (${period}d)`, value: `${Math.round(avgCal)} kcal`, iconName: "trending-up" },
    { label: `Aderência à meta (${period}d)`, value: goals ? `${adherence}%` : "defina metas", iconName: "sparkles" },
    { label: `Média de proteína (${period}d)`, value: `${Math.round(avgProtein)}g`, iconName: "protein" },
    { label: `Média de carboidratos (${period}d)`, value: `${Math.round(avgCarbs)}g`, iconName: "carbs" },
    { label: `Média de gordura (${period}d)`, value: `${Math.round(avgFat)}g`, iconName: "fat" },
  ];
  if (bestDay != null) cards.push({ label: "Melhor dia da semana", value: FULL_WEEKDAYS[bestDay], iconName: "check", cap: true });
  if (topFood) cards.push({ label: "Alimento mais registrado", value: `${topFood[0]} (${topFood[1]}x)`, iconName: "list-plus" });

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px">
    ${cards.map((c) => `<div class="card" style="padding:12px 14px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        ${icon(c.iconName, 13, "var(--calories)")}
        <div style="font-size:11px;color:var(--textMuted)">${esc(c.label)}</div>
      </div>
      <div class="mono" style="font-size:15px;font-weight:700;${c.cap ? "text-transform:capitalize" : ""}">${esc(c.value)}</div>
    </div>`).join("")}
  </div>`;
}

/* ---------------- Alimentos (biblioteca) ---------------- */
function getAllRegisteredFoods() {
  const all = [];
  Object.values(state.diary).forEach((day) => {
    day.entries.forEach((e) => {
      const n = normalize(e.name);
      if (!all.find(f => normalize(f.name) === n)) {
        all.push({
          name: e.name,
          per100: e.per100,
          count: 1,
          lastUsed: e.time
        });
      } else {
        const existing = all.find(f => normalize(f.name) === n);
        existing.count++;
        if (e.time > existing.lastUsed) existing.lastUsed = e.time;
      }
    });
  });
  return all.sort((a, b) => b.lastUsed - a.lastUsed);
}

function updateHistoryFoodMacros(foodName, newPer100) {
  Object.keys(state.diary).forEach(key => {
    const day = state.diary[key];
    day.entries.forEach((e, index) => {
      if (normalize(e.name) === normalize(foodName)) {
        const g = e.grams;
        state.diary[key].entries[index] = {
          ...e,
          per100: newPer100,
          kcal: (newPer100.kcal * g) / 100,
          protein: (newPer100.protein * g) / 100,
          carbs: (newPer100.carbs * g) / 100,
          fat: (newPer100.fat * g) / 100
        };
      }
    });
  });
  persist(STORAGE_KEYS.diary, state.diary);
}

function updateHistoryFoodName(oldName, newName) {
  Object.keys(state.diary).forEach(key => {
    const day = state.diary[key];
    day.entries.forEach((e, index) => {
      if (normalize(e.name) === normalize(oldName)) {
        state.diary[key].entries[index] = {
          ...e,
          name: newName
        };
      }
    });
  });
  persist(STORAGE_KEYS.diary, state.diary);
}

function libraryViewHTML() {
  const q = normalize(state.lib.query);
  const libraryList = Object.values(state.library).filter((f) => !q || normalize(f.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  const registeredList = getAllRegisteredFoods().filter((f) => !q || normalize(f.name).includes(q));
  
  const isEditingHistory = state.lib.editingHistory !== null;
  const editingFood = isEditingHistory ? registeredList.find(f => normalize(f.name) === normalize(state.lib.editingHistory)) : null;
  
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Biblioteca de alimentos</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Seus alimentos base (valores por 100g).</div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <div style="position:relative;flex:1">
          <span style="position:absolute;left:10px;top:10px">${icon("search", 14, "var(--textFaint)")}</span>
          <input class="input" style="padding-left:30px" placeholder="Buscar alimento" value="${esc(state.lib.query)}" data-action="lib-search-input"/>
        </div>
        <button class="btn btn-primary" data-action="lib-toggle-add">${icon("plus", 15)} Novo</button>
      </div>
      ${state.lib.adding ? `<div class="card" style="padding:14px;margin-bottom:14px;background:var(--surface2)">
        <div style="font-size:12px;color:var(--textMuted);margin-bottom:8px">Valores por 100g</div>
        <div style="display:grid;grid-template-columns:2fr repeat(4,1fr);gap:6px;margin-bottom:10px">
          <input class="input" placeholder="Nome" value="${esc(state.lib.form.name)}" data-action="lib-form-input" data-field="name"/>
          <input class="input" placeholder="kcal" type="number" value="${esc(state.lib.form.kcal)}" data-action="lib-form-input" data-field="kcal"/>
          <input class="input" placeholder="prot." type="number" value="${esc(state.lib.form.protein)}" data-action="lib-form-input" data-field="protein"/>
          <input class="input" placeholder="carb." type="number" value="${esc(state.lib.form.carbs)}" data-action="lib-form-input" data-field="carbs"/>
          <input class="input" placeholder="gord." type="number" value="${esc(state.lib.form.fat)}" data-action="lib-form-input" data-field="fat"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="lib-submit">${state.lib.editingId ? "Salvar alterações" : "Adicionar"}</button>
          <button class="btn" data-action="lib-cancel-add">Cancelar</button>
        </div>
      </div>` : ""}
      ${libraryList.length === 0 ? `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Nenhum alimento na biblioteca. Adicione alimentos que você usa frequentemente.</div>`
        : `<div class="card" style="padding:4px">
          ${libraryList.map((f) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--borderSoft)">
            <div style="flex:1">
              <div style="font-size:13.5px;font-weight:600">${esc(f.name)}</div>
              <div class="mono" style="font-size:11px;color:var(--textMuted);margin-top:2px">${Math.round(f.kcal)} kcal · P${round(f.protein)}g C${round(f.carbs)}g G${round(f.fat)}g /100g</div>
            </div>
            <button class="btn btn-icon" data-action="lib-edit" data-id="${f.id}">${icon("pencil", 13)}</button>
            <button class="btn btn-icon" data-action="lib-delete" data-id="${f.id}">${icon("trash", 13, "var(--over)")}</button>
          </div>`).join("")}
        </div>`}
    </div>
    
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Histórico de alimentos</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Todos os alimentos que você já registrou. Edite macros para atualizar todos os registros.</div>
      ${isEditingHistory && editingFood ? `<div class="card" style="padding:14px;margin-bottom:14px;background:var(--surface2)">
        <div style="font-size:12px;color:var(--textMuted);margin-bottom:8px">Editando: ${esc(editingFood.name)} (atualiza todos os registros)</div>
        <div style="display:grid;grid-template-columns:2fr repeat(4,1fr);gap:6px;margin-bottom:10px">
          <input class="input" placeholder="Nome" value="${esc(state.lib.form.name)}" data-action="lib-form-input" data-field="name"/>
          <input class="input" placeholder="kcal" type="number" value="${esc(state.lib.form.kcal)}" data-action="lib-form-input" data-field="kcal"/>
          <input class="input" placeholder="prot." type="number" value="${esc(state.lib.form.protein)}" data-action="lib-form-input" data-field="protein"/>
          <input class="input" placeholder="carb." type="number" value="${esc(state.lib.form.carbs)}" data-action="lib-form-input" data-field="carbs"/>
          <input class="input" placeholder="gord." type="number" value="${esc(state.lib.form.fat)}" data-action="lib-form-input" data-field="fat"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="lib-save-history">Salvar e atualizar histórico</button>
          <button class="btn" data-action="lib-cancel-history">Cancelar</button>
        </div>
      </div>` : ""}
      ${registeredList.length === 0 ? `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Nenhum alimento registrado ainda.</div>`
        : `<div class="card" style="padding:4px">
          ${registeredList.map((f) => {
            const inLibrary = Object.values(state.library).find(l => normalize(l.name) === normalize(f.name));
            return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--borderSoft)">
              <div style="flex:1">
                <div style="font-size:13.5px;font-weight:600">${esc(f.name)}</div>
                <div class="mono" style="font-size:11px;color:var(--textMuted);margin-top:2px">
                  ${f.per100 ? `${Math.round(f.per100.kcal)} kcal/100g · P${round(f.per100.protein)}g C${round(f.per100.carbs)}g G${round(f.per100.fat)}g` : "Sem dados nutricionais"} · Registrado ${f.count}x
                </div>
              </div>
              ${inLibrary ? `<span style="font-size:11px;color:var(--good)">Na biblioteca</span>` : `
                <button class="btn" style="font-size:11px;padding:6px 10px" data-action="lib-add-from-history" data-name="${esc(f.name)}">Adicionar à biblioteca</button>
              `}
              <button class="btn btn-icon" data-action="lib-edit-history" data-name="${esc(f.name)}">${icon("pencil", 13)}</button>
            </div>`;
          }).join("")}
        </div>`}
    </div>
  </div>`;
}

/* ---------------- Metas (settings) ---------------- */
function ensureGoalsForm() {
  if (!state.goalsForm) {
    const g = state.profile.goals || { calories: "", protein: "", carbs: "", fat: "" };
    state.goalsForm = { calories: g.calories || "", protein: g.protein || "", carbs: g.carbs || "", fat: g.fat || "" };
  }
}
function ensureBiometricsForm() {
  if (!state.biometricsForm) {
    const b = state.profile.biometrics || { weight: null, height: null, age: null, gender: null, activityLevel: null };
    state.biometricsForm = { 
      weight: b.weight || "", 
      height: b.height || "", 
      age: b.age || "", 
      gender: b.gender || "", 
      activityLevel: b.activityLevel || "" 
    };
  }
}
function settingsViewHTML() {
  ensureGoalsForm();
  ensureBiometricsForm();
  
  const form = state.goalsForm;
  const bio = state.biometricsForm;
  
  const calFromMacros = (parseFloat(form.protein) || 0) * 4 + (parseFloat(form.carbs) || 0) * 4 + (parseFloat(form.fat) || 0) * 9;
  const calGoal = parseFloat(form.calories) || 0;
  const diff = calGoal ? Math.round(((calFromMacros - calGoal) / calGoal) * 100) : 0;
  const showWarn = calGoal > 0 && calFromMacros > 0 && Math.abs(diff) > 8;

  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Dados biológicos</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Usado para calcular TDEE e sugerir metas.</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px">
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Peso (kg)</div>
          <input class="input" type="number" value="${esc(bio.weight)}" data-action="bio-input" data-field="weight"/></div>
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Altura (cm)</div>
          <input class="input" type="number" value="${esc(bio.height)}" data-action="bio-input" data-field="height"/></div>
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Idade</div>
          <input class="input" type="number" value="${esc(bio.age)}" data-action="bio-input" data-field="age"/></div>
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Gênero</div>
          <select class="input" data-action="bio-input" data-field="gender">
            <option value="">Selecione</option>
            <option value="male" ${bio.gender === "male" ? "selected" : ""}>Masculino</option>
            <option value="female" ${bio.gender === "female" ? "selected" : ""}>Feminino</option>
          </select></div>
      </div>
      <div style="margin-bottom:10px">
        <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Nível de atividade</div>
        <select class="input" data-action="bio-input" data-field="activityLevel">
          <option value="">Selecione</option>
          ${ACTIVITY_LEVELS.map(l => `<option value="${l.id}" ${bio.activityLevel === l.id ? "selected" : ""}>${l.label} (${l.multiplier}x)</option>`).join("")}
        </select>
      </div>
      ${(() => {
        const bmr = calculateBMR(bio.weight, bio.height, bio.age, bio.gender);
        const tdee = calculateTDEE(bmr, bio.activityLevel);
        return bmr ? `<div style="font-size:12px;color:var(--textMuted);margin-bottom:10px">
          <div>BMR: ${Math.round(bmr)} kcal/dia</div>
          ${tdee ? `<div>TDEE: ${tdee} kcal/dia (manutenção)</div>` : ""}
        </div>` : "";
      })()}
      <button class="btn btn-primary" data-action="bio-save">Salvar dados biológicos</button>
    </div>
    
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Metas diárias</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Configure suas metas de calorias e macronutrientes.</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px">
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Calorias (kcal)</div>
          <input class="input" type="number" value="${esc(form.calories)}" data-action="goal-input" data-field="calories" placeholder="2000"/></div>
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Proteína (g)</div>
          <input class="input" type="number" value="${esc(form.protein)}" data-action="goal-input" data-field="protein" placeholder="150"/></div>
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Carboidratos (g)</div>
          <input class="input" type="number" value="${esc(form.carbs)}" data-action="goal-input" data-field="carbs" placeholder="200"/></div>
        <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Gordura (g)</div>
          <input class="input" type="number" value="${esc(form.fat)}" data-action="goal-input" data-field="fat" placeholder="65"/></div>
      </div>
      ${calFromMacros > 0 ? `<div style="font-size:12px;color:${showWarn ? "var(--over)" : "var(--textMuted)"};display:flex;align-items:center;gap:6px;margin-bottom:10px">
        ${showWarn ? icon("alert-triangle", 13) : ""}
        Seus macros somam ${Math.round(calFromMacros)} kcal${calGoal > 0 ? ` (${diff > 0 ? "+" : ""}${diff}% da meta de calorias)` : ""}
      </div>` : ""}
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-primary" data-action="goals-save">Salvar metas</button>
        ${state.goalsSaved ? `<span style="font-size:12.5px;color:var(--good)">metas salvas</span>` : ""}
      </div>
    </div>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Acompanhamento extra</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:14px">Opcional — ative só o que fizer sentido pra você.</div>
      ${[["trackWeight", "Peso corporal"], ["trackWater", "Consumo de água"], ["trackWorkout", "Treino do dia"]].map(([key, label]) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--borderSoft)">
          <span style="font-size:13.5px">${label}</span>
          ${toggleSwitch(state.profile.settings[key], "settings-toggle", key)}
        </div>`).join("")}
    </div>
  </div>`;
}

function configViewHTML() {
  const today = state.diary[todayKey()] || emptyDay();
  const grouped = groupEntriesByMeal(today);
  const completedMeals = Object.keys(grouped).filter(mealType => grouped[mealType].length > 0).length;
  const totalMealTypes = MEAL_TYPES.length;
  const mealProgress = (completedMeals / totalMealTypes) * 100;
  
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Progresso do dia</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Refeições registradas hoje.</div>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
          <span style="color:var(--text);font-weight:600">${completedMeals}/${totalMealTypes} refeições</span>
          <span class="mono" style="color:var(--textMuted)">${Math.round(mealProgress)}%</span>
        </div>
        <div style="height:8px;border-radius:4px;background:var(--surface2);overflow:hidden">
          <div style="width:${mealProgress}%;height:100%;background:var(--calories);transition:width .3s ease"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(80px, 1fr));gap:8px">
        ${MEAL_TYPES.map(mt => {
          const hasItems = grouped[mt.id].length > 0;
          return `<div style="text-align:center;padding:8px;border-radius:6px;background:${hasItems ? "var(--surface2)" : "transparent"}">
            <div style="font-size:16px;margin-bottom:4px">${icon(mt.icon, 16, hasItems ? "var(--calories)" : "var(--textFaint)")}</div>
            <div style="font-size:10px;color:${hasItems ? "var(--text)" : "var(--textFaint)"}">${esc(mt.label)}</div>
          </div>`;
        }).join("")}
      </div>
    </div>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Importar/Exportar dados</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Faça backup dos seus dados ou importe de outro dispositivo.</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn" data-action="export-data">${icon("download", 14)} Exportar JSON</button>
        <button class="btn" data-action="show-import">${icon("upload", 14)} Importar JSON</button>
      </div>
      ${state.importExport.showImport ? `<div style="margin-bottom:12px">
        <textarea class="input" placeholder="Cole o JSON aqui..." style="min-height:120px;font-family:monospace;font-size:12px" data-action="import-text-input">${esc(state.importExport.importData)}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" data-action="import-data">Importar</button>
          <button class="btn" data-action="cancel-import">Cancelar</button>
        </div>
      </div>` : ""}
    </div>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Importar refeição</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Importe uma refeição específica de um arquivo JSON.</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn" data-action="show-meal-import">${icon("upload", 14)} Importar refeição</button>
      </div>
      ${state.importExport.showMealImport ? `<div style="margin-bottom:12px">
        <div style="font-size:11px;color:var(--textFaint);margin-bottom:6px">Formato esperado:</div>
        <pre style="background:var(--surface2);padding:8px;border-radius:6px;font-size:10px;color:var(--textMuted);margin-bottom:8px;overflow-x:auto">{
  "mealType": "almoco",
  "mealName": "Almoço",
  "items": [
    {
      "name": "Arroz",
      "grams": 100,
      "kcal": 130,
      "protein": 2.7,
      "carbs": 28,
      "fat": 0.3
    }
  ]
}</pre>
        <textarea class="input" placeholder="Cole o JSON da refeição aqui..." style="min-height:120px;font-family:monospace;font-size:12px" data-action="meal-import-text-input">${esc(state.importExport.mealImportData)}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" data-action="import-meal">Importar refeição</button>
          <button class="btn" data-action="cancel-meal-import">Cancelar</button>
        </div>
      </div>` : ""}
    </div>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Sobre o app</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:8px">Painel Nutricional v2.1</div>
      <div style="font-size:11px;color:var(--textFaint)">Rastreamento de calorias e macronutrientes com organização por refeições.</div>
    </div>
    <div class="card" style="padding:16px;border-color:var(--over)">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px;color:var(--over)">Zona de risco</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Apaga permanentemente metas, biblioteca e histórico.</div>
      ${state.confirmDelete ? `<div style="display:flex;gap:8px">
        <button class="btn" style="background:var(--over);border-color:var(--over);color:#fff" data-action="reset-confirm">Confirmar exclusão</button>
        <button class="btn" data-action="reset-cancel">Cancelar</button>
      </div>` : `<button class="btn" data-action="reset-ask">Apagar todos os dados</button>`}
    </div>
  </div>`;
}

/* ---------------- app shell ---------------- */
const TABS = [{ id: "hoje", label: "Hoje" }, { id: "historico", label: "Histórico" }, { id: "alimentos", label: "Alimentos" }, { id: "metas", label: "Metas" }, { id: "config", label: "Configurações" }];

function hojeTabHTML() {
  const goals = state.profile.goals;
  if (!goals) {
    return `<div class="card" style="padding:28px;text-align:center">
      ${icon("sparkles", 22, "var(--calories)", "margin:0 auto 10px")}
      <div style="font-weight:700;font-size:15.5px;margin-bottom:6px">Defina suas metas para começar</div>
      <div style="font-size:13px;color:var(--textMuted);margin-bottom:16px">Configure calorias, proteína, carboidratos e gordura na aba Metas.</div>
      <button class="btn btn-primary" data-action="set-tab" data-tab="metas">Ir para Metas</button>
    </div>`;
  }
  const today = state.diary[todayKey()] || emptyDay();
  const totals = dayTotals(today);
  
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:18px">
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        ${circularGauge(totals.kcal, goals.calories, "var(--calories)", 148, totals.kcal > goals.calories ? "acima da meta" : "consumidas", "kcal")}
        <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:12px">
          ${macroBar("Proteína", totals.protein, goals.protein, "var(--protein)")}
          ${macroBar("Carboidratos", totals.carbs, goals.carbs, "var(--carbs)")}
          ${macroBar("Gordura", totals.fat, goals.fat, "var(--fat)")}
        </div>
      </div>
      <div style="font-size:12px;margin-top:12px;color:${totals.kcal > goals.calories ? "var(--over)" : "var(--textFaint)"}">
        ${totals.kcal > goals.calories ? `${Math.round(totals.kcal - goals.calories)} kcal acima da meta de hoje` : `restam ${Math.round(goals.calories - totals.kcal)} kcal hoje`}
      </div>
    </div>
    <div class="card" style="padding:18px;display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      ${macroDonut(goals.protein, goals.carbs, goals.fat)}
      <div style="flex:1;min-width:160px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">Distribuição da meta</div>
        ${[["Proteína", "var(--protein)"], ["Carboidratos", "var(--carbs)"], ["Gordura", "var(--fat)"]].map(([n, c]) => `
          <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-bottom:4px">
            <div style="width:8px;height:8px;border-radius:2px;background:${c}"></div>
            <span style="color:var(--textMuted)">${n}</span>
          </div>`).join("")}
      </div>
    </div>
    ${extrasBarHTML(state.profile.settings, today)}
    ${quickAddFormHTML()}
    ${todayEntriesHTML(today)}
  </div>`;
}

function weightTrendHTML() {
  if (!state.profile.settings.trackWeight) return "";
  
  const period = state.historyPeriod || 21;
  const weightData = [];
  const today = new Date();
  
  for (let i = period - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dateKey(d);
    const day = state.diary[k];
    if (day && day.weight) {
      weightData.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: day.weight });
    }
  }
  
  if (weightData.length < 2) return "";
  
  const weights = weightData.map(d => d.value);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const weightChange = weights[weights.length - 1] - weights[0];
  
  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
      ${icon("dumbbell", 15, "var(--fat)")}
      <div style="font-weight:700;font-size:14.5px">Evolução de peso</div>
    </div>
    ${trendChartSVG(weightData, null, "var(--fat)")}
    <div style="display:flex;gap:12px;margin-top:8px;font-size:12px;color:var(--textMuted)">
      <span>Início: ${minW}kg</span>
      <span>Atual: ${maxW}kg</span>
      <span style="color:${weightChange > 0 ? 'var(--over)' : 'var(--good)'}">${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg</span>
    </div>
  </div>`;
}

function macroDistributionHTML() {
  const goals = state.profile.goals;
  if (!goals) return "";
  
  const period = state.historyPeriod || 21;
  const periodKeys = Object.keys(state.diary).filter((k) => 
    state.diary[k].entries.length > 0 && (new Date() - parseKey(k)) / 86400000 <= period
  );
  
  if (periodKeys.length === 0) return "";
  
  let totalProtein = 0, totalCarbs = 0, totalFat = 0;
  periodKeys.forEach(k => {
    const t = dayTotals(state.diary[k]);
    totalProtein += t.protein;
    totalCarbs += t.carbs;
    totalFat += t.fat;
  });
  
  const avgProtein = totalProtein / periodKeys.length;
  const avgCarbs = totalCarbs / periodKeys.length;
  const avgFat = totalFat / periodKeys.length;
  
  const pPct = goals.protein > 0 ? (avgProtein / goals.protein) * 100 : 0;
  const cPct = goals.carbs > 0 ? (avgCarbs / goals.carbs) * 100 : 0;
  const fPct = goals.fat > 0 ? (avgFat / goals.fat) * 100 : 0;
  
  return `<div class="card" style="padding:16px">
    <div style="font-weight:700;font-size:14.5px;margin-bottom:12px">Distribuição média de macros (${period}d)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:8px">
        <div style="font-size:24px;font-weight:700;color:var(--protein)">${Math.round(avgProtein)}g</div>
        <div style="font-size:11px;color:var(--textMuted);margin-top:4px">Proteína</div>
        <div style="font-size:10px;color:${pPct >= 100 ? 'var(--good)' : 'var(--calories)'};margin-top:2px">${Math.round(pPct)}% da meta</div>
      </div>
      <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:8px">
        <div style="font-size:24px;font-weight:700;color:var(--carbs)">${Math.round(avgCarbs)}g</div>
        <div style="font-size:11px;color:var(--textMuted);margin-top:4px">Carboidratos</div>
        <div style="font-size:10px;color:${cPct >= 100 ? 'var(--good)' : 'var(--calories)'};margin-top:2px">${Math.round(cPct)}% da meta</div>
      </div>
      <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:8px">
        <div style="font-size:24px;font-weight:700;color:var(--fat)">${Math.round(avgFat)}g</div>
        <div style="font-size:11px;color:var(--textMuted);margin-top:4px">Gordura</div>
        <div style="font-size:10px;color:${fPct >= 100 ? 'var(--good)' : 'var(--calories)'};margin-top:2px">${Math.round(fPct)}% da meta</div>
      </div>
    </div>
  </div>`;
}

function historicoTabHTML() {
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:12px">Análise de período</div>
      ${trendChartHTML()}
    </div>
    ${macroDistributionHTML()}
    ${weightTrendHTML()}
    ${insightsGridHTML()}
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:12px">Calendário</div>
      ${calendarMonthHTML()}
    </div>
    ${dayDetailHTML()}
  </div>`;
}

function appHTML() {
  return `
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">
      <div style="font-size:19px;font-weight:700;letter-spacing:-0.01em">painel nutricional</div>
      <div class="mono" style="font-size:11.5px;color:var(--textFaint);text-transform:capitalize">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
    </div>
    <div style="display:flex;gap:18px;border-bottom:1px solid var(--border);margin-bottom:18px;overflow-x:auto">
      ${TABS.map((t) => `<button type="button" class="tab ${state.tab === t.id ? "active" : ""}" data-action="set-tab" data-tab="${t.id}">${t.label}</button>`).join("")}
    </div>
    ${state.tab === "hoje" ? hojeTabHTML() : ""}
    ${state.tab === "historico" ? historicoTabHTML() : ""}
    ${state.tab === "alimentos" ? libraryViewHTML() : ""}
    ${state.tab === "metas" ? settingsViewHTML() : ""}
    ${state.tab === "config" ? configViewHTML() : ""}
  `;
}

/* ---------------- render com otimização ---------------- */
const root = document.getElementById("root");
let renderTimeout = null;
let isTextInputActive = false;

function scheduleRender() {
  if (renderTimeout) return;
  renderTimeout = requestAnimationFrame(() => {
    renderTimeout = null;
    render();
  });
}

function render() {
  if (isTextInputActive) return;
  
  const active = document.activeElement;
  const activeId = active && active.id;
  const selStart = active && "selectionStart" in active ? active.selectionStart : null;
  const selEnd = active && "selectionEnd" in active ? active.selectionEnd : null;
  const action = active && active.dataset.action;
  
  root.innerHTML = appHTML();
  
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      if (selStart != null && el.setSelectionRange) {
        try { el.setSelectionRange(selStart, selEnd); } catch (e) {}
      }
    }
  }
}

/* ---------------- event delegation ---------------- */
root.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  switch (action) {
    case "set-tab":
      state.tab = el.dataset.tab;
      if (state.tab === "metas") { state.goalsForm = null; state.biometricsForm = null; state.goalsSaved = false; state.confirmDelete = false; }
      if (state.tab === "historico") { state.selectedKey = null; }
      if (state.tab === "config") { state.importExport.showImport = false; state.importExport.showMealImport = false; }
      render();
      break;
    case "qa-pick-recent": {
      const item = recentFoods()[Number(el.dataset.index)];
      if (item) { state.qa.name = item.name; state.qa.grams = String(item.grams); state.qa.manualOpen = false; state.qa.showSuggest = false; render(); }
      break;
    }
    case "qa-pick-suggestion": {
      const food = state.library[el.dataset.id];
      if (food) { state.qa.name = food.name; state.qa.manualOpen = false; state.qa.showSuggest = false; render(); }
      break;
    }
    case "qa-meal-select":
      state.qa.mealType = el.dataset.meal; render();
      break;
    case "qa-open-manual":
      state.qa.manualOpen = true; render();
      break;
    case "qa-submit": {
      const name = state.qa.name.trim();
      const grams = parseFloat(state.qa.grams) || 0;
      if (!name || grams <= 0) break;
      const basis = qaBasis();
      let totals, per100, savedNew = false;
      if (basis) {
        totals = { kcal: (basis.kcal * grams) / 100, protein: (basis.protein * grams) / 100, carbs: (basis.carbs * grams) / 100, fat: (basis.fat * grams) / 100 };
        per100 = basis;
      } else {
        const k = parseFloat(state.qa.manual.kcal) || 0;
        if (k <= 0) break;
        totals = { kcal: k, protein: parseFloat(state.qa.manual.protein) || 0, carbs: parseFloat(state.qa.manual.carbs) || 0, fat: parseFloat(state.qa.manual.fat) || 0 };
        per100 = { kcal: (totals.kcal / grams) * 100, protein: (totals.protein / grams) * 100, carbs: (totals.carbs / grams) * 100, fat: (totals.fat / grams) * 100 };
        savedNew = state.qa.saveToLib;
      }
      addEntry({ id: uid(), name, grams, ...totals, per100, time: Date.now() }, savedNew);
      state.qa.msg = `${name} adicionado`;
      state.qa = { name: "", grams: "", manualOpen: false, manual: { kcal: "", protein: "", carbs: "", fat: "" }, saveToLib: true, showSuggest: false, msg: state.qa.msg };
      render();
      setTimeout(() => { state.qa.msg = ""; render(); }, 1800);
      break;
    }
    case "entry-edit-start":
      state.entryEdit = { id: el.dataset.id, val: el.dataset.grams };
      render();
      break;
    case "entry-edit-confirm": {
      const v = parseFloat(state.entryEdit.val);
      editEntryGrams(el.dataset.id, isNaN(v) ? Number(el.dataset.fallback) : v);
      state.entryEdit = { id: null, val: "" };
      render();
      break;
    }
    case "entry-edit-cancel":
      state.entryEdit = { id: null, val: "" };
      render();
      break;
    case "entry-delete":
      deleteEntry(el.dataset.id); render();
      break;
    case "toggle-meal":
      const instanceKey = el.dataset.instanceKey;
      state.expandedMeals[instanceKey] = !state.expandedMeals[instanceKey];
      render();
      break;
    case "extras-water-add": {
      const today = state.diary[todayKey()] || emptyDay();
      updateExtras({ ...today, water: (today.water || 0) + Number(el.dataset.amt) });
      render();
      break;
    }
    case "extras-water-reset": {
      const today = state.diary[todayKey()] || emptyDay();
      updateExtras({ ...today, water: 0 });
      render();
      break;
    }
    case "extras-workout-toggle": {
      const today = state.diary[todayKey()] || emptyDay();
      updateExtras({ ...today, workout: { ...today.workout, done: ev.target.checked } });
      render();
      break;
    }
    case "cal-prev":
      state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1); render();
      break;
    case "cal-next":
      state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1); render();
      break;
    case "cal-select-day":
      state.selectedKey = el.dataset.key; render();
      break;
    case "daydetail-close":
      state.selectedKey = null; render();
      break;
    case "trend-set-metric":
      state.trendMetric = el.dataset.metric; render();
      break;
    case "set-period":
      state.historyPeriod = parseInt(el.dataset.period); render();
      break;
    case "lib-toggle-add":
      state.lib.adding = !state.lib.adding; state.lib.editingId = null; state.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" }; render();
      break;
    case "lib-cancel-add":
      state.lib.adding = false; state.lib.editingId = null; state.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" }; render();
      break;
    case "lib-submit": {
      const f = state.lib.form;
      if (!f.name.trim() || !f.kcal) break;
      upsertFood({ id: state.lib.editingId || uid(), name: f.name.trim(), kcal: parseFloat(f.kcal) || 0, protein: parseFloat(f.protein) || 0, carbs: parseFloat(f.carbs) || 0, fat: parseFloat(f.fat) || 0 });
      state.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" }; state.lib.editingId = null; state.lib.adding = false;
      render();
      break;
    }
    case "lib-edit": {
      const f = state.library[el.dataset.id];
      if (f) { state.lib.editingId = f.id; state.lib.form = { name: f.name, kcal: String(f.kcal), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat) }; state.lib.adding = true; render(); }
      break;
    }
    case "lib-delete":
      deleteFood(el.dataset.id); render();
      break;
    case "lib-add-from-history": {
      const foodName = el.dataset.name;
      const registeredList = getAllRegisteredFoods();
      const food = registeredList.find(f => normalize(f.name) === normalize(foodName));
      if (food && food.per100) {
        state.lib.adding = true;
        state.lib.form = { 
          name: food.name, 
          kcal: String(food.per100.kcal), 
          protein: String(food.per100.protein), 
          carbs: String(food.per100.carbs), 
          fat: String(food.per100.fat) 
        };
        render();
      }
      break;
    }
    case "lib-edit-history": {
      const foodName = el.dataset.name;
      const registeredList = getAllRegisteredFoods();
      const food = registeredList.find(f => normalize(f.name) === normalize(foodName));
      if (food && food.per100) {
        state.lib.editingHistory = foodName;
        state.lib.form = { 
          name: food.name, 
          kcal: String(food.per100.kcal), 
          protein: String(food.per100.protein), 
          carbs: String(food.per100.carbs), 
          fat: String(food.per100.fat) 
        };
        render();
      }
      break;
    }
    case "lib-save-history": {
      if (!state.lib.editingHistory) break;
      const oldName = state.lib.editingHistory;
      const newName = state.lib.form.name.trim();
      const newPer100 = {
        kcal: parseFloat(state.lib.form.kcal) || 0,
        protein: parseFloat(state.lib.form.protein) || 0,
        carbs: parseFloat(state.lib.form.carbs) || 0,
        fat: parseFloat(state.lib.form.fat) || 0
      };
      
      // Se o nome mudou, atualiza todos os registros
      if (normalize(oldName) !== normalize(newName)) {
        updateHistoryFoodName(oldName, newName);
      }
      
      updateHistoryFoodMacros(newName, newPer100);
      state.lib.editingHistory = null;
      state.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" };
      state.qa.msg = "Alimento atualizado em todo o histórico";
      render();
      setTimeout(() => { state.qa.msg = ""; render(); }, 2000);
      break;
    }
    case "lib-cancel-history": {
      state.lib.editingHistory = null;
      state.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" };
      render();
      break;
    }
    case "goals-save": {
      ensureGoalsForm();
      const f = state.goalsForm;
      if (!f.calories || !f.protein || !f.carbs || !f.fat) break;
      saveGoals({ calories: parseFloat(f.calories), protein: parseFloat(f.protein), carbs: parseFloat(f.carbs), fat: parseFloat(f.fat) });
      state.goalsSaved = true; render();
      setTimeout(() => { state.goalsSaved = false; render(); }, 1800);
      break;
    }
    case "bio-save": {
      ensureBiometricsForm();
      const f = state.biometricsForm;
      if (!f.weight || !f.height || !f.age || !f.gender || !f.activityLevel) break;
      saveBiometrics({ 
        weight: parseFloat(f.weight), 
        height: parseFloat(f.height), 
        age: parseFloat(f.age), 
        gender: f.gender, 
        activityLevel: f.activityLevel 
      });
      state.qa.msg = "Dados biológicos salvos";
      render();
      setTimeout(() => { state.qa.msg = ""; render(); }, 1800);
      break;
    }
    case "settings-toggle": {
      const key = el.dataset.key;
      toggleSetting(key, !state.profile.settings[key]); render();
      break;
    }
    case "reset-ask": state.confirmDelete = true; render(); break;
    case "reset-cancel": state.confirmDelete = false; render(); break;
    case "reset-confirm": resetAll(); render(); break;
    case "export-data":
      exportData();
      break;
    case "show-import":
      state.importExport.showImport = true; state.importExport.importData = ""; render();
      break;
    case "cancel-import":
      state.importExport.showImport = false; state.importExport.importData = ""; render();
      break;
    case "import-data":
      importData();
      break;
    case "show-meal-import":
      state.importExport.showMealImport = true; state.importExport.mealImportData = ""; render();
      break;
    case "cancel-meal-import":
      state.importExport.showMealImport = false; state.importExport.mealImportData = ""; render();
      break;
    case "import-meal":
      importMeal();
      break;
    case "export-meal":
      exportMeal(el.dataset.meal, todayKey());
      break;
    case "export-meal-instance":
      exportMealInstance(el.dataset.instanceId, el.dataset.meal, todayKey());
      break;
  }
});

root.addEventListener("input", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  
  isTextInputActive = true;
  
  switch (action) {
    case "qa-name-input":
      state.qa.name = el.value; state.qa.showSuggest = true;
      if (qaBasis()) state.qa.manualOpen = false;
      if (state.qa.showSuggest) {
        scheduleRender();
      }
      break;
    case "qa-grams-input":
      state.qa.grams = el.value;
      const computed = qaComputed();
      if (computed) {
        scheduleRender();
      }
      break;
    case "qa-manual-input":
      state.qa.manual[el.dataset.field] = el.value;
      scheduleRender();
      break;
    case "entry-edit-input":
      state.entryEdit.val = el.value;
      scheduleRender();
      break;
    case "extras-weight-input":
      break;
    case "lib-search-input":
      state.lib.query = el.value;
      scheduleRender();
      break;
    case "lib-form-input":
      state.lib.form[el.dataset.field] = el.value;
      scheduleRender();
      break;
    case "goal-input":
      ensureGoalsForm(); state.goalsForm[el.dataset.field] = el.value;
      scheduleRender();
      break;
    case "bio-input":
      ensureBiometricsForm(); state.biometricsForm[el.dataset.field] = el.value;
      scheduleRender();
      break;
    case "import-text-input":
      state.importExport.importData = el.value;
      break;
    case "meal-import-text-input":
      state.importExport.mealImportData = el.value;
      break;
  }
  
  setTimeout(() => { isTextInputActive = false; }, 100);
});

root.addEventListener("change", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  if (el.dataset.action === "qa-savelib-toggle") { state.qa.saveToLib = el.checked; render(); }
  if (el.dataset.action === "extras-weight-input") {
    const today = state.diary[todayKey()] || emptyDay();
    const v = parseFloat(el.value);
    updateExtras({ ...today, weight: isNaN(v) ? null : v });
    render();
  }
});

let suggestTimeout = null;
root.addEventListener("focusin", (ev) => {
  const el = ev.target.closest("[data-action='qa-name-input']");
  if (el) { 
    state.qa.showSuggest = true; 
    scheduleRender();
  }
});
root.addEventListener("focusout", (ev) => {
  const el = ev.target.closest("[data-action='qa-name-input']");
  if (el) { 
    if (suggestTimeout) clearTimeout(suggestTimeout);
    suggestTimeout = setTimeout(() => { 
      if (!document.querySelector(".suggest:hover")) {
        state.qa.showSuggest = false; 
        scheduleRender();
      }
    }, 250);
  }
});

/* ---------------- init ---------------- */
const loaded = loadAll();
state.profile = loaded.profile; state.library = loaded.library; state.diary = loaded.diary;

// Migrar dados antigos para nova estrutura (remover redundância meals)
Object.keys(state.diary).forEach(key => {
  const day = state.diary[key];
  if (day.meals) {
    // Remover redundância meals - usar apenas entries
    delete state.diary[key].meals;
    persist(STORAGE_KEYS.diary, state.diary);
  }
});

render();
