import { initializeState, getState } from './state/state.js';
import { clearAppData } from './core/storage.js';
import { render } from './app/render.js';
import { setupEventHandlers } from './app/events.js';
import { getCurrentUser, onAuthStateChange, signOut } from './api/auth.js';
import { setupInactivityTracking, endSession } from './core/session.js';
import { dateKey, emptyDay } from './core/utils.js';
import { mapUserFoodFromDB } from './utils/mapper.js';

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

// Load data directly from APIs (replaces adapter wrappers)
async function loadData() {
  const [{ getProfile }, { getUserFoods }, { getAllMeals }] = await Promise.all([
    import('./api/profile.js'),
    import('./api/user_foods.js'),
    import('./api/meals.js')
  ]);

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const [profile, foods, meals] = await Promise.all([
    getProfile(),
    getUserFoods(),
    getAllMeals(user.id)
  ]);

  // Convert foods to map
  const library = {};
  foods.forEach(food => {
    const mapped = mapUserFoodFromDB(food);
    if (mapped) {
      library[mapped.id] = mapped;
    }
  });

  // Convert meals to diary format
  const diary = {};
  meals.forEach(meal => {
    const dateKeyStr = meal.date;
    if (!diary[dateKeyStr]) {
      diary[dateKeyStr] = emptyDay();
    }

    if (meal.meal_items) {
      meal.meal_items.forEach(item => {
        diary[dateKeyStr].entries.push({
          id: item.id,
          name: item.name,
          grams: item.grams,
          kcal: item.kcal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          per100: null,
          meal_id: meal.id,
          mealType: meal.meal_type,
          food_id: item.food_id
        });
      });
    }
  });

  return { profile, library, diary };
}

// Função para carregar perfil e dados do usuário
async function loadUserData(state, user) {
  try {
    // Load data from Supabase (includes profile)
    const loaded = await loadData();

    // Se perfil estiver desativado, fazer logout
    if (loaded.profile && loaded.profile.deactivatedAt) {
      await signOut();
      await clearAppData(user.id);
      state.auth.user = null;
      state.auth.mode = 'login';
      state.tab = 'auth';
      state.auth.error = 'Esta conta foi desativada';
      endSession();
      return false;
    }

    state.profile = loaded.profile;
    state.auth.user = user;
    state.tab = localStorage.getItem('ft-current-tab') || 'hoje';
    state.connectionError = null;
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

  // Inicializar estado encapsulado
  const state = initializeState();

  // Setup de eventos antes de renderizar
  const root = document.getElementById("root");
  setupEventHandlers(root);

  // Verificar autenticação antes de renderizar
  try {
    const user = await getCurrentUser();
    if (user) {
      const loaded = await loadUserData(state, user);
      if (loaded) {
        setupInactivityTracking(async () => {
          await signOut();
          state.auth.user = null;
          state.auth.mode = 'login';
          state.tab = 'auth';
          state.auth.error = 'Sessão expirada por inatividade';
          endSession();
          render(state);
        });
      }
    } else {
      state.tab = 'auth';
      state.auth.mode = 'login';
    }
  } catch (e) {
    console.error('Error checking auth:', e);
    state.tab = 'auth';
    state.auth.mode = 'login';
    state.auth.error = 'Sessão expirada, entre novamente';
  }

  // Renderizar apenas após verificar autenticação
  render(state);

  // onAuthStateChange só atualiza sessão em memória
  onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      state.auth.user = session.user;
      const loaded = await loadUserData(state, session.user);
      if (loaded) {
        setupInactivityTracking(async () => {
          await signOut();
          state.auth.user = null;
          state.auth.mode = 'login';
          state.tab = 'auth';
          state.auth.error = 'Sessão expirada por inatividade';
          endSession();
          render(state);
        });
      }
      render(state);
    } else if (event === 'SIGNED_OUT') {
      state.auth.user = null;
      state.auth.mode = 'login';
      state.tab = 'auth';
      endSession();
      render(state);
    }
  });
}

init();
