import { MEAL_TYPES, VALIDATION_LIMITS } from '../core/constants.js';
import { persist } from '../core/storage.js';
import { dateKey, emptyDay, normalize, uid } from '../core/utils.js';
import * as userFoodsApi from '../api/user_foods.js';
import * as mealsApi from '../api/meals.js';
import * as authApi from '../api/auth.js';
import { mapUserFoodToDB, mapUserFoodFromDB } from '../utils/mapper.js';

const DEFAULT_PROFILE = {
  goals: null,
  biometrics: { weight: null, height: null, birthDate: null, gender: null, activityLevel: null }
};

// Função utilitária para calcular macros finais a partir de valores por 100g
function calculateMacrosFromPer100(grams, per100) {
  if (!per100 || !grams) return null;
  return {
    kcal: (per100.kcal * grams) / 100,
    protein: (per100.protein * grams) / 100,
    carbs: (per100.carbs * grams) / 100,
    fat: (per100.fat * grams) / 100
  };
}

// Função utilitária para calcular valores por 100g a partir de valores finais
function calculatePer100FromFinal(grams, final) {
  if (!final || !grams || grams <= 0) return null;
  return {
    kcal: (final.kcal / grams) * 100,
    protein: (final.protein / grams) * 100,
    carbs: (final.carbs / grams) * 100,
    fat: (final.fat / grams) * 100
  };
}

export function todayKey() {
  return dateKey(new Date());
}

// Criar novo alimento em user_foods
export async function createUserFood(state, foodData) {
  try {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Validar dados antes de enviar
    if (!foodData.name || !foodData.name.trim()) {
      throw new Error('Nome do alimento é obrigatório');
    }
    if (foodData.kcal_per_100 === null || foodData.kcal_per_100 === undefined || foodData.kcal_per_100 < 0) {
      throw new Error('Calorias por 100g é obrigatório');
    }
    if (foodData.protein_per_100 === null || foodData.protein_per_100 === undefined || foodData.protein_per_100 < 0) {
      throw new Error('Proteína por 100g é obrigatório');
    }
    if (foodData.carbs_per_100 === null || foodData.carbs_per_100 === undefined || foodData.carbs_per_100 < 0) {
      throw new Error('Carboidratos por 100g é obrigatório');
    }
    if (foodData.fat_per_100 === null || foodData.fat_per_100 === undefined || foodData.fat_per_100 < 0) {
      throw new Error('Gordura por 100g é obrigatório');
    }

    const dbFood = mapUserFoodToDB({
      name: foodData.name.trim(),
      kcal_per_100: parseFloat(foodData.kcal_per_100) || 0,
      protein_per_100: parseFloat(foodData.protein_per_100) || 0,
      carbs_per_100: parseFloat(foodData.carbs_per_100) || 0,
      fat_per_100: parseFloat(foodData.fat_per_100) || 0
    });

    const created = await userFoodsApi.createUserFood({
      ...dbFood,
      user_id: user.id
    });

    // Atualizar estado local (o mapper já converte de snake_case para camelCase)
    state.library = { ...state.library, [created.id]: mapUserFoodFromDB(created) };
    state.connectionError = null;

    return created;
  } catch (e) {
    state.connectionError = 'Erro ao criar alimento: ' + e.message;
    throw e;
  }
}

// Criar novo alimento com conversão automática para 100g
// Função genérica usada em todas as abas (Hoje e Alimentos)
export async function createUserFoodWithDetection(state, foodData, inputGrams) {
  try {
    const grams = inputGrams || 100;

    // Converter automaticamente se a quantidade especificada for diferente de 100g
    const needsConversion = grams !== 100;

    let finalData;
    let warning = null;

    if (needsConversion) {
      const factor = 100 / grams;
      finalData = {
        kcal_per_100: foodData.kcal * factor,
        protein_per_100: foodData.protein * factor,
        carbs_per_100: foodData.carbs * factor,
        fat_per_100: foodData.fat * factor
      };
      warning = `Convertendo valores de ${grams}g para 100g. Multiplicando por ${factor.toFixed(2)}.`;
    } else {
      finalData = {
        kcal_per_100: foodData.kcal,
        protein_per_100: foodData.protein,
        carbs_per_100: foodData.carbs,
        fat_per_100: foodData.fat
      };
    }

    // Atualizar o warning no estado apropriado
    if (state.qa) {
      state.qa.conversionWarning = warning;
    }
    if (state.lib) {
      state.lib.conversionWarning = warning;
    }

    return await createUserFood(state, {
      name: foodData.name,
      ...finalData
    });
  } catch (e) {
    state.connectionError = 'Erro ao criar alimento: ' + e.message;
    throw e;
  }
}

// Atualizar alimento existente
export async function updateUserFood(state, id, foodData, inputGrams) {
  try {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const grams = inputGrams || 100;

    // Converter automaticamente se a quantidade especificada for diferente de 100g
    const needsConversion = grams !== 100;

    let finalData;
    let warning = null;

    if (needsConversion) {
      const factor = 100 / grams;
      finalData = {
        kcal_per_100: foodData.kcal * factor,
        protein_per_100: foodData.protein * factor,
        carbs_per_100: foodData.carbs * factor,
        fat_per_100: foodData.fat * factor
      };
      warning = `Convertendo valores de ${grams}g para 100g. Multiplicando por ${factor.toFixed(2)}.`;
    } else {
      finalData = {
        kcal_per_100: foodData.kcal,
        protein_per_100: foodData.protein,
        carbs_per_100: foodData.carbs,
        fat_per_100: foodData.fat
      };
    }

    // Validar dados antes de enviar
    if (!foodData.name || !foodData.name.trim()) {
      throw new Error('Nome do alimento é obrigatório');
    }
    if (finalData.kcal_per_100 === null || finalData.kcal_per_100 === undefined || finalData.kcal_per_100 < 0) {
      throw new Error('Calorias por 100g é obrigatório');
    }
    if (finalData.protein_per_100 === null || finalData.protein_per_100 === undefined || finalData.protein_per_100 < 0) {
      throw new Error('Proteína por 100g é obrigatório');
    }
    if (finalData.carbs_per_100 === null || finalData.carbs_per_100 === undefined || finalData.carbs_per_100 < 0) {
      throw new Error('Carboidratos por 100g é obrigatório');
    }
    if (finalData.fat_per_100 === null || finalData.fat_per_100 === undefined || finalData.fat_per_100 < 0) {
      throw new Error('Gordura por 100g é obrigatório');
    }

    const dbFood = mapUserFoodToDB({
      name: foodData.name.trim(),
      kcal_per_100: parseFloat(finalData.kcal_per_100) || 0,
      protein_per_100: parseFloat(finalData.protein_per_100) || 0,
      carbs_per_100: parseFloat(finalData.carbs_per_100) || 0,
      fat_per_100: parseFloat(finalData.fat_per_100) || 0
    });

    const updated = await userFoodsApi.updateUserFood(id, dbFood);

    // Atualizar estado local
    state.library = { ...state.library, [updated.id]: mapUserFoodFromDB(updated) };
    state.connectionError = null;

    return updated;
  } catch (e) {
    state.connectionError = 'Erro ao atualizar alimento: ' + e.message;
    throw e;
  }
}

// Adicionar item temporário à refeição atual (não salva no banco ainda)
export function addTemporaryMealItem(state, item) {
  state.qa.currentMealItems.push({
    id: uid(),
    food_id: item.food_id,
    name: item.name,
    grams: item.grams,
    kcal: item.kcal,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    per100: item.per100
  });
}

// Remover item temporário da refeição atual
export function removeTemporaryMealItem(state, itemId) {
  state.qa.currentMealItems = state.qa.currentMealItems.filter(item => item.id !== itemId);
}

// Limpar todos os itens temporários
export function clearTemporaryMealItems(state) {
  state.qa.currentMealItems = [];
  state.qa.conversionWarning = null;
}

// Salvar refeição completa com todos os itens temporários
export async function saveCompleteMeal(state, date, mealType) {
  try {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    if (state.qa.currentMealItems.length === 0) {
      throw new Error('Nenhum item adicionado à refeição');
    }

    // Obter ou criar meal
    const meal = await mealsApi.getOrCreateMeal(date, mealType);

    // Criar todos os meal_items de uma vez
    for (const item of state.qa.currentMealItems) {
      await mealsApi.createMealItem({
        meal_id: meal.id,
        user_id: user.id,
        food_id: item.food_id,
        name: item.name,
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      });
    }

    // Atualizar estado local
    const dateKeyStr = date;
    if (!state.diary[dateKeyStr]) {
      state.diary[dateKeyStr] = emptyDay();
    }

    state.qa.currentMealItems.forEach(item => {
      state.diary[dateKeyStr].entries.push({
        id: item.id,
        name: item.name,
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        per100: item.per100,
        meal_id: meal.id,
        mealType: mealType,
        food_id: item.food_id
      });
    });

    // Limpar itens temporários
    clearTemporaryMealItems(state);

    state.connectionError = null;
    return meal;
  } catch (e) {
    state.connectionError = 'Erro ao salvar refeição: ' + e.message;
    throw e;
  }
}
export async function addMealItem(state, itemData, date, mealType) {
  try {
    const user = await authApi.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Obter ou criar meal
    const meal = await mealsApi.getOrCreateMeal(date, mealType);

    // Criar meal_item (deixar o banco gerar o ID automaticamente)
    const mealItem = await mealsApi.createMealItem({
      meal_id: meal.id,
      user_id: user.id,
      food_id: itemData.food_id,
      name: itemData.name,
      grams: itemData.grams,
      kcal: itemData.kcal,
      protein: itemData.protein,
      carbs: itemData.carbs,
      fat: itemData.fat
    });

    // Atualizar estado local (apenas cache, não persistir novamente)
    const dateKeyStr = date;
    if (!state.diary[dateKeyStr]) {
      state.diary[dateKeyStr] = emptyDay();
    }

    state.diary[dateKeyStr].entries.push({
      id: mealItem.id,
      name: mealItem.name,
      grams: mealItem.grams,
      kcal: mealItem.kcal,
      protein: mealItem.protein,
      carbs: mealItem.carbs,
      fat: mealItem.fat,
      per100: null,
      meal_id: meal.id,
      mealType: mealType,
      food_id: mealItem.food_id
    });

    state.connectionError = null;

    return mealItem;
  } catch (e) {
    state.connectionError = 'Erro ao adicionar item: ' + e.message;
    throw e;
  }
}

// Adicionar entrada (compatibilidade com código antigo, usa novo fluxo)
export async function addEntry(state, entry, targetDate) {
  const date = targetDate || todayKey();
  const mealType = state.qa.mealType;

  // Se entry tem per100, calcular valores finais
  let finalValues;
  if (entry.per100) {
    finalValues = calculateMacrosFromPer100(entry.grams, entry.per100);
  } else {
    finalValues = {
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat
    };
  }

  await addMealItem(state, {
    food_id: entry.food_id,
    name: entry.name,
    grams: entry.grams,
    ...finalValues
  }, date, mealType);
}

export async function deleteEntry(state, id) {
  try {
    await mealsApi.deleteMealItem(id);

    // Remover do estado local (apenas cache, não persistir novamente)
    const dateKeyStr = todayKey();
    if (state.diary[dateKeyStr]) {
      state.diary[dateKeyStr].entries = state.diary[dateKeyStr].entries.filter(e => e.id !== id);
    }

    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro ao deletar item: ' + e.message;
    throw e;
  }
}

export async function editEntryGrams(state, id, newGrams) {
  try {
    // Encontrar entry para obter dados do alimento
    let entry = null;
    let dateKeyStr = todayKey();

    for (const [key, day] of Object.entries(state.diary)) {
      const found = day.entries.find(e => e.id === id);
      if (found) {
        entry = found;
        dateKeyStr = key;
        break;
      }
    }

    if (!entry) throw new Error('Entry not found');

    // Recalcular valores finais
    let newValues;
    if (entry.food_id && state.library[entry.food_id]) {
      const food = state.library[entry.food_id];
      newValues = calculateMacrosFromPer100(newGrams, food);
    } else if (entry.per100) {
      newValues = calculateMacrosFromPer100(newGrams, entry.per100);
    } else {
      throw new Error('Cannot recalculate: no per100 data available');
    }

    // Atualizar no banco
    await mealsApi.updateMealItem(id, {
      grams: newGrams,
      ...newValues
    });

    // Atualizar estado local (apenas cache, não persistir novamente)
    if (state.diary[dateKeyStr]) {
      state.diary[dateKeyStr].entries = state.diary[dateKeyStr].entries.map(e => {
        if (e.id !== id) return e;
        return { ...e, grams: newGrams, ...newValues };
      });
    }

    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro ao editar item: ' + e.message;
    throw e;
  }
}

export async function deleteFood(state, id) {
  try {
    await userFoodsApi.deleteUserFood(id);

    const next = { ...state.library };
    delete next[id];
    state.library = next;

    await persist('library', state.library);
    state.connectionError = null;
  } catch (e) {
    state.connectionError = 'Erro ao deletar alimento: ' + e.message;
    throw e;
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
    showSuggest: false,
    msg: "",
    newFoodMode: false,
    newFoodForm: { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" },
    currentMealItems: [],
    conversionWarning: null
  };
}

export function exportData(state) {
  const data = {
    schemaVersion: "4.0",
    profile: state.profile,
    library: state.library,
    diary: state.diary,
    exportDate: new Date().toISOString(),
    version: "3.0"
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `macrosfit-${dateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(state) {
  try {
    const data = JSON.parse(state.importExport.importData);

    if (!data.schemaVersion || typeof data.schemaVersion !== 'string') {
      throw new Error('Versão do schema inválida');
    }

    if (data.profile && typeof data.profile !== 'object') {
      throw new Error('Perfil inválido');
    }

    if (data.library && typeof data.library !== 'object') {
      throw new Error('Biblioteca inválida');
    }

    if (data.diary && typeof data.diary !== 'object') {
      throw new Error('Diário inválido');
    }

    if (data.library) {
      for (const [id, food] of Object.entries(data.library)) {
        if (!food || typeof food !== 'object') {
          throw new Error(`Alimento inválido: ${id}`);
        }
        if (typeof food.name !== 'string' || !food.name.trim()) {
          throw new Error(`Nome inválido para alimento: ${id}`);
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

    if (data.diary) {
      for (const [dateKey, day] of Object.entries(data.diary)) {
        if (!day || typeof day !== 'object') {
          throw new Error(`Dia inválido: ${dateKey}`);
        }
        if (day.entries && !Array.isArray(day.entries)) {
          throw new Error(`Entries inválido para dia: ${dateKey}`);
        }
        if (day.entries) {
          for (const [index, entry] of day.entries.entries()) {
            if (!entry || typeof entry !== 'object') {
              throw new Error(`Entry inválido em ${dateKey}[${index}]`);
            }
            if (typeof entry.name !== 'string' || !entry.name.trim()) {
              throw new Error(`Nome inválido em entry ${dateKey}[${index}]`);
            }
            if (typeof entry.grams !== 'number' || entry.grams <= 0 || entry.grams > VALIDATION_LIMITS.GRAMS_MAX) {
              throw new Error(`Gramas inválidos em entry ${dateKey}[${index}]`);
            }
            if (typeof entry.kcal !== 'number' || entry.kcal < 0 || entry.kcal > VALIDATION_LIMITS.KCAL_MAX) {
              throw new Error(`Calorias inválidas em entry ${dateKey}[${index}]`);
            }
            if (typeof entry.protein !== 'number' || entry.protein < 0 || entry.protein > VALIDATION_LIMITS.MACRO_MAX) {
              throw new Error(`Proteína inválida em entry ${dateKey}[${index}]`);
            }
            if (typeof entry.carbs !== 'number' || entry.carbs < 0 || entry.carbs > VALIDATION_LIMITS.MACRO_MAX) {
              throw new Error(`Carboidratos inválidos em entry ${dateKey}[${index}]`);
            }
            if (typeof entry.fat !== 'number' || entry.fat < 0 || entry.fat > VALIDATION_LIMITS.MACRO_MAX) {
              throw new Error(`Gordura inválida em entry ${dateKey}[${index}]`);
            }
          }
        }
      }
    }

    if (data.profile) {
      if (data.profile.goals && typeof data.profile.goals !== 'object') {
        throw new Error('Goals inválido no perfil');
      }
      if (data.profile.goals) {
        const goals = data.profile.goals;
        if (goals.calories !== undefined && (typeof goals.calories !== 'number' || goals.calories < 0 || goals.calories > VALIDATION_LIMITS.KCAL_MAX)) {
          throw new Error('Calorias inválidas nas metas');
        }
        if (goals.protein !== undefined && (typeof goals.protein !== 'number' || goals.protein < 0 || goals.protein > VALIDATION_LIMITS.MACRO_MAX)) {
          throw new Error('Proteína inválida nas metas');
        }
        if (goals.carbs !== undefined && (typeof goals.carbs !== 'number' || goals.carbs < 0 || goals.carbs > VALIDATION_LIMITS.MACRO_MAX)) {
          throw new Error('Carboidratos inválidos nas metas');
        }
        if (goals.fat !== undefined && (typeof goals.fat !== 'number' || goals.fat < 0 || goals.fat > VALIDATION_LIMITS.MACRO_MAX)) {
          throw new Error('Gordura inválida nas metas');
        }
      }
      if (data.profile.biometrics && typeof data.profile.biometrics !== 'object') {
        throw new Error('Biometrics inválido no perfil');
      }
      if (data.profile.biometrics) {
        const bio = data.profile.biometrics;
        if (bio.weight !== undefined && (typeof bio.weight !== 'number' || bio.weight < 0 || bio.weight > VALIDATION_LIMITS.WEIGHT_MAX)) {
          throw new Error('Peso inválido nas biometrias');
        }
        if (bio.height !== undefined && (typeof bio.height !== 'number' || bio.height < 0 || bio.height > VALIDATION_LIMITS.HEIGHT_MAX)) {
          throw new Error('Altura inválida nas biometrias');
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

export function exportMeal(state, mealType, dateKeyStr) {
  const day = state.diary[dateKeyStr];
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
    schemaVersion: "4.0",
    mealType: mealType,
    mealName: MEAL_TYPES.find(mt => mt.id === mealType)?.label || mealType,
    date: dateKeyStr,
    items: mealEntries.map(entry => ({
      name: entry.name,
      grams: entry.grams,
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat
    })),
    totals: mealEntries.reduce((acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    exportDate: new Date().toISOString(),
    version: "3.0"
  };

  const blob = new Blob([JSON.stringify(mealData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `refeicao-${mealType}-${dateKeyStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importMeal(state) {
  try {
    const mealData = JSON.parse(state.importExport.mealImportData);

    if (!mealData.schemaVersion || typeof mealData.schemaVersion !== 'string') {
      throw new Error('Versão do schema inválida');
    }

    if (!mealData.items || !Array.isArray(mealData.items)) {
      throw new Error("Formato inválido: campo 'items' ausente ou não é array");
    }

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
    const date = mealData.date || todayKey();

    for (const item of mealData.items) {
      await addMealItem(state, {
        food_id: null,
        name: item.name,
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }, date, mealType);
    }

    state.importExport.mealImportData = "";
    state.qa.msg = `Refeição importada com sucesso! (${mealData.items.length} itens)`;
  } catch (e) {
    alert("Erro ao importar refeição: " + e.message);
  }
}
