import { qaBasis, qaComputed } from '../state/selectors.js';
import {
  createUserFood, createUserFoodWithDetection,
  addTemporaryMealItem, removeTemporaryMealItem, updateTemporaryMealItem, clearTemporaryMealItems, saveCompleteMeal, importMeal
} from '../state/mutations.js';
import { uid, normalize, round, esc, dateKey } from '../core/utils.js';
import { render } from '../app/render.js';
import { searchFoods } from '../utils/search.js';
import { getState, showNotification } from '../state/state.js';
import { handleError } from '../core/errorHandler.js';
import { formatMacros } from '../core/macroUtils.js';

let qaSearchTimeout = null;

export const todayHandlers = {
  'qa-pick-suggestion': (el, ev) => {
    const id = el.dataset.id;
    const source = el.dataset.source;

    let food;
    if (source === 'user') {
      food = getState().library[id];
    } else {
      food = getState().qa.standardSuggestions?.find(f => f.id === id);
    }

    if (food) {
      getState().qa.name = food.name;
      getState().qa.grams = "100";
      getState().qa.manualOpen = false;
      getState().qa.showSuggest = false;
      getState().qa.editMacros = false;
      getState().qa.editedMacros = { kcal: "", protein: "", carbs: "", fat: "" };
      render(getState());
    }
  },

  'qa-toggle-edit-macros': (el, ev) => {
    getState().qa.editMacros = !getState().qa.editMacros;
    if (getState().qa.editMacros) {
      const basis = getState().qa.standardSuggestions?.find(f => f.name === getState().qa.name) ||
                    Object.values(getState().library).find(f => f.name === getState().qa.name);
      if (basis) {
        getState().qa.editedMacros = {
          kcal: basis.kcal.toString(),
          protein: basis.protein.toString(),
          carbs: basis.carbs.toString(),
          fat: basis.fat.toString()
        };
      }
    }
    render(getState());
  },

  'qa-edited-macros-input': (el, ev) => {
    const field = el.dataset.field;
    getState().qa.editedMacros[field] = el.value;
  },

  'qa-meal-select': (el, ev) => {
    getState().qa.mealType = el.dataset.meal;
    render(getState());
  },

  'qa-open-manual': (el, ev) => {
    getState().qa.manualOpen = true;
    render(getState());
  },

  'qa-open-manual-cancel': (el, ev) => {
    getState().qa.manualOpen = false;
    render(getState());
  },

  'qa-new-food-mode': (el, ev) => {
    getState().qa.newFoodMode = true;
    getState().qa.newFoodForm = {
      name: getState().qa.name,
      kcal: getState().qa.manual.kcal,
      protein: getState().qa.manual.protein,
      carbs: getState().qa.manual.carbs,
      fat: getState().qa.manual.fat,
      grams: getState().qa.grams
    };
    render(getState());
  },

  'qa-new-food-cancel': (el, ev) => {
    getState().qa.newFoodMode = false;
    getState().qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
    render(getState());
  },

  'qa-new-food-submit': (el, ev) => {
    const f = getState().qa.newFoodForm;
    if (!f.name.trim() || !f.kcal) return;
    (async () => {
      try {
        const foodData = {
          name: f.name.trim(),
          kcal: parseFloat(f.kcal) || 0,
          protein: parseFloat(f.protein) || 0,
          carbs: parseFloat(f.carbs) || 0,
          fat: parseFloat(f.fat) || 0
        };
        const inputGrams = parseFloat(f.grams) || 100;

        if (foodData.kcal <= 0) {
          showNotification("kcal deve ser maior que 0", 'error');
          render(getState());
          return;
        }

        const created = await createUserFoodWithDetection(getState(), foodData, inputGrams);

        const totals = {
          kcal: foodData.kcal,
          protein: foodData.protein,
          carbs: foodData.carbs,
          fat: foodData.fat
        };
        const per100 = {
          kcal: created.kcal,
          protein: created.protein,
          carbs: created.carbs,
          fat: created.fat
        };
        addTemporaryMealItem(getState(), { 
          id: uid(), 
          food_id: created.id, 
          name: created.name, 
          grams: inputGrams, 
          ...totals, 
          per100 
        });

        getState().qa.name = "";
        getState().qa.grams = "";
        getState().qa.newFoodMode = false;
        getState().qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
        showNotification("Alimento cadastrado e adicionado!", 'success');
        render(getState());
      } catch (e) {
        const error = handleError(e, 'qa-new-food-submit');
        showNotification(error.message, 'error');
        render(getState());
      }
    })();
  },

  'qa-add-item': (el, ev) => {
    const name = getState().qa.name.trim();
    const grams = parseFloat(getState().qa.grams) || 0;
    if (!name || grams <= 0) return;
    const basis = qaBasis(getState());
    let totals, per100, food_id = null;
    if (basis) {
      const n = normalize(getState().qa.name);
      const exact = Object.values(getState().library).find((f) => normalize(f.name) === n);
      food_id = exact ? exact.id : null;
      totals = { kcal: (basis.kcal * grams) / 100, protein: (basis.protein * grams) / 100, carbs: (basis.carbs * grams) / 100, fat: (basis.fat * grams) / 100 };
      per100 = basis;
    } else {
      const k = parseFloat(getState().qa.manual.kcal) || 0;
      if (k <= 0) return;
      totals = { kcal: k, protein: parseFloat(getState().qa.manual.protein) || 0, carbs: parseFloat(getState().qa.manual.carbs) || 0, fat: parseFloat(getState().qa.manual.fat) || 0 };
      per100 = { kcal: (totals.kcal / grams) * 100, protein: (totals.protein / grams) * 100, carbs: (totals.carbs / grams) * 100, fat: (totals.fat / grams) * 100 };
    }

    const editingIndex = getState().qa.editingItemIndex;
    if (editingIndex !== null) {
      updateTemporaryMealItem(getState(), editingIndex, { food_id, name, grams, ...totals, per100 });
      getState().qa.editingItemIndex = null;
    } else {
      addTemporaryMealItem(getState(), { id: uid(), food_id, name, grams, ...totals, per100 });
    }

    getState().qa.name = "";
    getState().qa.grams = "";
    getState().qa.manualOpen = false;
    getState().qa.manual = { kcal: "", protein: "", carbs: "", fat: "" };
    getState().qa.showSuggest = false;
    getState().qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
    getState().qa.conversionWarning = null;
    render(getState());
  },

  'qa-remove-temp-item': (el, ev) => {
    const index = Number(el.dataset.index);
    removeTemporaryMealItem(getState(), getState().qa.currentMealItems[index].id);
    render(getState());
  },

  'qa-edit-temp-item': (el, ev) => {
    const index = Number(el.dataset.index);
    const item = getState().qa.currentMealItems[index];

    getState().qa.editingItemIndex = index;
    getState().qa.name = item.name;
    getState().qa.grams = item.grams.toString();
    getState().qa.manualOpen = false;
    getState().qa.showSuggest = false;
    getState().qa.editMacros = false;
    getState().qa.editedMacros = { kcal: "", protein: "", carbs: "", fat: "" };
    render(getState());
  },

  'qa-cancel-edit': (el, ev) => {
    getState().qa.editingItemIndex = null;
    getState().qa.name = "";
    getState().qa.grams = "";
    getState().qa.manualOpen = false;
    getState().qa.manual = { kcal: "", protein: "", carbs: "", fat: "" };
    getState().qa.showSuggest = false;
    render(getState());
  },

  'qa-clear-meal': (el, ev) => {
    clearTemporaryMealItems(getState());
    render(getState());
  },

  'qa-save-meal': (el, ev) => {
    (async () => {
      try {
        getState().qa.saving = true;
        render(getState());

        const targetDate = getState().qa.targetDate || dateKey(new Date());
        await saveCompleteMeal(getState(), targetDate, getState().qa.mealType);
        getState().qa.saving = false;
        showNotification("Refeição registrada com sucesso!", 'success');
        render(getState());
      } catch (e) {
        const error = handleError(e, 'qa-save-meal');
        getState().qa.saving = false;
        showNotification(error.message, 'error');
        render(getState());
      }
    })();
  },

  'qa-name-input': (el, ev) => {
    getState().qa.name = el.value;
    getState().qa.showSuggest = !!el.value.trim();

    clearTimeout(qaSearchTimeout);
    qaSearchTimeout = setTimeout(() => {
      const query = el.value.trim();
      if (query.length >= 2) {
        const results = searchFoods(getState().foods, query);
        getState().qa.standardSuggestions = results.map(f => ({
          id: f.slug,
          name: f.name,
          kcal: f.kcal_per_100,
          protein: f.protein_per_100,
          carbs: f.carbs_per_100,
          fat: f.fat_per_100,
          source: f.source === 'padrão' ? 'standard' : f.source
        }));
      } else {
        getState().qa.standardSuggestions = [];
      }
      if (getState().qa.showSuggest) {
        render(getState());
      }
    }, 200);
  },

  'qa-grams-input': (el, ev) => {
    getState().qa.grams = el.value;
    const basis = qaBasis(getState());
    const g = parseFloat(getState().qa.grams) || 0;
    if (basis && g > 0) {
      const computed = {
        kcal: (basis.kcal * g) / 100,
        protein: (basis.protein * g) / 100,
        carbs: (basis.carbs * g) / 100,
        fat: (basis.fat * g) / 100
      };
      const macrosEl = document.querySelector('[data-qa-computed-macros]');
      if (macrosEl) {
        macrosEl.textContent = formatMacros({ ...computed, grams: g }, true);
      }
    }
  },

  'qa-date-input': (el, ev) => {
    getState().qa.targetDate = el.value;
  },

  'qa-manual-input': (el, ev) => {
    getState().qa.manual[el.dataset.field] = el.value;
  },

  'qa-new-food-input': (el, ev) => {
    getState().qa.newFoodForm[el.dataset.field] = el.value;
  },

  'show-meal-import': (el, ev) => {
    getState().importExport.showMealImport = true;
    getState().importExport.showMealImportExample = false;
    render(getState());
  },

  'hide-meal-import': (el, ev) => {
    getState().importExport.showMealImport = false;
    getState().importExport.showMealImportExample = false;
    getState().importExport.mealImportData = "";
    render(getState());
  },

  'show-meal-import-example': (el, ev) => {
    getState().importExport.showMealImportExample = !getState().importExport.showMealImportExample;
    render(getState());
  },

  'import-meal': (el, ev) => {
    (async () => {
      try {
        await importMeal(getState());
        getState().importExport.showMealImport = false;
        getState().importExport.showMealImportExample = false;
        render(getState());
      } catch (e) {
        const error = handleError(e, 'import-meal');
        showNotification(error.message, 'error');
        render(getState());
      }
    })();
  },

  'meal-import-text-input': (el, ev) => {
    getState().importExport.mealImportData = el.value;
  }
};
