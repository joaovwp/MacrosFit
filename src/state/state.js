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
    msg: "",
    newFoodMode: false,
    newFoodForm: { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" },
    currentMealItems: [],
    conversionWarning: null
  },
  entryEdit: { id: null, val: "" },
  trendMetric: "calories",
  lib: {
    query: "",
    adding: false,
    form: { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" },
    editingId: null,
    conversionWarning: null
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
    mealImportData: ""
  },
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
  connectionError: null,
  notification: null // { message: string, type: 'success' | 'error' | 'info' }
};
