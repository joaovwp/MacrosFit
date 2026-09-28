import { getState } from '../state/state.js';
import { render } from '../app/render.js';
import { dateKey } from '../core/utils.js';
import { groupEntriesByMealId } from '../state/selectors.js';

export const historyHandlers = {
  'cal-prev': (el, ev) => {
    getState().viewMonth = new Date(getState().viewMonth.getFullYear(), getState().viewMonth.getMonth() - 1, 1);
    render(getState());
  },

  'cal-next': (el, ev) => {
    getState().viewMonth = new Date(getState().viewMonth.getFullYear(), getState().viewMonth.getMonth() + 1, 1);
    render(getState());
  },

  'cal-select-day': (el, ev) => {
    const state = getState();
    state.selectedKey = el.dataset.key;
    
    // Inicializar expandedMeals com as refeições do dia selecionado
    const day = state.diary[state.selectedKey] || { entries: [] };
    const meals = groupEntriesByMealId(day);
    state.expandedMeals = {};
    meals.forEach(meal => {
      const mealKey = meal.meal_id || meal.mealType;
      state.expandedMeals[mealKey] = true;
    });
    
    render(state);
  },

  'daydetail-close': (el, ev) => {
    getState().selectedKey = null;
    render(getState());
  },

  'trend-set-metric': (el, ev) => {
    getState().trendMetric = el.dataset.metric;
    render(getState());
  },

  'set-period': (el, ev) => {
    getState().historyPeriod = parseInt(el.dataset.period);
    render(getState());
  }
};
