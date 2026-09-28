import { MEAL_TYPES, VALIDATION_LIMITS } from '../core/constants.js';
import { dateKey, emptyDay, normalize, parseKey, uid } from '../core/utils.js';
import * as userFoodsApi from '../api/user_foods.js';
import * as mealsApi from '../api/meals.js';
import * as authApi from '../api/auth.js';
import { mapUserFoodToDB, mapUserFoodFromDB } from '../utils/mapper.js';
import { handleError } from '../core/errorHandler.js';
import { showNotification } from './state.js';
import { groupEntriesByMealId } from './selectors.js';

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

// Carregar dados do usuário após importação (copia de app.js loadData)
async function loadUserDataAfterImport(state, user) {
  try {
    const profileApi = await import('../api/profile.js');
    const userFoodsApi = await import('../api/user_foods.js');
    const mealsApiModule = await import('../api/meals.js');

    const [profile, foods, meals] = await Promise.all([
      profileApi.getProfile(),
      userFoodsApi.getUserFoods(),
      mealsApiModule.getAllMeals(user.id)
    ]);

    const library = {};
    foods.forEach(food => {
      const mapped = mapUserFoodFromDB(food);
      if (mapped) {
        library[mapped.id] = mapped;
      }
    });

    const diary = {};
    meals.forEach(meal => {
      const dateKeyStr = meal.date;
      if (!diary[dateKeyStr]) {
        diary[dateKeyStr] = emptyDay();
      }

      if (meal.meal_items) {
        meal.meal_items.forEach(item => {
          diary[dateKeyStr].entries.push({
            id: item.id,
            name: item.name,
            grams: item.grams,
            kcal: item.kcal,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            per100: null,
            meal_id: meal.id,
            mealType: meal.meal_type,
            food_id: item.food_id
          });
        });
      }
    });

    state.profile = profile;
    state.library = library;
    state.diary = diary;
    
    // Inicializar expandedMeals com as refeições do dia atual
    const todayKey = dateKey(new Date());
    const today = diary[todayKey] || { entries: [] };
    const todayMeals = groupEntriesByMealId(today);
    state.expandedMeals = {};
    todayMeals.forEach(meal => {
      const mealKey = meal.meal_id || meal.mealType;
      state.expandedMeals[mealKey] = true;
    });
    
    // Restaurar estado UI (exceto expandedMeals)
    const { restoreUIState } = await import('../core/uiState.js');
    const restored = restoreUIState();
    if (restored) {
      const { expandedMeals, ...restWithoutExpanded } = restored;
      Object.assign(state, restWithoutExpanded);
    }
    
    return true;
  } catch (e) {
    console.error('Error reloading data after import:', e);
    return false;
  }
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
    const error = handleError(e, 'createUserFood');
    state.connectionError = error.message;
    throw error;
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
    const error = handleError(e, 'createUserFoodWithDetection');
    state.connectionError = error.message;
    throw error;
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
    const error = handleError(e, 'updateUserFood');
    state.connectionError = error.message;
    throw error;
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

    // Criar nova meal (cada clique em "Registrar refeição" cria nova meal separada)
    const meal = await mealsApi.createNewMeal(date, mealType);

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
    const error = handleError(e, 'saveCompleteMeal');
    state.connectionError = error.message;
    throw error;
  }
}

export async function deleteEntry(state, id) {
  try {
    await mealsApi.deleteMealItem(id);

    // Remover do estado local (apenas cache, não persistir novamente)
    // Buscar entry em todo o diary, não apenas no dia atual
    let dateKeyStr = null;
    for (const [key, day] of Object.entries(state.diary)) {
      if (day.entries.some(e => e.id === id)) {
        dateKeyStr = key;
        break;
      }
    }

    if (dateKeyStr && state.diary[dateKeyStr]) {
      state.diary[dateKeyStr].entries = state.diary[dateKeyStr].entries.filter(e => e.id !== id);
    }

    state.connectionError = null;
  } catch (e) {
    const error = handleError(e, 'deleteMealItem');
    state.connectionError = error.message;
    throw error;
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
    const error = handleError(e, 'editEntryGrams');
    state.connectionError = error.message;
    throw error;
  }
}

export async function deleteFood(state, id) {
  try {
    await userFoodsApi.deleteUserFood(id);

    const next = { ...state.library };
    delete next[id];
    state.library = next;

    // Atualizar estado local (apenas cache, não persistir novamente)
    state.connectionError = null;
  } catch (e) {
    const error = handleError(e, 'deleteFood');
    state.connectionError = error.message;
    throw error;
  }
}

export async function resetAll(state) {
  // Apagar todas as meals do usuário no banco
  const user = await authApi.getCurrentUser();
  if (user) {
    await mealsApi.deleteAllMeals(user.id);
  }

  // Resetar estado local
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
    conversionWarning: null,
    standardSuggestions: []
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
    }
    if (data.library) {
      state.library = data.library;
    }
    if (data.diary) {
      const user = await authApi.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      // Persistir entries no banco criando meals e meal_items
      for (const [dateKey, day] of Object.entries(data.diary)) {
        if (!day.entries || !Array.isArray(day.entries)) continue;

        // Agrupar entries por meal_id ou mealType
        const mealGroups = {};
        day.entries.forEach(entry => {
          const groupKey = entry.meal_id || entry.mealType || 'outro';
          if (!mealGroups[groupKey]) {
            mealGroups[groupKey] = [];
          }
          mealGroups[groupKey].push(entry);
        });

        // Criar meals e meal_items em paralelo por dia
        await Promise.all(
          Object.entries(mealGroups).map(async ([groupKey, entries]) => {
            const firstEntry = entries[0];
            let mealType = firstEntry.mealType || 'outro';

            const validMealTypes = ['cafe', 'almoco', 'lanche', 'jantar', 'ceia', 'outro'];
            if (!validMealTypes.includes(mealType)) {
              mealType = 'outro';
            }

            const meal = await mealsApi.createNewMeal(dateKey, mealType, null);

            await Promise.all(
              entries.map(entry =>
                mealsApi.createMealItem({
                  meal_id: meal.id,
                  user_id: user.id,
                  food_id: null,
                  name: entry.name,
                  grams: entry.grams,
                  kcal: entry.kcal,
                  protein: entry.protein,
                  carbs: entry.carbs,
                  fat: entry.fat
                })
              )
            );
          })
        );
      }
    }

    // Recarregar dados do banco para garantir sincronização e aparecer no histórico
    const user = await authApi.getCurrentUser();
    if (user) {
      await loadUserDataAfterImport(state, user);
    }

    // Atualizar viewMonth para o mês mais recente com dados
    const dates = Object.keys(state.diary || {}).sort();
    if (dates.length > 0) {
      const latestDate = parseKey(dates[dates.length - 1]);
      state.viewMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    }

    state.importExport.showImport = false;
    state.importExport.importData = "";
    showNotification("Dados importados com sucesso!", 'success');
  } catch (e) {
    const error = handleError(e, 'importData');
    showNotification(error.message, 'error');
  }
}

export function exportMeal(state, mealId) {
  (async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        showNotification("Não autenticado", 'error');
        return;
      }

      const meal = await mealsApi.getMeal(mealId);
      if (!meal) {
        showNotification("Refeição não encontrada", 'error');
        return;
      }

      const mealData = {
        schemaVersion: "4.0",
        meals: [
          {
            id: meal.id,
            user_id: user.id,
            date: meal.date,
            meal_type: meal.meal_type,
            name: meal.name || null,
            meal_items: meal.meal_items ? meal.meal_items.map(item => ({
              id: item.id,
              meal_id: item.meal_id,
              user_id: item.user_id,
              food_id: item.food_id,
              name: item.name,
              grams: item.grams,
              kcal: item.kcal,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat
            })) : []
          }
        ],
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(mealData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `refeicao-${meal.meal_type}-${meal.date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification("Refeição exportada com sucesso!", 'success');
    } catch (e) {
      const error = handleError(e, 'exportMeal');
      showNotification(error.message, 'error');
    }
  })();
}

export async function importMeal(state) {
  try {
    const mealData = JSON.parse(state.importExport.mealImportData);

    if (!mealData.schemaVersion || typeof mealData.schemaVersion !== 'string') {
      throw new Error('Versão do schema inválida');
    }

    if (!mealData.meals || !Array.isArray(mealData.meals)) {
      throw new Error("Formato inválido: campo 'meals' ausente ou não é array");
    }

    const user = await authApi.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    let importedCount = 0;

    for (const meal of mealData.meals) {
      if (!meal || typeof meal !== 'object') {
        throw new Error('Refeição inválida');
      }
      if (!meal.date || typeof meal.date !== 'string') {
        throw new Error('Data da refeição é obrigatória');
      }
      if (!meal.meal_type || typeof meal.meal_type !== 'string') {
        throw new Error('Tipo de refeição é obrigatório');
      }

      const validMealTypes = MEAL_TYPES.map(mt => mt.id);
      if (!validMealTypes.includes(meal.meal_type)) {
        throw new Error(`Tipo de refeição inválido: ${meal.meal_type}. Valores válidos: ${validMealTypes.join(', ')}`);
      }

      if (!meal.meal_items || !Array.isArray(meal.meal_items)) {
        throw new Error('Itens da refeição ausentes ou inválidos');
      }

      for (const item of meal.meal_items) {
        if (!item || typeof item !== 'object') {
          throw new Error('Item de refeição inválido');
        }
        if (typeof item.name !== 'string' || !item.name.trim()) {
          throw new Error('Nome do item é obrigatório');
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
      }

      const createdMeal = await mealsApi.createNewMeal(meal.date, meal.meal_type, meal.name || null);

      for (const item of meal.meal_items) {
        await mealsApi.createMealItem({
          meal_id: createdMeal.id,
          user_id: user.id,
          food_id: item.food_id || null,
          name: item.name,
          grams: item.grams,
          kcal: item.kcal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat
        });

        const dateKeyStr = meal.date;
        if (!state.diary[dateKeyStr]) {
          state.diary[dateKeyStr] = emptyDay();
        }

        state.diary[dateKeyStr].entries.push({
          id: uid(),
          name: item.name,
          grams: item.grams,
          kcal: item.kcal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          per100: null,
          meal_id: createdMeal.id,
          mealType: meal.meal_type,
          food_id: item.food_id || null
        });
        importedCount++;
      }
    }

    await loadUserDataAfterImport(state, user);

    state.importExport.mealImportData = "";
    showNotification(`Refeição importada com sucesso! (${importedCount} itens)`, 'success');
  } catch (e) {
    const error = handleError(e, 'importMeal');
    showNotification(error.message, 'error');
  }
}
