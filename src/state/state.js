import { render } from '../app/render.js';

export const initialState = {
  profile: null,
  library: {},
  diary: {},
  tab: "hoje",
  sidebarOpen: false,
  viewMonth: new Date(),
  selectedKey: null,
  qa: {
    name: "",
    grams: "",
    mealType: "cafe",
    targetDate: null,
    manualOpen: false,
    manual: { kcal: "", protein: "", carbs: "", fat: "" },
    showSuggest: false,
    saving: false,
    newFoodMode: false,
    newFoodForm: { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" },
    currentMealItems: [],
    conversionWarning: null,
    standardSuggestions: [],
    editingItemIndex: null
  },
  entryEdit: { id: null, val: "" },
  trendMetric: "calories",
  lib: {
    query: "",
    adding: false,
    saving: false,
    form: { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" },
    editingId: null,
    conversionWarning: null,
    standardFoods: []
  },
  goalsForm: null,
  goalsSaving: false,
  selectedCalorieGoal: null,
  selectedMacroDistribution: null,
  confirmDelete: false,
  importExport: {
    showImport: false,
    showExport: false,
    importData: "",
    mealImportData: "",
    showMealImport: false,
    showMealImportExample: false
  },
  biometricsForm: null,
  biometricsSaving: false,
  expandedMeals: {},
  historyPeriod: 21,
  historyView: "overview",
  auth: {
    mode: 'login',
    email: '',
    password: '',
    displayName: '',
    loading: false,
    error: null,
    user: null
  },
  profileTab: {
    editing: false,
    saving: false,
    form: {
      displayName: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    showDeleteConfirm: false
  },
  connectionError: null,
  notification: null // { message: string, type: 'success' | 'error' | 'info' }
};

// Estado encapsulado em closure
let appState = null;
let notificationTimeout = null;

// Inicializar estado
export function initializeState() {
  appState = { ...initialState };
  return appState;
}

// Obter estado atual (retorna referência direta para permitir mutações)
// Nota: Isso permite mutações diretas, o que é aceitável para o tamanho do projeto
export function getState() {
  if (!appState) {
    appState = { ...initialState };
  }
  return appState;
}

// Mostrar notificação
export function showNotification(message, type = 'info', duration = 3000) {
  if (!appState) {
    appState = { ...initialState };
  }
  appState.notification = { message, type };

  // Limpar timeout anterior se existir
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  // Limpar notificação automaticamente após a duração
  notificationTimeout = setTimeout(() => {
    clearNotification();
    render(getState());
  }, duration);
}

// Limpar notificação
export function clearNotification() {
  if (!appState) {
    appState = { ...initialState };
  }
  appState.notification = null;
}
