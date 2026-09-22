import { recentFoods, qaBasis, qaComputed } from '../state/selectors.js';
import {
  addEntry, deleteEntry, editEntryGrams, updateExtras,
  upsertFood, deleteFood, saveGoals, saveBiometrics,
  toggleSetting, resetAll, exportData, importData,
  exportMeal, exportMealInstance, importMeal,
  getAllRegisteredFoods, updateHistoryFoodMacros, updateHistoryFoodName, softDeleteFood
} from '../state/mutations.js';
import { uid, dateKey, emptyDay, normalize, calculateMacrosFromDistribution, calculateBMR, calculateTDEE } from '../core/utils.js';
import { ensureGoalsForm } from '../components/settings/goalsForm.js';
import { ensureBiometricsForm } from '../components/settings/biometricsForm.js';
import { render, scheduleRender, setTextInputActive } from './render.js';
import * as authApi from '../api/auth.js';
import * as profileApi from '../api/profile.js';
import { MACRO_DISTRIBUTIONS, CALORIE_GOALS } from '../core/constants.js';
import { macroDonut } from '../components/shared/macroDonut.js';

function updateInputValue(field, value) {
  const input = document.querySelector(`input[data-field="${field}"]`);
  if (input) {
    input.value = value;
  }
}

function updateMacroDonut(protein, carbs, fat) {
  const donutCard = document.getElementById('macro-distribution-card');
  if (!donutCard) return;
  
  const donut = donutCard.querySelector('.donut');
  if (!donut) return;
  
  const p = Math.max(0, protein * 4), c = Math.max(0, carbs * 4), f = Math.max(0, fat * 9);
  const total = p + c + f;
  let grad;
  if (total <= 0) {
    grad = "var(--surface2)";
  } else {
    const p1 = (p / total) * 100, p2 = p1 + (c / total) * 100;
    grad = `conic-gradient(var(--protein) 0 ${p1}%, var(--carbs) ${p1}% ${p2}%, var(--fat) ${p2}% 100%)`;
  }
  
  donut.style.background = grad;
  
  const kcalText = donut.querySelector('.mono');
  if (kcalText) {
    kcalText.textContent = Math.round(total);
  }
}

export function setupEventHandlers(state, root) {
  window.appState = state;
  
  // Sidebar resize logic
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  
  // Mobile swipe logic
  let touchStartX = 0;
  let touchEndX = 0;
  
  root.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "toggle-sidebar":
        window.appState.sidebarOpen = !window.appState.sidebarOpen;
        render(window.appState);
        break;
      case "collapse-sidebar":
        window.appState.sidebarCollapsed = !window.appState.sidebarCollapsed;
        render(window.appState);
        break;
      case "set-tab":
        window.appState.tab = el.dataset.tab;
        localStorage.setItem('ft-current-tab', window.appState.tab);
        if (window.appState.tab === "metas") { window.appState.goalsForm = null; window.appState.goalsSaved = false; window.appState.confirmDelete = false; window.appState.showMacroSuggestions = false; window.appState.selectedCalorieGoal = null; window.appState.selectedMacroDistribution = null; }
        if (window.appState.tab === "perfil") { window.appState.biometricsForm = null; window.appState.biometricsSaved = false; }
        if (window.appState.tab === "historico") { window.appState.selectedKey = null; }
        if (window.appState.tab === "config") { window.appState.importExport.showImport = false; window.appState.importExport.showMealImport = false; }
        window.appState.sidebarOpen = false;
        render(window.appState);
        break;
      case "qa-pick-recent": {
        const item = recentFoods(window.appState)[Number(el.dataset.index)];
        if (item) { window.appState.qa.name = item.name; window.appState.qa.grams = String(item.grams); window.appState.qa.manualOpen = false; window.appState.qa.showSuggest = false; render(window.appState); }
        break;
      }
      case "qa-pick-suggestion": {
        const food = window.appState.library[el.dataset.id];
        if (food) { window.appState.qa.name = food.name; window.appState.qa.manualOpen = false; window.appState.qa.showSuggest = false; render(window.appState); }
        break;
      }
      case "qa-meal-select":
        window.appState.qa.mealType = el.dataset.meal; render(window.appState);
        break;
      case "qa-open-manual":
        window.appState.qa.manualOpen = true; render(window.appState);
        break;
      case "qa-submit": {
        const name = window.appState.qa.name.trim();
        const grams = parseFloat(window.appState.qa.grams) || 0;
        if (!name || grams <= 0) break;
        const basis = qaBasis(window.appState);
        let totals, per100, savedNew = false;
        if (basis) {
          totals = { kcal: (basis.kcal * grams) / 100, protein: (basis.protein * grams) / 100, carbs: (basis.carbs * grams) / 100, fat: (basis.fat * grams) / 100 };
          per100 = basis;
        } else {
          const k = parseFloat(window.appState.qa.manual.kcal) || 0;
          if (k <= 0) break;
          totals = { kcal: k, protein: parseFloat(window.appState.qa.manual.protein) || 0, carbs: parseFloat(window.appState.qa.manual.carbs) || 0, fat: parseFloat(window.appState.qa.manual.fat) || 0 };
          per100 = { kcal: (totals.kcal / grams) * 100, protein: (totals.protein / grams) * 100, carbs: (totals.carbs / grams) * 100, fat: (totals.fat / grams) * 100 };
          savedNew = window.appState.qa.saveToLib;
        }
        (async () => {
          await addEntry(window.appState, { id: uid(), name, grams, ...totals, per100, time: Date.now() }, savedNew, window.appState.qa.targetDate);
          window.appState.qa.msg = `${name} adicionado`;
          window.appState.qa = { name: "", grams: "", mealType: window.appState.qa.mealType, targetDate: null, manualOpen: false, manual: { kcal: "", protein: "", carbs: "", fat: "" }, saveToLib: true, showSuggest: false, msg: "" };
          render(window.appState);
          setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 1800);
        })();
        break;
      }
      case "entry-edit-start":
        window.appState.entryEdit = { id: el.dataset.id, val: el.dataset.grams };
        render(window.appState);
        break;
      case "entry-edit-confirm": {
        const v = parseFloat(window.appState.entryEdit.val);
        (async () => {
          await editEntryGrams(window.appState, el.dataset.id, isNaN(v) ? Number(el.dataset.fallback) : v);
          window.appState.entryEdit = { id: null, val: "" };
          render(window.appState);
        })();
        break;
      }
      case "entry-edit-cancel":
        window.appState.entryEdit = { id: null, val: "" };
        render(window.appState);
        break;
      case "entry-delete":
        (async () => {
          await deleteEntry(window.appState, el.dataset.id);
          render(window.appState);
        })();
        break;
      case "toggle-meal":
        const instanceKey = el.dataset.instanceKey;
        window.appState.expandedMeals[instanceKey] = !window.appState.expandedMeals[instanceKey];
        render(window.appState);
        break;
      case "extras-water-add": {
        const today = window.appState.diary[dateKey(new Date())] || emptyDay();
        (async () => {
          await updateExtras(window.appState, { ...today, water: (today.water || 0) + Number(el.dataset.amt) });
          render(window.appState);
        })();
        break;
      }
      case "extras-water-reset": {
        const today = window.appState.diary[dateKey(new Date())] || emptyDay();
        (async () => {
          await updateExtras(window.appState, { ...today, water: 0 });
          render(window.appState);
        })();
        break;
      }
      case "extras-workout-toggle": {
        const today = window.appState.diary[dateKey(new Date())] || emptyDay();
        (async () => {
          await updateExtras(window.appState, { ...today, workout: { ...today.workout, done: ev.target.checked } });
          render(window.appState);
        })();
        break;
      }
      case "cal-prev":
        window.appState.viewMonth = new Date(window.appState.viewMonth.getFullYear(), window.appState.viewMonth.getMonth() - 1, 1); render(window.appState);
        break;
      case "cal-next":
        window.appState.viewMonth = new Date(window.appState.viewMonth.getFullYear(), window.appState.viewMonth.getMonth() + 1, 1); render(window.appState);
        break;
      case "cal-select-day":
        window.appState.selectedKey = el.dataset.key; render(window.appState);
        break;
      case "daydetail-close":
        window.appState.selectedKey = null; render(window.appState);
        break;
      case "trend-set-metric":
        window.appState.trendMetric = el.dataset.metric; render(window.appState);
        break;
      case "set-period":
        window.appState.historyPeriod = parseInt(el.dataset.period); render(window.appState);
        break;
      case "lib-toggle-add":
        window.appState.lib.adding = !window.appState.lib.adding; window.appState.lib.editingId = null; window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" }; render(window.appState);
        break;
      case "lib-cancel-add":
        window.appState.lib.adding = false; window.appState.lib.editingId = null; window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" }; render(window.appState);
        break;
      case "lib-submit": {
        const f = window.appState.lib.form;
        if (!f.name.trim() || !f.kcal) break;
        (async () => {
          await upsertFood(window.appState, { id: window.appState.lib.editingId || uid(), name: f.name.trim(), kcal: parseFloat(f.kcal) || 0, protein: parseFloat(f.protein) || 0, carbs: parseFloat(f.carbs) || 0, fat: parseFloat(f.fat) || 0, is_active: true });
          window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" }; window.appState.lib.editingId = null; window.appState.lib.adding = false;
          render(window.appState);
        })();
        break;
      }
      case "lib-edit": {
        const f = window.appState.library[el.dataset.id];
        if (f) { window.appState.lib.editingId = f.id; window.appState.lib.form = { name: f.name, kcal: String(f.kcal), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat) }; window.appState.lib.adding = true; render(window.appState); }
        break;
      }
      case "lib-delete":
        (async () => {
          await softDeleteFood(window.appState, el.dataset.id);
          render(window.appState);
        })();
        break;
      case "lib-add-from-history": {
        const foodName = el.dataset.name;
        const registeredList = getAllRegisteredFoods(window.appState);
        const food = registeredList.find(f => normalize(f.name) === normalize(foodName));
        if (food && food.per100) {
          window.appState.lib.adding = true;
          window.appState.lib.form = { 
            name: food.name, 
            kcal: String(food.per100.kcal), 
            protein: String(food.per100.protein), 
            carbs: String(food.per100.carbs), 
            fat: String(food.per100.fat) 
          };
          render(window.appState);
        }
        break;
      }
      case "lib-edit-history": {
        const foodName = el.dataset.name;
        const registeredList = getAllRegisteredFoods(window.appState);
        const food = registeredList.find(f => normalize(f.name) === normalize(foodName));
        if (food && food.per100) {
          window.appState.lib.editingHistory = foodName;
          window.appState.lib.form = { 
            name: food.name, 
            kcal: String(food.per100.kcal), 
            protein: String(food.per100.protein), 
            carbs: String(food.per100.carbs), 
            fat: String(food.per100.fat) 
          };
          render(window.appState);
        }
        break;
      }
      case "lib-save-history": {
        if (!window.appState.lib.editingHistory) break;
        const oldName = window.appState.lib.editingHistory;
        const newName = window.appState.lib.form.name.trim();
        const newPer100 = {
          kcal: parseFloat(window.appState.lib.form.kcal) || 0,
          protein: parseFloat(window.appState.lib.form.protein) || 0,
          carbs: parseFloat(window.appState.lib.form.carbs) || 0,
          fat: parseFloat(window.appState.lib.form.fat) || 0
        };
        const recalcHistory = window.appState.lib.recalcHistory || false;

        (async () => {
          if (normalize(oldName) !== normalize(newName)) {
            await updateHistoryFoodName(window.appState, oldName, newName);
          }

          await updateHistoryFoodMacros(window.appState, newName, newPer100, recalcHistory);
          window.appState.lib.editingHistory = null;
          window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" };
          window.appState.lib.recalcHistory = false;
          window.appState.qa.msg = "Alimento atualizado em todo o histórico";
          render(window.appState);
          setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 2000);
        })();
        break;
      }
      case "lib-cancel-history": {
        window.appState.lib.editingHistory = null;
        window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "" };
        window.appState.lib.recalcHistory = false;
        render(window.appState);
        break;
      }
      case "lib-recalc-history-toggle": {
        window.appState.lib.recalcHistory = el.checked;
        break;
      }
      case "goals-save": {
        ensureGoalsForm(window.appState);
        const f = window.appState.goalsForm;
        if (!f.calories || (typeof f.calories === 'string' && f.calories.trim() === "")) break;
        (async () => {
          await saveGoals(window.appState, { 
            calories: parseFloat(f.calories), 
            protein: f.protein ? parseFloat(f.protein) : null, 
            carbs: f.carbs ? parseFloat(f.carbs) : null, 
            fat: f.fat ? parseFloat(f.fat) : null 
          });
          window.appState.goalsSaved = true; render(window.appState);
          setTimeout(() => { window.appState.goalsSaved = false; render(window.appState); }, 1800);
        })();
        break;
      }
      case "bio-save": {
        ensureBiometricsForm(window.appState);
        const f = window.appState.biometricsForm;
        if (!f.weight || !f.height || !f.birthDate || !f.gender || !f.activityLevel) break;
        (async () => {
          await saveBiometrics(window.appState, {
            weight: parseFloat(f.weight),
            height: parseFloat(f.height),
            birthDate: f.birthDate,
            gender: f.gender,
            activityLevel: f.activityLevel
          });
          window.appState.biometricsSaved = true;
          render(window.appState);
          setTimeout(() => { window.appState.biometricsSaved = false; render(window.appState); }, 1800);
        })();
        break;
      }
      case "settings-toggle": {
        const key = el.dataset.key;
        (async () => {
          await toggleSetting(window.appState, key, !window.appState.profile.settings[key]);
          render(window.appState);
        })();
        break;
      }
      case "reset-ask": window.appState.confirmDelete = true; render(window.appState); break;
      case "reset-cancel": window.appState.confirmDelete = false; render(window.appState); break;
      case "reset-confirm": (async () => { await resetAll(window.appState); render(window.appState); })(); break;
      case "export-data":
        exportData(window.appState);
        break;
      case "show-import":
        window.appState.importExport.showImport = true; window.appState.importExport.importData = ""; render(window.appState);
        break;
      case "cancel-import":
        window.appState.importExport.showImport = false; window.appState.importExport.importData = ""; render(window.appState);
        break;
      case "import-data":
        (async () => {
          await importData(window.appState);
          render(window.appState);
        })();
        break;
      case "show-meal-import":
        window.appState.importExport.showMealImport = true; window.appState.importExport.mealImportData = ""; render(window.appState);
        break;
      case "cancel-meal-import":
        window.appState.importExport.showMealImport = false; window.appState.importExport.mealImportData = ""; render(window.appState);
        break;
      case "import-meal":
        (async () => {
          await importMeal(window.appState);
          render(window.appState);
        })();
        break;
      case "export-meal":
        exportMeal(window.appState, el.dataset.meal, dateKey(new Date()));
        break;
      case "export-meal-instance":
        exportMealInstance(window.appState, el.dataset.instanceId, el.dataset.meal, dateKey(new Date()));
        break;
      case "auth-toggle-mode":
        window.appState.auth.mode = window.appState.auth.mode === 'login' ? 'signup' : 'login';
        window.appState.auth.error = null;
        render(window.appState);
        break;
      case "auth-submit": {
        const { email, password, displayName } = window.appState.auth;
        if (!email || !password) {
          window.appState.auth.error = "Preencha e-mail e senha";
          render(window.appState);
          break;
        }
        if (window.appState.auth.mode === 'signup' && !displayName) {
          window.appState.auth.error = "Preencha seu nome";
          render(window.appState);
          break;
        }
        window.appState.auth.loading = true;
        window.appState.auth.error = null;
        render(window.appState);
        (async () => {
          try {
            if (window.appState.auth.mode === 'signup') {
              const result = await authApi.signUp(email, password, displayName);
              if (result.requiresConfirmation) {
                window.appState.auth.loading = false;
                window.appState.auth.error = "Verifique seu e-mail para confirmar a conta";
                render(window.appState);
                return;
              }
            } else {
              await authApi.signIn(email, password);
            }
            const user = await authApi.getCurrentUser();
            if (!user) throw new Error('Usuário não encontrado após login');

            window.appState.auth.user = user;
            window.appState.auth.loading = false;

            // Carregar perfil diretamente para garantir dados corretos
            const { getProfile } = await import('../api/profile.js');
            const profile = await getProfile();
            window.appState.profile = profile;

            // Carregar outros dados
            const { loadAll } = await import('../core/storage.js');
            const loaded = await loadAll();
            window.appState.library = loaded.library;
            window.appState.diary = loaded.diary;

            window.appState.tab = localStorage.getItem('ft-current-tab') || 'hoje';
            window.appState.connectionError = null;

            render(window.appState);
          } catch (e) {
            window.appState.auth.loading = false;
            window.appState.auth.error = e.message || "Erro ao autenticar";
            render(window.appState);
          }
        })();
        break;
      }
      case "auth-reset-password": {
        const email = window.appState.auth.email;
        if (!email) {
          window.appState.auth.error = "Preencha seu e-mail";
          render(window.appState);
          break;
        }
        (async () => {
          try {
            await authApi.resetPasswordForEmail(email);
            window.appState.auth.error = null;
            window.appState.auth.loading = false;
            alert("E-mail de recuperação enviado");
            render(window.appState);
          } catch (e) {
            window.appState.auth.error = e.message || "Erro ao enviar e-mail";
            render(window.appState);
          }
        })();
        break;
      }
      case "profile-edit":
        window.appState.profileTab.editing = true;
        window.appState.profileTab.form.displayName = window.appState.profile.display_name || '';
        window.appState.profileTab.form.email = window.appState.auth.user?.email || '';
        render(window.appState);
        break;
      case "profile-cancel-edit":
        window.appState.profileTab.editing = false;
        window.appState.profileTab.saved = false;
        window.appState.profileTab.form = {
          displayName: '',
          email: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        render(window.appState);
        break;
      case "profile-save": {
        const { displayName, email } = window.appState.profileTab.form;
        if (!displayName || !email) {
          alert("Preencha todos os campos");
          break;
        }
        (async () => {
          try {
            await profileApi.updateProfile({ display_name: displayName });
            if (email !== window.appState.auth.user.email) {
              await authApi.updateEmail(email);
            }
            window.appState.profile.display_name = displayName;
            window.appState.profileTab.editing = false;
            window.appState.profileTab.saved = true;
            window.appState.connectionError = null;
            render(window.appState);
            setTimeout(() => { window.appState.profileTab.saved = false; render(window.appState); }, 1800);
          } catch (e) {
            window.appState.connectionError = 'Erro ao salvar perfil: ' + e.message;
            render(window.appState);
          }
        })();
        break;
      }
      case "profile-show-change-password":
        window.appState.profileTab.showChangePassword = true;
        render(window.appState);
        break;
      case "profile-cancel-change-password":
        window.appState.profileTab.showChangePassword = false;
        window.appState.profileTab.passwordChanged = false;
        window.appState.profileTab.form.currentPassword = '';
        window.appState.profileTab.form.newPassword = '';
        window.appState.profileTab.form.confirmPassword = '';
        render(window.appState);
        break;
      case "profile-change-password": {
        const { currentPassword, newPassword, confirmPassword } = window.appState.profileTab.form;
        if (!currentPassword || !newPassword || !confirmPassword) {
          alert("Preencha todos os campos");
          break;
        }
        if (newPassword !== confirmPassword) {
          alert("As senhas não coincidem");
          break;
        }
        (async () => {
          try {
            await authApi.updatePassword(newPassword);
            window.appState.profileTab.showChangePassword = false;
            window.appState.profileTab.passwordChanged = true;
            window.appState.profileTab.form.currentPassword = '';
            window.appState.profileTab.form.newPassword = '';
            window.appState.profileTab.form.confirmPassword = '';
            window.appState.connectionError = null;
            render(window.appState);
            setTimeout(() => { window.appState.profileTab.passwordChanged = false; render(window.appState); }, 1800);
          } catch (e) {
            window.appState.connectionError = 'Erro ao alterar senha: ' + e.message;
            render(window.appState);
          }
        })();
        break;
      }
      case "profile-show-delete":
        window.appState.profileTab.showDeleteConfirm = true;
        render(window.appState);
        break;
      case "profile-cancel-delete":
        window.appState.profileTab.showDeleteConfirm = false;
        render(window.appState);
        break;
      case "profile-confirm-deactivate": {
        (async () => {
          try {
            await profileApi.deactivateAccount();
            await authApi.signOut();
            window.appState.auth.user = null;
            window.appState.auth.mode = 'login';
            window.appState.tab = 'auth';
            window.appState.profileTab.showDeleteConfirm = false;
            const { clearAppData } = await import('../core/storage.js');
            await clearAppData('deactivated-user');
            render(window.appState);
          } catch (e) {
            alert("Erro ao desativar conta: " + e.message);
          }
        })();
        break;
      }
      case "profile-logout": {
        (async () => {
          try {
            await authApi.signOut();
            window.appState.auth.user = null;
            window.appState.auth.mode = 'login';
            window.appState.tab = 'auth';
            const { clearAppData } = await import('../core/storage.js');
            await clearAppData(window.appState.auth.user?.id || 'unknown');
            render(window.appState);
          } catch (e) {
            console.error('Error signing out:', e);
          }
        })();
        break;
      }
    }
  });

  root.addEventListener("input", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    
    setTextInputActive(true);
    
    switch (action) {
      case "qa-name-input":
        window.appState.qa.name = el.value; window.appState.qa.showSuggest = true;
        if (qaBasis(window.appState)) window.appState.qa.manualOpen = false;
        if (window.appState.qa.showSuggest) {
          scheduleRender(window.appState);
        }
        break;
      case "qa-grams-input":
        window.appState.qa.grams = el.value;
        const computed = qaComputed(window.appState);
        if (computed) {
          scheduleRender(window.appState);
        }
        break;
      case "qa-date-input":
        window.appState.qa.targetDate = el.value || null;
        break;
      case "qa-manual-input":
        window.appState.qa.manual[el.dataset.field] = el.value;
        scheduleRender(window.appState);
        break;
      case "entry-edit-input":
        window.appState.entryEdit.val = el.value;
        scheduleRender(window.appState);
        break;
      case "extras-weight-input":
        break;
      case "lib-search-input":
        window.appState.lib.query = el.value;
        scheduleRender(window.appState);
        break;
      case "lib-form-input":
        window.appState.lib.form[el.dataset.field] = el.value;
        scheduleRender(window.appState);
        break;
      case "goal-input":
        ensureGoalsForm(window.appState); window.appState.goalsForm[el.dataset.field] = el.value;
        scheduleRender(window.appState);
        break;
      case "profile-display-name-input":
        window.appState.profileTab.form.displayName = el.value;
        break;
      case "profile-email-input":
        window.appState.profileTab.form.email = el.value;
        break;
      case "profile-current-password-input":
        window.appState.profileTab.form.currentPassword = el.value;
        break;
      case "profile-new-password-input":
        window.appState.profileTab.form.newPassword = el.value;
        break;
      case "profile-confirm-password-input":
        window.appState.profileTab.form.confirmPassword = el.value;
        break;
      case "import-text-input":
        window.appState.importExport.importData = el.value;
        break;
      case "meal-import-text-input":
        window.appState.importExport.mealImportData = el.value;
        break;
      case "auth-email-input":
        window.appState.auth.email = el.value;
        break;
      case "auth-password-input":
        window.appState.auth.password = el.value;
        break;
      case "auth-display-name-input":
        window.appState.auth.displayName = el.value;
        break;
      case "profile-display-name-input":
        window.appState.profileTab.form.displayName = el.value;
        break;
      case "profile-email-input":
        window.appState.profileTab.form.email = el.value;
        break;
      case "profile-current-password-input":
        window.appState.profileTab.form.currentPassword = el.value;
        break;
      case "profile-new-password-input":
        window.appState.profileTab.form.newPassword = el.value;
        break;
      case "profile-confirm-password-input":
        window.appState.profileTab.form.confirmPassword = el.value;
        break;
    }
    
    setTimeout(() => { setTextInputActive(false); }, 100);
  });

  root.addEventListener("change", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "qa-savelib-toggle") { window.appState.qa.saveToLib = el.checked; render(window.appState); }
    if (el.dataset.action === "extras-weight-input") {
      const today = window.appState.diary[dateKey(new Date())] || emptyDay();
      const v = parseFloat(el.value);
      updateExtras(window.appState, { ...today, weight: isNaN(v) ? null : v });
      render(window.appState);
    }
    if (el.dataset.action === "calorie-goal-select") {
      const goalId = el.value;
      const goal = CALORIE_GOALS.find(g => g.id === goalId);
      if (!goal) return;
      
      const bio = window.appState.profile.biometrics;
      if (!bio || !bio.weight || !bio.height || !bio.birthDate || !bio.gender || !bio.activityLevel) return;
      
      const bmr = calculateBMR(bio.weight, bio.height, bio.birthDate, bio.gender);
      const tdee = calculateTDEE(bmr, bio.activityLevel);
      if (!tdee) return;
      
      ensureGoalsForm(window.appState);
      window.appState.goalsForm.calories = String(tdee + goal.delta);
      window.appState.selectedCalorieGoal = goalId;
      
      updateInputValue("calories", window.appState.goalsForm.calories);
    }
    if (el.dataset.action === "macro-distribution-select") {
      const distId = el.value;
      const distribution = MACRO_DISTRIBUTIONS.find(d => d.id === distId);
      if (!distribution) return;
      
      ensureGoalsForm(window.appState);
      const weight = window.appState.profile.biometrics?.weight;
      const macros = calculateMacrosFromDistribution(window.appState.goalsForm.calories, distribution, weight);
      
      if (macros) {
        window.appState.goalsForm.protein = String(macros.protein);
        window.appState.goalsForm.carbs = String(macros.carbs);
        window.appState.goalsForm.fat = String(macros.fat);
        window.appState.selectedMacroDistribution = distId;
        
        updateInputValue("protein", window.appState.goalsForm.protein);
        updateInputValue("carbs", window.appState.goalsForm.carbs);
        updateInputValue("fat", window.appState.goalsForm.fat);
        updateMacroDonut(macros.protein, macros.carbs, macros.fat);
      }
    }
    if (el.dataset.action === "bio-input") {
      ensureBiometricsForm(window.appState); window.appState.biometricsForm[el.dataset.field] = el.value;
      render(window.appState);
    }
  });

  let suggestTimeout = null;
  root.addEventListener("focusin", (ev) => {
    const el = ev.target.closest("[data-action='qa-name-input']");
    if (el) { 
      window.appState.qa.showSuggest = true; 
      scheduleRender(window.appState);
    }
  });
  root.addEventListener("focusout", (ev) => {
    const el = ev.target.closest("[data-action='qa-name-input']");
    if (el) { 
      if (suggestTimeout) clearTimeout(suggestTimeout);
      suggestTimeout = setTimeout(() => { 
        if (!document.querySelector(".suggest:hover")) {
          window.appState.qa.showSuggest = false; 
          scheduleRender(window.appState);
        }
      }, 250);
    }
  });
  
  // Sidebar resize (desktop)
  root.addEventListener("mousedown", (ev) => {
    const resizeHandle = ev.target.closest("[data-action='resize-sidebar']");
    if (resizeHandle) {
      isResizing = true;
      startX = ev.clientX;
      const sidebar = document.querySelector(".sidebar");
      startWidth = sidebar ? sidebar.offsetWidth : 220;
      ev.preventDefault();
    }
  });
  
  document.addEventListener("mousemove", (ev) => {
    if (isResizing) {
      const diff = ev.clientX - startX;
      const newWidth = Math.max(64, Math.min(400, startWidth + diff));
      const sidebar = document.querySelector(".sidebar");
      const mainContent = document.querySelector(".main-content");
      if (sidebar) sidebar.style.width = newWidth + "px";
      if (mainContent) mainContent.style.marginLeft = newWidth + "px";
    }
  });
  
  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      window.appState.sidebarCollapsed = false;
      render(window.appState);
    }
  });
  
  // Mobile swipe
  root.addEventListener("touchstart", (ev) => {
    touchStartX = ev.changedTouches[0].screenX;
  }, { passive: true });
  
  root.addEventListener("touchend", (ev) => {
    touchEndX = ev.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && window.appState.sidebarOpen) {
        window.appState.sidebarOpen = false;
        render(window.appState);
      } else if (diff < 0 && !window.appState.sidebarOpen) {
        window.appState.sidebarOpen = true;
        render(window.appState);
      }
    }
  }
}
