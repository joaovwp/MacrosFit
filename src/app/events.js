import { recentFoods, qaBasis, qaComputed } from '../state/selectors.js';
import {
  addEntry, deleteEntry, editEntryGrams,
  deleteFood, resetAll, exportData, importData,
  exportMeal, importMeal, createUserFood, createUserFoodWithDetection, updateUserFood,
  addTemporaryMealItem, removeTemporaryMealItem, clearTemporaryMealItems, saveCompleteMeal
} from '../state/mutations.js';
import { uid, dateKey, emptyDay, normalize, calculateMacrosFromDistribution, calculateBMR, calculateTDEE, round, esc } from '../core/utils.js';
import { ensureGoalsForm } from '../components/settings/goalsForm.js';
import { ensureBiometricsForm } from '../components/settings/biometricsForm.js';
import { render } from './render.js';
import * as authApi from '../api/auth.js';
import * as profileApi from '../api/profile.js';
import { searchStandardFoods } from '../api/standard_foods.js';
import { mapStandardFoodFromDB } from '../utils/mapper.js';
import { MACRO_DISTRIBUTIONS, CALORIE_GOALS } from '../core/constants.js';
import { handleError } from '../core/errorHandler.js';
import { getState, showNotification, clearNotification } from '../state/appState.js';

function updateInputValue(field, value) {
  const input = document.querySelector(`input[data-field="${field}"]`);
  if (input) {
    input.value = value;
  }
}

export function setupEventHandlers(root) {
  // Estado encapsulado, acessível via getState()

  // Debounce timers
  let libSearchTimeout = null;
  let qaSearchTimeout = null;

  root.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "toggle-sidebar":
        const state = getState();
        state.sidebarOpen = !state.sidebarOpen;
        render(state);
        break;
      case "set-tab":
        const state2 = getState();
        state2.tab = el.dataset.tab;
        localStorage.setItem('ft-current-tab', state2.tab);
        if (state2.tab === "metas") { state2.goalsForm = null; state2.goalsSaved = false; state2.confirmDelete = false; state2.selectedCalorieGoal = null; state2.selectedMacroDistribution = null; }
        if (state2.tab === "perfil") { state2.biometricsForm = null; state2.biometricsSaved = false; }
        if (state2.tab === "historico") { state2.selectedKey = null; }
        if (state2.tab === "config") { state2.importExport.showImport = false; }
        if (state2.tab === "alimentos") {
          state2.lib.standardFoods = [];
          (async () => {
            try {
              const standardFoods = await searchStandardFoods('');
              state2.lib.standardFoods = standardFoods.map(mapStandardFoodFromDB);
              render(state2);
            } catch (e) {
              console.error('Error loading standard foods:', e);
              state2.lib.standardFoods = [];
              render(state2);
            }
          })();
        }
        state2.sidebarOpen = false;
        render(state2);
        break;
      case "qa-pick-recent": {
        const item = recentFoods(getState())[Number(el.dataset.index)];
        if (item) { getState().qa.name = item.name; getState().qa.grams = String(item.grams); getState().qa.manualOpen = false; getState().qa.showSuggest = false; render(getState()); }
        break;
      }
      case "qa-pick-suggestion": {
        const id = el.dataset.id;
        const source = el.dataset.source;

        let food;
        if (source === 'user') {
          food = getState().library[id];
        } else if (source === 'standard') {
          food = getState().qa.standardSuggestions?.find(f => f.id === id);
        }

        if (food) {
          getState().qa.name = food.name;
          getState().qa.grams = "100";
          getState().qa.manualOpen = false;
          getState().qa.showSuggest = false;
          render(getState());
        }
        break;
      }
      case "qa-meal-select":
        getState().qa.mealType = el.dataset.meal; render(getState());
        break;
      case "qa-open-manual":
        getState().qa.manualOpen = true; render(getState());
        break;
      case "qa-open-manual-cancel":
        getState().qa.manualOpen = false; render(getState());
        break;
      case "qa-new-food-mode":
        getState().qa.newFoodMode = true;
        getState().qa.newFoodForm = {
          name: getState().qa.name,
          kcal: getState().qa.manual.kcal,
          protein: getState().qa.manual.protein,
          carbs: getState().qa.manual.carbs,
          fat: getState().qa.manual.fat,
          grams: getState().qa.grams
        };
        render(getState());
        break;
      case "qa-new-food-cancel":
        getState().qa.newFoodMode = false;
        getState().qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
        render(getState());
        break;
      case "qa-new-food-submit": {
        const f = getState().qa.newFoodForm;
        if (!f.name.trim() || !f.kcal) break;
        (async () => {
          try {
            const foodData = {
              name: f.name.trim(),
              kcal: parseFloat(f.kcal) || 0,
              protein: parseFloat(f.protein) || 0,
              carbs: parseFloat(f.carbs) || 0,
              fat: parseFloat(f.fat) || 0
            };
            const inputGrams = parseFloat(f.grams) || 100;

            // Validação antes de enviar
            if (foodData.kcal <= 0) {
              getState().qa.msg = "kcal deve ser maior que 0";
              render(getState());
              setTimeout(() => { getState().qa.msg = ""; render(getState()); }, 1800);
              return;
            }

            // Usar detecção automática genérica
            const created = await createUserFoodWithDetection(getState(), foodData, inputGrams);

            // Adicionar imediatamente à refeição com os valores originais informados
            const totals = {
              kcal: foodData.kcal,
              protein: foodData.protein,
              carbs: foodData.carbs,
              fat: foodData.fat
            };
            const per100 = {
              kcal: created.kcal,
              protein: created.protein,
              carbs: created.carbs,
              fat: created.fat
            };
            addTemporaryMealItem(getState(), { 
              id: uid(), 
              food_id: created.id, 
              name: created.name, 
              grams: inputGrams, 
              ...totals, 
              per100 
            });

            // Limpar formulário
            getState().qa.name = "";
            getState().qa.grams = "";
            getState().qa.newFoodMode = false;
            getState().qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
            getState().qa.msg = "Alimento cadastrado e adicionado!";
            render(getState());
            setTimeout(() => { getState().qa.msg = ""; render(getState()); }, 1800);
          } catch (e) {
            const error = handleError(e, 'qa-new-food-submit');
            getState().qa.msg = error.message;
            render(getState());
            setTimeout(() => { getState().qa.msg = ""; render(getState()); }, 3000);
          }
        })();
        break;
      }
      case "qa-add-item": {
        const name = getState().qa.name.trim();
        const grams = parseFloat(getState().qa.grams) || 0;
        if (!name || grams <= 0) break;
        const basis = qaBasis(getState());
        let totals, per100, food_id = null;
        if (basis) {
          const n = normalize(getState().qa.name);
          const exact = Object.values(getState().library).find((f) => normalize(f.name) === n);
          food_id = exact ? exact.id : null;
          totals = { kcal: (basis.kcal * grams) / 100, protein: (basis.protein * grams) / 100, carbs: (basis.carbs * grams) / 100, fat: (basis.fat * grams) / 100 };
          per100 = basis;
        } else {
          const k = parseFloat(getState().qa.manual.kcal) || 0;
          if (k <= 0) break;
          totals = { kcal: k, protein: parseFloat(getState().qa.manual.protein) || 0, carbs: parseFloat(getState().qa.manual.carbs) || 0, fat: parseFloat(getState().qa.manual.fat) || 0 };
          per100 = { kcal: (totals.kcal / grams) * 100, protein: (totals.protein / grams) * 100, carbs: (totals.carbs / grams) * 100, fat: (totals.fat / grams) * 100 };
        }
        addTemporaryMealItem(getState(), { id: uid(), food_id, name, grams, ...totals, per100 });
        getState().qa.name = "";
        getState().qa.grams = "";
        getState().qa.manualOpen = false;
        getState().qa.manual = { kcal: "", protein: "", carbs: "", fat: "" };
        getState().qa.showSuggest = false;
        getState().qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
        getState().qa.conversionWarning = null;
        render(getState());
        break;
      }
      case "qa-remove-temp-item": {
        const index = Number(el.dataset.index);
        removeTemporaryMealItem(getState(), getState().qa.currentMealItems[index].id);
        render(getState());
        break;
      }
      case "qa-clear-meal": {
        clearTemporaryMealItems(getState());
        render(getState());
        break;
      }
      case "qa-save-meal": {
        (async () => {
          try {
            await saveCompleteMeal(getState(), getState().qa.targetDate || dateKey(new Date()), getState().qa.mealType);
            getState().qa.msg = "Refeição registrada com sucesso!";
            render(getState());
            setTimeout(() => { getState().qa.msg = ""; render(getState()); }, 1800);
          } catch (e) {
            const error = handleError(e, 'qa-save-meal');
            getState().qa.msg = error.message;
            render(getState());
            setTimeout(() => { getState().qa.msg = ""; render(getState()); }, 3000);
          }
        })();
        break;
      }
      case "entry-edit-start":
        getState().entryEdit = { id: el.dataset.id, val: el.dataset.grams };
        render(getState());
        break;
      case "entry-edit-confirm": {
        const v = parseFloat(getState().entryEdit.val);
        (async () => {
          await editEntryGrams(getState(), el.dataset.id, isNaN(v) ? Number(el.dataset.fallback) : v);
          getState().entryEdit = { id: null, val: "" };
          render(getState());
        })();
        break;
      }
      case "entry-edit-cancel":
        getState().entryEdit = { id: null, val: "" };
        render(getState());
        break;
      case "entry-delete":
        (async () => {
          await deleteEntry(getState(), el.dataset.id);
          render(getState());
        })();
        break;
      case "toggle-meal":
        const mealKey = el.dataset.mealKey;
        getState().expandedMeals[mealKey] = !getState().expandedMeals[mealKey];
        render(getState());
        break;
      case "cal-prev":
        getState().viewMonth = new Date(getState().viewMonth.getFullYear(), getState().viewMonth.getMonth() - 1, 1); render(getState());
        break;
      case "cal-next":
        getState().viewMonth = new Date(getState().viewMonth.getFullYear(), getState().viewMonth.getMonth() + 1, 1); render(getState());
        break;
      case "cal-select-day":
        getState().selectedKey = el.dataset.key; render(getState());
        break;
      case "daydetail-close":
        getState().selectedKey = null; render(getState());
        break;
      case "trend-set-metric":
        getState().trendMetric = el.dataset.metric; render(getState());
        break;
      case "set-period":
        getState().historyPeriod = parseInt(el.dataset.period); render(getState());
        break;
      case "lib-toggle-add":
        getState().lib.adding = !getState().lib.adding; getState().lib.editingId = null; getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" }; getState().lib.conversionWarning = null; render(getState());
        break;
      case "lib-cancel-add":
        getState().lib.adding = false; getState().lib.editingId = null; getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" }; getState().lib.conversionWarning = null; render(getState());
        break;
      case "lib-submit": {
        const f = getState().lib.form;
        if (!f.name.trim() || !f.kcal) break;
        (async () => {
          try {
            const foodData = {
              name: f.name.trim(),
              kcal: parseFloat(f.kcal) || 0,
              protein: parseFloat(f.protein) || 0,
              carbs: parseFloat(f.carbs) || 0,
              fat: parseFloat(f.fat) || 0
            };
            const inputGrams = parseFloat(f.grams) || 100;

            // Se estiver editando, chama updateUserFood. Se não, cria novo.
            if (getState().lib.editingId) {
              await updateUserFood(getState(), getState().lib.editingId, foodData, inputGrams);
            } else {
              await createUserFoodWithDetection(getState(), foodData, inputGrams);
            }

            getState().lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
            getState().lib.editingId = null;
            getState().lib.adding = false;
            getState().lib.conversionWarning = null;
            render(getState());
          } catch (e) {
            const error = handleError(e, 'lib-submit');
            getState().lib.adding = true; // Keep form open on error
            render(getState());
          }
        })();
        break;
      }
      case "lib-edit": {
        const f = getState().library[el.dataset.id];
        if (f) { getState().lib.editingId = f.id; getState().lib.form = { name: f.name, kcal: String(f.kcal), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat), grams: "" }; getState().lib.adding = true; render(getState()); }
        break;
      }
      case "lib-delete":
        (async () => {
          await deleteFood(getState(), el.dataset.id);
          render(getState());
        })();
        break;
      case "goals-save": {
        ensureGoalsForm(getState());
        const f = getState().goalsForm;
        if (!f.calories || (typeof f.calories === 'string' && f.calories.trim() === "")) break;
        (async () => {
          await profileApi.updateGoals({
            calories: parseFloat(f.calories),
            protein: f.protein ? parseFloat(f.protein) : null,
            carbs: f.carbs ? parseFloat(f.carbs) : null,
            fat: f.fat ? parseFloat(f.fat) : null
          });
          getState().profile.goals = {
            calories: parseFloat(f.calories),
            protein: f.protein ? parseFloat(f.protein) : null,
            carbs: f.carbs ? parseFloat(f.carbs) : null,
            fat: f.fat ? parseFloat(f.fat) : null
          };
          getState().goalsSaved = true; render(getState());
          setTimeout(() => { getState().goalsSaved = false; render(getState()); }, 1800);
        })();
        break;
      }
      case "bio-save": {
        ensureBiometricsForm(getState());
        const f = getState().biometricsForm;
        if (!f.weight || !f.height || !f.birthDate || !f.gender || !f.activityLevel) break;
        (async () => {
          await profileApi.updateBiometrics({
            weight: parseFloat(f.weight),
            height: parseFloat(f.height),
            birth_date: f.birthDate,
            gender: f.gender,
            activity_level: f.activityLevel
          });
          getState().profile.biometrics = {
            weight: parseFloat(f.weight),
            height: parseFloat(f.height),
            birthDate: f.birthDate,
            gender: f.gender,
            activityLevel: f.activityLevel
          };
          getState().biometricsSaved = true;
          render(getState());
          setTimeout(() => { getState().biometricsSaved = false; render(getState()); }, 1800);
        })();
        break;
      }
      case "reset-ask": getState().confirmDelete = true; render(getState()); break;
      case "reset-cancel": getState().confirmDelete = false; render(getState()); break;
      case "reset-confirm": (async () => { await resetAll(getState()); render(getState()); })(); break;
      case "export-data":
        exportData(getState());
        break;
      case "show-import":
        getState().importExport.showImport = true; getState().importExport.importData = ""; render(getState());
        break;
      case "cancel-import":
        getState().importExport.showImport = false; getState().importExport.importData = ""; render(getState());
        break;
      case "import-data":
        (async () => {
          await importData(getState());
          render(getState());
        })();
        break;
      case "import-meal":
        (async () => {
          await importMeal(getState());
          render(getState());
        })();
        break;
      case "export-meal":
        exportMeal(getState(), el.dataset.meal, dateKey(new Date()));
        break;
      case "auth-toggle-mode":
        getState().auth.mode = getState().auth.mode === 'login' ? 'signup' : 'login';
        getState().auth.error = null;
        render(getState());
        break;
      case "auth-submit": {
        const { email, password, displayName } = getState().auth;
        if (!email || !password) {
          getState().auth.error = "Preencha e-mail e senha";
          render(getState());
          break;
        }
        if (getState().auth.mode === 'signup' && !displayName) {
          getState().auth.error = "Preencha seu nome";
          render(getState());
          break;
        }
        getState().auth.loading = true;
        getState().auth.error = null;
        render(getState());
        (async () => {
          try {
            if (getState().auth.mode === 'signup') {
              const result = await authApi.signUp(email, password, displayName);
              if (result.requiresConfirmation) {
                getState().auth.loading = false;
                getState().auth.error = "Verifique seu e-mail para confirmar a conta";
                render(getState());
                return;
              }
            } else {
              await authApi.signIn(email, password);
            }
            const user = await authApi.getCurrentUser();
            if (!user) throw new Error('Usuário não encontrado após login');

            getState().auth.user = user;
            getState().auth.loading = false;

            const { getProfile } = await import('../api/profile.js');
            const profile = await getProfile();
            getState().profile = profile;

            const { loadAll } = await import('../core/storage.js');
            const loaded = await loadAll();
            getState().library = loaded.library;
            getState().diary = loaded.diary;

            getState().tab = localStorage.getItem('ft-current-tab') || 'hoje';
            getState().connectionError = null;

            render(getState());
          } catch (e) {
            const error = handleError(e, 'auth-submit');
            getState().auth.loading = false;
            getState().auth.error = error.message;
            render(getState());
          }
        })();
        break;
      }
      case "auth-reset-password": {
        const email = getState().auth.email;
        if (!email) {
          getState().auth.error = "Preencha seu e-mail";
          render(getState());
          break;
        }
        (async () => {
          try {
            await authApi.resetPasswordForEmail(email);
            getState().auth.error = null;
            getState().auth.loading = false;
            showNotification("E-mail de recuperação enviado", 'success');
            render(getState());
            setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          } catch (e) {
            const error = handleError(e, 'auth-reset-password');
            getState().auth.error = error.message;
            render(getState());
          }
        })();
        break;
      }
      case "profile-edit":
        getState().profileTab.editing = true;
        getState().profileTab.form.displayName = getState().profile.display_name || '';
        getState().profileTab.form.email = getState().auth.user?.email || '';
        render(getState());
        break;
      case "profile-cancel-edit":
        getState().profileTab.editing = false;
        getState().profileTab.form = { displayName: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' };
        render(getState());
        break;
      case "profile-logout":
        (async () => {
          try {
            await authApi.signOut();
            getState().auth.user = null;
            getState().auth.mode = 'login';
            getState().tab = 'auth';
            render(getState());
          } catch (e) {
            const error = handleError(e, 'profile-logout');
            showNotification(error.message, 'error');
            render(getState());
            setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          }
        })();
        break;
      case "profile-save": {
        const { displayName, email } = getState().profileTab.form;
        
        // Validar email com regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
          showNotification('E-mail inválido', 'error');
          render(getState());
          setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          break;
        }
        
        (async () => {
          try {
            if (displayName && displayName !== getState().profile.display_name) {
              await profileApi.updateProfile({ display_name: displayName });
              getState().profile.display_name = displayName;
            }
            if (email && email !== getState().auth.user?.email) {
              await authApi.updateEmail(email);
              getState().auth.user.email = email;
            }
            getState().profileTab.editing = false;
            getState().profileTab.saved = true;
            render(getState());
            setTimeout(() => { getState().profileTab.saved = false; render(getState()); }, 1800);
          } catch (e) {
            const error = handleError(e, 'profile-save');
            showNotification(error.message, 'error');
            render(getState());
            setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          }
        })();
        break;
      }
      case "profile-show-change-password":
        const passwordState = getState();
        passwordState.profileTab.showChangePassword = true;
        passwordState.profileTab.form = { 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '' 
        };
        render(passwordState);
        break;
      case "profile-cancel-change-password":
        const state3 = getState();
        state3.profileTab.showChangePassword = false;
        state3.profileTab.form.currentPassword = '';
        state3.profileTab.form.newPassword = '';
        state3.profileTab.form.confirmPassword = '';
        state3.profileTab.passwordChanged = false;
        render(state3);
        break;
      case "profile-change-password": {
        const { currentPassword, newPassword, confirmPassword } = getState().profileTab.form;
        
        // Validar senha atual
        if (!currentPassword || currentPassword.trim() === '') {
          getState().profileTab.passwordChanged = false;
          showNotification('Preencha a senha atual', 'error');
          render(getState());
          setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          break;
        }
        
        // Validar nova senha
        if (!newPassword || newPassword.trim() === '') {
          getState().profileTab.passwordChanged = false;
          showNotification('Preencha a nova senha', 'error');
          render(getState());
          setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          break;
        }
        
        // Validar comprimento mínimo
        if (newPassword.length < 8) {
          getState().profileTab.passwordChanged = false;
          showNotification('A nova senha deve ter no mínimo 8 caracteres', 'error');
          render(getState());
          setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          break;
        }
        
        // Validar confirmação
        if (newPassword !== confirmPassword) {
          getState().profileTab.passwordChanged = false;
          showNotification('A nova senha e a confirmação não coincidem', 'error');
          render(getState());
          setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          break;
        }
        
        (async () => {
          try {
            await authApi.updatePassword(newPassword);
            getState().profileTab.showChangePassword = false;
            getState().profileTab.form.currentPassword = '';
            getState().profileTab.form.newPassword = '';
            getState().profileTab.form.confirmPassword = '';
            getState().profileTab.passwordChanged = true;
            render(getState());
            setTimeout(() => { getState().profileTab.passwordChanged = false; render(getState()); }, 3000);
          } catch (e) {
            const error = handleError(e, 'profile-change-password');
            showNotification(error.message, 'error');
            render(getState());
            setTimeout(() => { clearNotification(); render(getState()); }, 3000);
          }
        })();
        break;
      }
      case "profile-show-delete":
        getState().profileTab.showDeleteConfirm = true;
        render(getState());
        break;
      case "profile-cancel-delete":
        getState().profileTab.showDeleteConfirm = false;
        render(getState());
        break;
      case "profile-confirm-deactivate": {
        (async () => {
          try {
            await profileApi.deactivateAccount();
            await authApi.signOut();
            window.location.reload();
          } catch (e) {
            const error = handleError(e, 'profile-confirm-deactivate');
            showNotification(error.message, 'error');
            render(getState());
            setTimeout(() => { clearNotification(); render(getState()); }, 3000);
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
    switch (action) {
      case "qa-name-input":
        getState().qa.name = el.value;
        getState().qa.showSuggest = !!el.value.trim();

        clearTimeout(qaSearchTimeout);
        qaSearchTimeout = setTimeout(async () => {
          if (el.value.trim().length >= 2) {
            try {
              const standardFoods = await searchStandardFoods(el.value);
              getState().qa.standardSuggestions = standardFoods.map(mapStandardFoodFromDB);
              render(getState());
            } catch (e) {
              console.error('Error searching standard foods:', e);
            }
          } else {
            getState().qa.standardSuggestions = [];
            if (getState().qa.showSuggest) {
              render(getState());
            }
          }
        }, 200);

        break;
    }
  });

  root.addEventListener("blur", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "qa-name-input":
        setTimeout(() => {
          if (!ev.relatedTarget || !ev.relatedTarget.closest('.suggest')) {
            getState().qa.showSuggest = false;
            render(getState());
          }
        }, 200);
        break;
    }
  }, true);

  root.addEventListener("input", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "qa-grams-input":
        getState().qa.grams = el.value;
        // Atualizar apenas os macros calculados sem recriar o DOM
        const basis = qaBasis(getState());
        const g = parseFloat(getState().qa.grams) || 0;
        if (basis && g > 0) {
          const computed = {
            kcal: (basis.kcal * g) / 100,
            protein: (basis.protein * g) / 100,
            carbs: (basis.carbs * g) / 100,
            fat: (basis.fat * g) / 100
          };
          // Atualizar o elemento de macros se existir
          const macrosEl = document.querySelector('[data-qa-computed-macros]');
          if (macrosEl) {
            macrosEl.innerHTML = `
              <span class="mono" style="color:var(--calories)">${esc(Math.round(computed.kcal))} kcal</span>
              <span class="mono" style="color:var(--protein)">P ${esc(round(computed.protein))}g</span>
              <span class="mono" style="color:var(--carbs)">C ${esc(round(computed.carbs))}g</span>
              <span class="mono" style="color:var(--fat)">G ${esc(round(computed.fat))}g</span>
            `;
          }
        }
        break;
      case "qa-date-input":
        getState().qa.targetDate = el.value;
        break;
      case "qa-manual-input":
        getState().qa.manual[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "qa-new-food-input":
        getState().qa.newFoodForm[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "entry-edit-input":
        getState().entryEdit.val = el.value;
        // Não renderiza para não perder foco
        break;
      case "lib-search-input":
        getState().lib.query = el.value;

        clearTimeout(libSearchTimeout);
        libSearchTimeout = setTimeout(async () => {
          if (el.value.trim().length >= 2) {
            try {
              const standardFoods = await searchStandardFoods(el.value);
              getState().lib.standardFoods = standardFoods.map(mapStandardFoodFromDB);
              render(getState());
            } catch (e) {
              console.error('Error searching standard foods:', e);
            }
          } else {
            getState().lib.standardFoods = [];
            render(getState());
          }
        }, 200);

        break;
      case "lib-form-input":
        getState().lib.form[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "goal-input":
        if (!getState().goalsForm) getState().goalsForm = { calories: "", protein: "", carbs: "", fat: "" };
        getState().goalsForm[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "bio-input":
        if (!getState().biometricsForm) getState().biometricsForm = { weight: "", height: "", birthDate: "", gender: "", activityLevel: "" };
        getState().biometricsForm[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "calorie-goal-select":
        getState().selectedCalorieGoal = el.value;
        const bio = getState().bio || getState().profile.biometrics;
        if (bio && bio.weight && bio.height && bio.birthDate && bio.gender && bio.activityLevel) {
          const bmr = calculateBMR(bio.weight, bio.height, bio.birthDate, bio.gender);
          const tdee = calculateTDEE(bmr, bio.activityLevel);
          const goal = CALORIE_GOALS.find(g => g.id === el.value);
          if (goal && tdee) {
            getState().goalsForm = getState().goalsForm || { calories: "", protein: "", carbs: "", fat: "" };
            getState().goalsForm.calories = String(tdee + goal.delta);
            render(getState());
          }
        }
        break;
      case "macro-distribution-select":
        getState().selectedMacroDistribution = el.value;
        const dist = MACRO_DISTRIBUTIONS.find(d => d.id === el.value);
        if (dist && getState().goalsForm?.calories) {
          const bio = getState().profile.biometrics;
          const macros = calculateMacrosFromDistribution(getState().goalsForm.calories, dist, bio?.weight);
          if (macros) {
            getState().goalsForm.protein = String(macros.protein);
            getState().goalsForm.carbs = String(macros.carbs);
            getState().goalsForm.fat = String(macros.fat);
            render(getState());
          }
        }
        break;
      case "import-text-input":
        getState().importExport.importData = el.value;
        break;
      case "meal-import-text-input":
        getState().importExport.mealImportData = el.value;
        break;
      case "auth-email-input":
        getState().auth.email = el.value;
        break;
      case "auth-password-input":
        getState().auth.password = el.value;
        break;
      case "auth-display-name-input":
        getState().auth.displayName = el.value;
        break;
      case "profile-display-name-input":
        getState().profileTab.form.displayName = el.value;
        break;
      case "profile-email-input":
        getState().profileTab.form.email = el.value;
        break;
      case "profile-current-password-input":
        getState().profileTab.form.currentPassword = el.value;
        break;
      case "profile-new-password-input":
        getState().profileTab.form.newPassword = el.value;
        break;
      case "profile-confirm-password-input":
        getState().profileTab.form.confirmPassword = el.value;
        break;
    }
  });
}
