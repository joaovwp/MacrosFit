import { initialState } from './state/state.js';
import { loadAll, persist, clearAppData } from './core/storage.js';
import { render } from './app/render.js';
import { setupEventHandlers } from './app/events.js';
import { getCurrentUser, onAuthStateChange, signOut } from './api/auth.js';

// Limpar chaves globais antigas na primeira execução
function cleanupOldKeys() {
  const cleanupKey = 'ft-cleanup-v2';
  if (!localStorage.getItem(cleanupKey)) {
    localStorage.removeItem('ft-profile');
    localStorage.removeItem('ft-food-library');
    localStorage.removeItem('ft-diary');
    localStorage.setItem(cleanupKey, 'true');
  }
}

// Função para carregar perfil e dados do usuário
async function loadUserData(state, user) {
  try {
    const { getProfile } = await import('./api/profile.js');
    const profile = await getProfile();

    // Se perfil estiver desativado, fazer logout
    if (profile && profile.deactivatedAt) {
      await signOut();
      await clearAppData(user.id);
      state.auth.user = null;
      state.auth.mode = 'login';
      state.tab = 'auth';
      state.auth.error = 'Esta conta foi desativada';
      return false;
    }

    state.profile = profile;
    state.auth.user = user;
    state.tab = 'hoje';
    state.connectionError = null;

    // Load data from Supabase
    const loaded = await loadAll();
    state.library = loaded.library;
    state.diary = loaded.diary;
    return true;
  } catch (e) {
    console.error('Error loading user data:', e);
    state.connectionError = 'Erro ao carregar dados: ' + e.message + '. Tente novamente.';
    state.auth.user = user;
    state.tab = 'hoje';
    return false;
  }
}

async function init() {
  cleanupOldKeys();

  const state = { ...initialState };

  // Setup e renderização inicial
  const root = document.getElementById("root");
  setupEventHandlers(state, root);
  render(state);

  // Bootstrap único de auth
  try {
    const user = await getCurrentUser();
    if (user) {
      await loadUserData(state, user);
      render(state);
    } else {
      state.tab = 'auth';
      state.auth.mode = 'login';
      render(state);
    }
  } catch (e) {
    console.error('Error checking auth:', e);
    state.tab = 'auth';
    state.auth.mode = 'login';
    state.auth.error = 'Sessão expirada, entre novamente';
    render(state);
  }

  // onAuthStateChange só atualiza sessão em memória
  onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      state.auth.user = session.user;
      await loadUserData(state, session.user);
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
