import { getState } from '../state/state.js';
import { render } from '../app/render.js';
import { searchStandardFoods } from '../api/standard_foods.js';
import { mapStandardFoodFromDB } from '../utils/mapper.js';

function resetTabState(state, tab) {
  if (tab === "metas") { state.goalsForm = null; state.confirmDelete = false; state.selectedCalorieGoal = null; state.selectedMacroDistribution = null; }
  if (tab === "perfil") { state.biometricsForm = null; }
  if (tab === "historico") { state.selectedKey = null; }
  if (tab === "config") { state.importExport.showImport = false; }
  if (tab === "alimentos") {
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
}

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
    history.pushState({ tab: state.tab }, '', `#${state.tab}`);
    resetTabState(state, state.tab);
    state.sidebarOpen = false;
    render(state);
  }
};

export { resetTabState };
