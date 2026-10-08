import { getState } from '../state/state.js';
import { render } from '../app/render.js';
import { deleteEntry, editEntryGrams, deleteMeal } from '../state/mutations.js';
import { showNotification } from '../state/state.js';

export const entriesHandlers = {
  'entry-edit-start': (el, ev) => {
    getState().entryEdit = { id: el.dataset.id, val: el.dataset.grams };
    render(getState());
  },

  'entry-edit-confirm': (el, ev) => {
    const v = parseFloat(getState().entryEdit.val);
    (async () => {
      await editEntryGrams(getState(), el.dataset.id, isNaN(v) ? Number(el.dataset.fallback) : v);
      getState().entryEdit = { id: null, val: "" };
      render(getState());
    })();
  },

  'entry-edit-cancel': (el, ev) => {
    getState().entryEdit = { id: null, val: "" };
    render(getState());
  },

  'entry-delete': (el, ev) => {
    (async () => {
      await deleteEntry(getState(), el.dataset.id);
      render(getState());
    })();
  },

  'entry-edit-input': (el, ev) => {
    getState().entryEdit.val = el.value;
  },

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
  }
};
