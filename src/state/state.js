import { DEFAULT_PROFILE } from '../core/constants.js';

export const initialState = {
  profile: DEFAULT_PROFILE,
  library: {},
  diary: {},
  tab: "hoje",
  viewMonth: new Date(),
  selectedKey: null,
  qa: { 
    name: "", 
    grams: "", 
    mealType: "cafe", 
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
  expandedMeals: {},
  historyPeriod: 21,
  historyView: "overview",
};
