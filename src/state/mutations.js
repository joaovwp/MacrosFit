import { MEAL_TYPES, VALIDATION_LIMITS } from '../core/constants.js';
import { persist } from '../core/storage.js';
import { dateKey, emptyDay, normalize, uid } from '../core/utils.js';

const DEFAULT_PROFILE = {
  goals: null,
  settings: { trackWeight: false, trackWater: false, trackWorkout: false },
  biometrics: { weight: null, height: null, birthDate: null, gender: null, activityLevel: null }
};

export async function updateDiaryDay(state, key, updater) {
  const next = { ...state.diary, [key]: updater(state.diary[key] || emptyDay()) };
  state.diary = next;
  try {
    await persist('diary', next);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
  }
}

export function todayKey() {
  return dateKey(new Date());
}

export async function addEntry(state, entry, saveToLib, targetDate) {
  const date = targetDate || todayKey();
  await updateDiaryDay(state, date, (day) => {
    const updatedEntry = { ...entry, mealType: state.qa.mealType };
    return { ...day, entries: [...day.entries, updatedEntry] };
  });
  if (saveToLib) {
    const food = { id: uid(), name: entry.name, ...entry.per100, is_active: true };
    state.library = { ...state.library, [food.id]: food };
    try {
      await persist('library', state.library);
      state.connectionError = null;
    } catch (e) {
      state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
    }
  }
}

export async function deleteEntry(state, id) {
  await updateDiaryDay(state, todayKey(), (day) => {
    const updatedEntries = day.entries.filter((e) => e.id !== id);
    return { ...day, entries: updatedEntries };
  });
}

export async function editEntryGrams(state, id, newGrams) {
  await updateDiaryDay(state, todayKey(), (day) => ({
    ...day,
    entries: day.entries.map((e) => {
      if (e.id !== id) return e;
      const p = e.per100;
      return { ...e, grams: newGrams, kcal: (p.kcal * newGrams) / 100, protein: (p.protein * newGrams) / 100, carbs: (p.carbs * newGrams) / 100, fat: (p.fat * newGrams) / 100 };
    }),
  }));
}

export async function updateExtras(state, newDay) {
  await updateDiaryDay(state, todayKey(), () => newDay);
}

export async function upsertFood(state, food) {
  state.library = { ...state.library, [food.id]: food };
  try {
    await persist('library', state.library);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
  }
}

export async function deleteFood(state, id) {
  const next = { ...state.library };
  delete next[id];
  state.library = next;
  try {
    await persist('library', next);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
  }
}

export async function saveGoals(state, goals) {
  state.profile = { ...state.profile, goals };
  try {
    await persist('profile', state.profile);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
  }
}

export async function saveBiometrics(state, biometrics) {
  state.profile = { ...state.profile, biometrics };
  try {
    await persist('profile', state.profile);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
  }
}

export async function toggleSetting(state, key, val) {
  state.profile = { ...state.profile, settings: { ...state.profile.settings, [key]: val } };
  try {
    await persist('profile', state.profile);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro de conexão. Suas alterações foram salvas localmente.';
  }
}

export async function resetAll(state) {
  await persist('profile', DEFAULT_PROFILE);
  await persist('library', {});
  await persist('diary', {});
  state.profile = DEFAULT_PROFILE;
  state.library = {};
  state.diary = {};
  state.tab = "hoje";
  state.confirmDelete = false;
  state.qa = {
    name: "",
    grams: "",
    mealType: "cafe",
    targetDate: null,
    manualOpen: false,
    manual: { kcal: "", protein: "", carbs: "", fat: "" },
    saveToLib: true,
    showSuggest: false,
    msg: ""
  };
}

export function exportData(state) {
  const data = {
    schemaVersion: "3.0",
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

export async function importData(state) {
  try {
    const data = JSON.parse(state.importExport.importData);

    // Validar schemaVersion
    if (!data.schemaVersion || typeof data.schemaVersion !== 'string') {
      throw new Error('Versão do schema inválida');
    }

    // Validar tipos de dados
    if (data.profile && typeof data.profile !== 'object') {
      throw new Error('Perfil inválido');
    }

    if (data.library && typeof data.library !== 'object') {
      throw new Error('Biblioteca inválida');
    }

    if (data.diary && typeof data.diary !== 'object') {
      throw new Error('Diário inválido');
    }

    // Validar limites
    if (data.library) {
      for (const [id, food] of Object.entries(data.library)) {
        if (!food || typeof food !== 'object') {
          throw new Error(`Alimento inválido: ${id}`);
        }
        if (typeof food.kcal !== 'number' || food.kcal < 0 || food.kcal > VALIDATION_LIMITS.KCAL_MAX) {
          throw new Error(`Calorias inválidas para: ${food.name || id}`);
        }
        if (typeof food.protein !== 'number' || food.protein < 0 || food.protein > VALIDATION_LIMITS.MACRO_MAX) {
          throw new Error(`Proteína inválida para: ${food.name || id}`);
        }
        if (typeof food.carbs !== 'number' || food.carbs < 0 || food.carbs > VALIDATION_LIMITS.MACRO_MAX) {
          throw new Error(`Carboidratos inválidos para: ${food.name || id}`);
        }
        if (typeof food.fat !== 'number' || food.fat < 0 || food.fat > VALIDATION_LIMITS.MACRO_MAX) {
          throw new Error(`Gordura inválida para: ${food.name || id}`);
        }
      }
    }

    if (data.profile) {
      state.profile = { ...DEFAULT_PROFILE, ...data.profile };
      await persist('profile', state.profile);
    }
    if (data.library) {
      state.library = data.library;
      await persist('library', state.library);
    }
    if (data.diary) {
      state.diary = data.diary;
      await persist('diary', state.diary);
    }
    state.importExport.showImport = false;
    state.importExport.importData = "";
    state.qa.msg = "Dados importados com sucesso!";
  } catch (e) {
    alert("Erro ao importar dados: " + e.message);
  }
}

export function exportMeal(state, mealType, dateKey) {
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
    schemaVersion: "3.0",
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

export function exportMealInstance(state, instanceId, mealType, dateKey) {
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
    schemaVersion: "3.0",
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

export async function importMeal(state) {
  try {
    const mealData = JSON.parse(state.importExport.mealImportData);

    // Validar schemaVersion
    if (!mealData.schemaVersion || typeof mealData.schemaVersion !== 'string') {
      throw new Error('Versão do schema inválida');
    }

    if (!mealData.items || !Array.isArray(mealData.items)) {
      throw new Error("Formato inválido: campo 'items' ausente ou não é array");
    }

    // Validar tipos e limites dos itens
    mealData.items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Item inválido no índice ${index}`);
      }
      if (typeof item.name !== 'string' || !item.name.trim()) {
        throw new Error(`Nome inválido no índice ${index}`);
      }
      if (typeof item.grams !== 'number' || item.grams <= 0 || item.grams > VALIDATION_LIMITS.GRAMS_MAX) {
        throw new Error(`Gramas inválidos para: ${item.name}`);
      }
      if (typeof item.kcal !== 'number' || item.kcal < 0 || item.kcal > VALIDATION_LIMITS.KCAL_MAX) {
        throw new Error(`Calorias inválidas para: ${item.name}`);
      }
      if (typeof item.protein !== 'number' || item.protein < 0 || item.protein > VALIDATION_LIMITS.MACRO_MAX) {
        throw new Error(`Proteína inválida para: ${item.name}`);
      }
      if (typeof item.carbs !== 'number' || item.carbs < 0 || item.carbs > VALIDATION_LIMITS.MACRO_MAX) {
        throw new Error(`Carboidratos inválidos para: ${item.name}`);
      }
      if (typeof item.fat !== 'number' || item.fat < 0 || item.fat > VALIDATION_LIMITS.MACRO_MAX) {
        throw new Error(`Gordura inválida para: ${item.name}`);
      }
    });

    const mealType = mealData.mealType || state.qa.mealType;
    const importInstanceId = Date.now();

    mealData.items.forEach(item => {
      if (item.per100) {
        const existingFood = Object.values(state.library).find(f => normalize(f.name) === normalize(item.name));
        if (!existingFood) {
          const food = { id: uid(), name: item.name, ...item.per100, is_active: true };
          state.library = { ...state.library, [food.id]: food };
        }
      }
    });
    await persist('library', state.library);

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

    await updateDiaryDay(state, todayKey(), () => ({ ...today, entries: updatedEntries }));

    state.importExport.showMealImport = false;
    state.importExport.mealImportData = "";
    state.qa.msg = `Refeição importada com sucesso! (${mealData.items.length} itens)`;
  } catch (e) {
    alert("Erro ao importar refeição: " + e.message);
  }
}

export function getAllRegisteredFoods(state) {
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

export async function updateHistoryFoodMacros(state, foodName, newPer100, recalcHistory) {
  if (recalcHistory) {
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
    await persist('diary', state.diary);
  }
}

export async function updateHistoryFoodName(state, oldName, newName) {
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
  await persist('diary', state.diary);
}

export async function softDeleteFood(state, id) {
  if (state.library[id]) {
    state.library = { ...state.library, [id]: { ...state.library[id], is_active: false } };
    await persist('library', state.library);
  }
}
