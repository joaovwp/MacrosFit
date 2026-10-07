import { getState } from '../state/state.js';
import { render } from '../app/render.js';
import { searchStandardFoods } from '../api/standard_foods.js';
import { mapStandardFoodFromDB } from '../utils/mapper.js';

export const navigationHandlers = {
  'toggle-sidebar': (el, ev) => {
    const state = getState();
    state.sidebarOpen = !state.sidebarOpen;
    render(state);
  },

  'set-tab': (el, ev) => {
    const state = getState();
    state.tab = el.dataset.tab;
    localStorage.setItem('ft-current-tab', state.tab);
    if (state.tab === "metas") { state.goalsForm = null; state.confirmDelete = false; state.selectedCalorieGoal = null; state.selectedMacroDistribution = null; }
    if (state.tab === "perfil") { state.biometricsForm = null; }
    if (state.tab === "historico") { state.selectedKey = null; }
    if (state.tab === "config") { state.importExport.showImport = false; }
    if (state.tab === "alimentos") {
      state.lib.standardFoods = [];
      state.lib.filter = 'all';
      (async () => {
        try {
          const standardFoods = await searchStandardFoods('', true);
          state.lib.standardFoods = standardFoods.map(mapStandardFoodFromDB);
          render(state);
        } catch (e) {
          console.error('Error loading standard foods:', e);
          state.lib.standardFoods = [];
          render(state);
        }
      })();
    }
    state.sidebarOpen = false;
    render(state);
  }
};
