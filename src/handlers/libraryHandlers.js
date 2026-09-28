import { getState, showNotification, clearNotification } from '../state/state.js';
import { render } from '../app/render.js';
import { deleteFood, createUserFoodWithDetection, updateUserFood } from '../state/mutations.js';
import { searchStandardFoods } from '../api/standard_foods.js';
import { mapStandardFoodFromDB } from '../utils/mapper.js';
import { validateForm } from '../core/utils.js';
import { handleError } from '../core/errorHandler.js';

let libSearchTimeout = null;

export const libraryHandlers = {
  'lib-toggle-add': (el, ev) => {
    getState().lib.adding = !getState().lib.adding;
    getState().lib.editingId = null;
    getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
    getState().lib.conversionWarning = null;
    render(getState());
  },

  'lib-cancel-add': (el, ev) => {
    getState().lib.adding = false;
    getState().lib.editingId = null;
    getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
    getState().lib.conversionWarning = null;
    render(getState());
  },

  'lib-submit': (el, ev) => {
    const f = getState().lib.form;

    const rules = {
      name: { required: true, message: 'Nome do alimento é obrigatório' },
      kcal: { required: true, min: 0, message: 'Calorias deve ser maior ou igual a 0' },
      protein: { min: 0, message: 'Proteína deve ser maior ou igual a 0' },
      carbs: { min: 0, message: 'Carboidratos deve ser maior ou igual a 0' },
      fat: { min: 0, message: 'Gordura deve ser maior ou igual a 0' }
    };

    const errors = validateForm(rules, f);
    if (errors.length > 0) {
      showNotification(errors[0], 'error');
      render(getState());
      setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      return;
    }

    (async () => {
      try {
        getState().lib.saving = true;
        render(getState());

        const foodData = {
          name: f.name.trim(),
          kcal: parseFloat(f.kcal) || 0,
          protein: parseFloat(f.protein) || 0,
          carbs: parseFloat(f.carbs) || 0,
          fat: parseFloat(f.fat) || 0
        };
        const inputGrams = parseFloat(f.grams) || 100;

        if (getState().lib.editingId) {
          await updateUserFood(getState(), getState().lib.editingId, foodData, inputGrams);
        } else {
          await createUserFoodWithDetection(getState(), foodData, inputGrams);
        }

        getState().lib.saving = false;
        getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
        getState().lib.editingId = null;
        getState().lib.adding = false;
        getState().lib.conversionWarning = null;
        showNotification("Alimento salvo com sucesso!", 'success');
        render(getState());
        setTimeout(() => { clearNotification(); render(getState()); }, 1800);
      } catch (e) {
        const error = handleError(e, 'lib-submit');
        getState().lib.saving = false;
        getState().lib.adding = true;
        showNotification(error.message, 'error');
        render(getState());
        setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      }
    })();
  },

  'lib-edit': (el, ev) => {
    const f = getState().library[el.dataset.id];
    if (f) {
      getState().lib.editingId = f.id;
      getState().lib.form = { name: f.name, kcal: String(f.kcal), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat), grams: "" };
      getState().lib.adding = true;
      render(getState());
    }
  },

  'lib-delete': (el, ev) => {
    (async () => {
      await deleteFood(getState(), el.dataset.id);
      render(getState());
    })();
  },

  'lib-search-input': (el, ev) => {
    getState().lib.query = el.value;

    clearTimeout(libSearchTimeout);
    libSearchTimeout = setTimeout(async () => {
      if (el.value.trim().length >= 2) {
        try {
          const standardFoods = await searchStandardFoods(el.value);
          getState().lib.standardFoods = standardFoods.map(mapStandardFoodFromDB);
          render(getState());
        } catch (e) {
          console.error('Error searching standard foods:', e);
        }
      } else {
        getState().lib.standardFoods = [];
        render(getState());
      }
    }, 200);
  },

  'lib-form-input': (el, ev) => {
    getState().lib.form[el.dataset.field] = el.value;
  }
};
