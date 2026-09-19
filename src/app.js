import { initialState } from './state/state.js';
import { loadAll, persist } from './core/storage.js';
import { render } from './app/render.js';
import { setupEventHandlers } from './app/events.js';
import { STORAGE_KEYS } from './core/constants.js';

async function init() {
  // Carregar dados do localStorage
  const loaded = await loadAll();
  const state = { ...initialState, profile: loaded.profile, library: loaded.library, diary: loaded.diary };

  // Migrar dados antigos para nova estrutura (remover redundância meals)
  Object.keys(state.diary).forEach(key => {
    const day = state.diary[key];
    if (day.meals) {
      delete state.diary[key].meals;
      persist(STORAGE_KEYS.diary, state.diary);
    }
  });

  // Setup e renderização inicial
  const root = document.getElementById("root");
  setupEventHandlers(state, root);
  render(state);
}

init();
