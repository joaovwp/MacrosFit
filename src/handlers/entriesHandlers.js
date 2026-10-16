import { getState } from '../state/state.js';
import { render } from '../app/render.js';
import { deleteMeal, loadMealForEdit } from '../state/mutations.js';
import { showNotification } from '../state/state.js';

export const entriesHandlers = {
  'toggle-meal': (el, ev) => {
    const mealKey = el.dataset.mealKey;
    getState().expandedMeals[mealKey] = !getState().expandedMeals[mealKey];
    render(getState());
  },

  'delete-meal': (el, ev) => {
    (async () => {
      try {
        await deleteMeal(getState(), el.dataset.mealId);
        showNotification("Refeição excluída com sucesso!", 'success');
        render(getState());
      } catch (e) {
        showNotification("Erro ao excluir refeição", 'error');
        render(getState());
      }
    })();
  },

  'edit-meal': (el, ev) => {
    (async () => {
      try {
        await loadMealForEdit(getState(), el.dataset.mealId, el.dataset.mealType, el.dataset.mealDate);
        getState().tab = "hoje";
        showNotification("Refeição carregada para edição", 'success');
        render(getState());
      } catch (e) {
        showNotification("Erro ao carregar refeição para edição", 'error');
        render(getState());
      }
    })();
  }
};
