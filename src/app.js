import { initialState } from './state/state.js';
import { loadAll, persist, clearAll } from './core/storage.js';
import { render } from './app/render.js';
import { setupEventHandlers } from './app/events.js';
import { STORAGE_KEYS } from './core/constants.js';
import { getCurrentUser, onAuthStateChange, signOut } from './api/auth.js';

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

  // Check if user is authenticated
  try {
    const user = await getCurrentUser();
    if (user) {
      // Load profile from Supabase to check if deactivated
      const { getProfile } = await import('./api/profile.js');
      const profile = await getProfile();

      if (profile && profile.deactivated_at) {
        // Account is deactivated, sign out
        await signOut();
        await clearAll();
        state.tab = 'auth';
        state.auth.mode = 'login';
        state.auth.error = 'Esta conta foi excluída';
        render(state);
        return;
      }

      state.profile = profile || state.profile;
      state.auth.user = user;
      state.tab = 'hoje';
    } else {
      state.tab = 'auth';
    }
  } catch (e) {
    console.error('Error checking auth:', e);
    state.tab = 'auth';
  }

  // Setup e renderização inicial
  const root = document.getElementById("root");
  setupEventHandlers(state, root);
  render(state);

  // Listen for auth state changes
  onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Load profile from Supabase to check if deactivated
      try {
        const { getProfile } = await import('./api/profile.js');
        const profile = await getProfile();

        if (profile && profile.deactivated_at) {
          // Account is deactivated, sign out
          await signOut();
          await clearAll();
          state.auth.user = null;
          state.auth.mode = 'login';
          state.tab = 'auth';
          state.auth.error = 'Esta conta foi excluída';
          render(state);
          return;
        }

        state.profile = profile || state.profile;
      } catch (e) {
        console.error('Error loading profile on sign in:', e);
      }

      state.auth.user = session.user;
      state.tab = 'hoje';
      render(state);
    } else if (event === 'SIGNED_OUT') {
      state.auth.user = null;
      state.auth.mode = 'login';
      state.tab = 'auth';
      render(state);
    }
  });
}

init();
