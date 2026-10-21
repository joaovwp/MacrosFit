import { getState } from '../state/state.js';
import { render } from '../app/render.js';
import { searchFoods } from '../utils/search.js';

function resetTabState(state, tab) {
  if (tab === "metas") { state.goalsForm = null; state.confirmDelete = false; state.selectedCalorieGoal = null; state.selectedMacroDistribution = null; }
  if (tab === "perfil") { state.biometricsForm = null; }
  if (tab === "historico") { state.selectedKey = null; }
  if (tab === "config") { state.importExport.showImport = false; }
  if (tab === "alimentos") {
    state.lib.standardFoods = [];
    state.lib.filter = 'all';
    const results = searchFoods(state.foods, '');
    state.lib.standardFoods = results.map(f => ({
      id: f.slug,
      name: f.name,
      kcal: f.kcal_per_100,
      protein: f.protein_per_100,
      carbs: f.carbs_per_100,
      fat: f.fat_per_100,
      source: f.source // já normalizado pelo mapper
    }));
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
