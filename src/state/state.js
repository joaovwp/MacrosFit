export const initialState = {
  profile: null,
  library: {},
  diary: {},
  tab: "hoje",
  sidebarCollapsed: false,
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
    saveToLib: true,
    showSuggest: false,
    msg: ""
  },
  entryEdit: { id: null, val: "" },
  trendMetric: "calories",
  lib: {
    query: "",
    adding: false,
    form: { name: "", kcal: "", protein: "", carbs: "", fat: "" },
    editingId: null,
    editingHistory: null,
    recalcHistory: false
  },
  goalsForm: null,
  goalsSaved: false,
  selectedCalorieGoal: null,
  selectedMacroDistribution: null,
  confirmDelete: false,
  importExport: {
    showImport: false,
    showExport: false,
    importData: "",
    showMealImport: false,
    mealImportData: ""
  },
  appSettings: { theme: "dark", language: "pt-BR" },
  biometricsForm: null,
  biometricsSaved: false,
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
    saved: false,
    passwordChanged: false,
    form: {
      displayName: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    showDeleteConfirm: false
  },
  connectionError: null
};
