import { recentFoods, qaBasis, qaComputed } from '../state/selectors.js';
import {
  addEntry, deleteEntry, editEntryGrams,
  deleteFood, resetAll, exportData, importData,
  exportMeal, importMeal, createUserFood, createUserFoodWithDetection, updateUserFood,
  addTemporaryMealItem, removeTemporaryMealItem, clearTemporaryMealItems, saveCompleteMeal
} from '../state/mutations.js';
import { uid, dateKey, emptyDay, normalize, calculateMacrosFromDistribution, calculateBMR, calculateTDEE, round } from '../core/utils.js';
import { ensureGoalsForm } from '../components/settings/goalsForm.js';
import { ensureBiometricsForm } from '../components/settings/biometricsForm.js';
import { render } from './render.js';
import * as authApi from '../api/auth.js';
import * as profileApi from '../api/profile.js';
import { MACRO_DISTRIBUTIONS, CALORIE_GOALS } from '../core/constants.js';

function updateInputValue(field, value) {
  const input = document.querySelector(`input[data-field="${field}"]`);
  if (input) {
    input.value = value;
  }
}

export function setupEventHandlers(state, root) {
  window.appState = state;

  root.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "toggle-sidebar":
        window.appState.sidebarOpen = !window.appState.sidebarOpen;
        render(window.appState);
        break;
      case "set-tab":
        window.appState.tab = el.dataset.tab;
        localStorage.setItem('ft-current-tab', window.appState.tab);
        if (window.appState.tab === "metas") { window.appState.goalsForm = null; window.appState.goalsSaved = false; window.appState.confirmDelete = false; window.appState.selectedCalorieGoal = null; window.appState.selectedMacroDistribution = null; }
        if (window.appState.tab === "perfil") { window.appState.biometricsForm = null; window.appState.biometricsSaved = false; }
        if (window.appState.tab === "historico") { window.appState.selectedKey = null; }
        if (window.appState.tab === "config") { window.appState.importExport.showImport = false; }
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
        if (food) { 
          window.appState.qa.name = food.name; 
          window.appState.qa.grams = "100"; // Set default grams to 100
          window.appState.qa.manualOpen = false; 
          window.appState.qa.showSuggest = false; 
          render(window.appState); 
        }
        break;
      }
      case "qa-meal-select":
        window.appState.qa.mealType = el.dataset.meal; render(window.appState);
        break;
      case "qa-open-manual":
        window.appState.qa.manualOpen = true; render(window.appState);
        break;
      case "qa-open-manual-cancel":
        window.appState.qa.manualOpen = false; render(window.appState);
        break;
      case "qa-new-food-mode":
        window.appState.qa.newFoodMode = true;
        window.appState.qa.newFoodForm = {
          name: window.appState.qa.name,
          kcal: window.appState.qa.manual.kcal,
          protein: window.appState.qa.manual.protein,
          carbs: window.appState.qa.manual.carbs,
          fat: window.appState.qa.manual.fat,
          grams: window.appState.qa.grams
        };
        render(window.appState);
        break;
      case "qa-new-food-cancel":
        window.appState.qa.newFoodMode = false;
        window.appState.qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
        render(window.appState);
        break;
      case "qa-new-food-submit": {
        const f = window.appState.qa.newFoodForm;
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
              window.appState.qa.msg = "kcal deve ser maior que 0";
              render(window.appState);
              setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 1800);
              return;
            }

            // Usar detecção automática genérica
            const created = await createUserFoodWithDetection(window.appState, foodData, inputGrams);

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
            addTemporaryMealItem(window.appState, { 
              id: uid(), 
              food_id: created.id, 
              name: created.name, 
              grams: inputGrams, 
              ...totals, 
              per100 
            });

            // Limpar formulário
            window.appState.qa.name = "";
            window.appState.qa.grams = "";
            window.appState.qa.newFoodMode = false;
            window.appState.qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
            window.appState.qa.msg = "Alimento cadastrado e adicionado!";
            render(window.appState);
            setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 1800);
          } catch (e) {
            console.error('Error creating food:', e);
            window.appState.qa.msg = "Erro ao cadastrar alimento: " + e.message;
            render(window.appState);
            setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 3000);
          }
        })();
        break;
      }
      case "qa-add-item": {
        const name = window.appState.qa.name.trim();
        const grams = parseFloat(window.appState.qa.grams) || 0;
        if (!name || grams <= 0) break;
        const basis = qaBasis(window.appState);
        let totals, per100, food_id = null;
        if (basis) {
          const n = normalize(window.appState.qa.name);
          const exact = Object.values(window.appState.library).find((f) => normalize(f.name) === n);
          food_id = exact ? exact.id : null;
          totals = { kcal: (basis.kcal * grams) / 100, protein: (basis.protein * grams) / 100, carbs: (basis.carbs * grams) / 100, fat: (basis.fat * grams) / 100 };
          per100 = basis;
        } else {
          const k = parseFloat(window.appState.qa.manual.kcal) || 0;
          if (k <= 0) break;
          totals = { kcal: k, protein: parseFloat(window.appState.qa.manual.protein) || 0, carbs: parseFloat(window.appState.qa.manual.carbs) || 0, fat: parseFloat(window.appState.qa.manual.fat) || 0 };
          per100 = { kcal: (totals.kcal / grams) * 100, protein: (totals.protein / grams) * 100, carbs: (totals.carbs / grams) * 100, fat: (totals.fat / grams) * 100 };
        }
        addTemporaryMealItem(window.appState, { id: uid(), food_id, name, grams, ...totals, per100 });
        window.appState.qa.name = "";
        window.appState.qa.grams = "";
        window.appState.qa.manualOpen = false;
        window.appState.qa.manual = { kcal: "", protein: "", carbs: "", fat: "" };
        window.appState.qa.showSuggest = false;
        window.appState.qa.newFoodForm = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
        window.appState.qa.conversionWarning = null;
        render(window.appState);
        break;
      }
      case "qa-remove-temp-item": {
        const index = Number(el.dataset.index);
        removeTemporaryMealItem(window.appState, window.appState.qa.currentMealItems[index].id);
        render(window.appState);
        break;
      }
      case "qa-clear-meal": {
        clearTemporaryMealItems(window.appState);
        render(window.appState);
        break;
      }
      case "qa-save-meal": {
        (async () => {
          try {
            await saveCompleteMeal(window.appState, window.appState.qa.targetDate || dateKey(new Date()), window.appState.qa.mealType);
            window.appState.qa.msg = "Refeição registrada com sucesso!";
            render(window.appState);
            setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 1800);
          } catch (e) {
            console.error('Error saving meal:', e);
            window.appState.qa.msg = "Erro ao registrar refeição: " + e.message;
            render(window.appState);
            setTimeout(() => { window.appState.qa.msg = ""; render(window.appState); }, 3000);
          }
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
        const mealKey = el.dataset.mealKey;
        window.appState.expandedMeals[mealKey] = !window.appState.expandedMeals[mealKey];
        render(window.appState);
        break;
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
        window.appState.lib.adding = !window.appState.lib.adding; window.appState.lib.editingId = null; window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" }; window.appState.lib.conversionWarning = null; render(window.appState);
        break;
      case "lib-cancel-add":
        window.appState.lib.adding = false; window.appState.lib.editingId = null; window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" }; window.appState.lib.conversionWarning = null; render(window.appState);
        break;
      case "lib-submit": {
        const f = window.appState.lib.form;
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
            if (window.appState.lib.editingId) {
              await updateUserFood(window.appState, window.appState.lib.editingId, foodData, inputGrams);
            } else {
              await createUserFoodWithDetection(window.appState, foodData, inputGrams);
            }

            window.appState.lib.form = { name: "", kcal: "", protein: "", carbs: "", fat: "", grams: "" };
            window.appState.lib.editingId = null;
            window.appState.lib.adding = false;
            window.appState.lib.conversionWarning = null;
            render(window.appState);
          } catch (e) {
            console.error('Error saving food:', e);
            window.appState.lib.adding = true; // Keep form open on error
            render(window.appState);
          }
        })();
        break;
      }
      case "lib-edit": {
        const f = window.appState.library[el.dataset.id];
        if (f) { window.appState.lib.editingId = f.id; window.appState.lib.form = { name: f.name, kcal: String(f.kcal), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat), grams: "" }; window.appState.lib.adding = true; render(window.appState); }
        break;
      }
      case "lib-delete":
        (async () => {
          await deleteFood(window.appState, el.dataset.id);
          render(window.appState);
        })();
        break;
      case "goals-save": {
        ensureGoalsForm(window.appState);
        const f = window.appState.goalsForm;
        if (!f.calories || (typeof f.calories === 'string' && f.calories.trim() === "")) break;
        (async () => {
          await profileApi.updateGoals({
            calories: parseFloat(f.calories),
            protein: f.protein ? parseFloat(f.protein) : null,
            carbs: f.carbs ? parseFloat(f.carbs) : null,
            fat: f.fat ? parseFloat(f.fat) : null
          });
          window.appState.profile.goals = {
            calories: parseFloat(f.calories),
            protein: f.protein ? parseFloat(f.protein) : null,
            carbs: f.carbs ? parseFloat(f.carbs) : null,
            fat: f.fat ? parseFloat(f.fat) : null
          };
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
          await profileApi.updateBiometrics({
            weight: parseFloat(f.weight),
            height: parseFloat(f.height),
            birth_date: f.birthDate,
            gender: f.gender,
            activity_level: f.activityLevel
          });
          window.appState.profile.biometrics = {
            weight: parseFloat(f.weight),
            height: parseFloat(f.height),
            birthDate: f.birthDate,
            gender: f.gender,
            activityLevel: f.activityLevel
          };
          window.appState.biometricsSaved = true;
          render(window.appState);
          setTimeout(() => { window.appState.biometricsSaved = false; render(window.appState); }, 1800);
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
      case "import-meal":
        (async () => {
          await importMeal(window.appState);
          render(window.appState);
        })();
        break;
      case "export-meal":
        exportMeal(window.appState, el.dataset.meal, dateKey(new Date()));
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

            const { getProfile } = await import('../api/profile.js');
            const profile = await getProfile();
            window.appState.profile = profile;

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
        window.appState.profileTab.form = { displayName: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' };
        render(window.appState);
        break;
      case "profile-save": {
        const { displayName, email } = window.appState.profileTab.form;
        
        // Validar email com regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
          alert('E-mail inválido');
          render(window.appState);
          break;
        }
        
        (async () => {
          try {
            if (displayName && displayName !== window.appState.profile.display_name) {
              await profileApi.updateProfile({ display_name: displayName });
              window.appState.profile.display_name = displayName;
            }
            if (email && email !== window.appState.auth.user?.email) {
              await authApi.updateEmail(email);
              window.appState.auth.user.email = email;
            }
            window.appState.profileTab.editing = false;
            window.appState.profileTab.saved = true;
            render(window.appState);
            setTimeout(() => { window.appState.profileTab.saved = false; render(window.appState); }, 1800);
          } catch (e) {
            alert('Erro ao salvar perfil: ' + e.message);
            render(window.appState);
          }
        })();
        break;
      }
      case "profile-show-change-password":
        window.appState.profileTab.showChangePassword = true;
        window.appState.profileTab.form.currentPassword = '';
        window.appState.profileTab.form.newPassword = '';
        window.appState.profileTab.form.confirmPassword = '';
        render(window.appState);
        break;
      case "profile-cancel-change-password":
        window.appState.profileTab.showChangePassword = false;
        window.appState.profileTab.form.currentPassword = '';
        window.appState.profileTab.form.newPassword = '';
        window.appState.profileTab.form.confirmPassword = '';
        window.appState.profileTab.passwordChanged = false;
        render(window.appState);
        break;
      case "profile-change-password": {
        const { currentPassword, newPassword, confirmPassword } = window.appState.profileTab.form;
        
        // Validar senha atual
        if (!currentPassword || currentPassword.trim() === '') {
          window.appState.profileTab.passwordChanged = false;
          alert('Preencha a senha atual');
          render(window.appState);
          break;
        }
        
        // Validar nova senha
        if (!newPassword || newPassword.trim() === '') {
          window.appState.profileTab.passwordChanged = false;
          alert('Preencha a nova senha');
          render(window.appState);
          break;
        }
        
        // Validar comprimento mínimo
        if (newPassword.length < 8) {
          window.appState.profileTab.passwordChanged = false;
          alert('A nova senha deve ter no mínimo 8 caracteres');
          render(window.appState);
          break;
        }
        
        // Validar confirmação
        if (newPassword !== confirmPassword) {
          window.appState.profileTab.passwordChanged = false;
          alert('A nova senha e a confirmação não coincidem');
          render(window.appState);
          break;
        }
        
        (async () => {
          try {
            await authApi.updatePassword(newPassword);
            window.appState.profileTab.showChangePassword = false;
            window.appState.profileTab.form.currentPassword = '';
            window.appState.profileTab.form.newPassword = '';
            window.appState.profileTab.form.confirmPassword = '';
            window.appState.profileTab.passwordChanged = true;
            render(window.appState);
            setTimeout(() => { window.appState.profileTab.passwordChanged = false; render(window.appState); }, 3000);
          } catch (e) {
            alert('Erro ao alterar senha: ' + (e.message || 'Verifique sua senha atual'));
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
            window.location.reload();
          } catch (e) {
            alert('Erro ao desativar conta: ' + e.message);
            render(window.appState);
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
        window.appState.qa.name = el.value;
        window.appState.qa.showSuggest = !!el.value.trim();
        // Só renderiza se houver sugestões para mostrar
        if (window.appState.qa.showSuggest) {
          render(window.appState);
        }
        break;
      case "qa-grams-input":
        window.appState.qa.grams = el.value;
        // Atualizar apenas os macros calculados sem recriar o DOM
        const basis = qaBasis(window.appState);
        const g = parseFloat(window.appState.qa.grams) || 0;
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
              <span class="mono" style="color:var(--calories)">${Math.round(computed.kcal)} kcal</span>
              <span class="mono" style="color:var(--protein)">P ${round(computed.protein)}g</span>
              <span class="mono" style="color:var(--carbs)">C ${round(computed.carbs)}g</span>
              <span class="mono" style="color:var(--fat)">G ${round(computed.fat)}g</span>
            `;
          }
        }
        break;
      case "qa-date-input":
        window.appState.qa.targetDate = el.value;
        break;
      case "qa-manual-input":
        window.appState.qa.manual[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "qa-new-food-input":
        window.appState.qa.newFoodForm[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "entry-edit-input":
        window.appState.entryEdit.val = el.value;
        // Não renderiza para não perder foco
        break;
      case "lib-search-input":
        window.appState.lib.query = el.value;
        render(window.appState);
        break;
      case "lib-form-input":
        window.appState.lib.form[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "goal-input":
        if (!window.appState.goalsForm) window.appState.goalsForm = { calories: "", protein: "", carbs: "", fat: "" };
        window.appState.goalsForm[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "bio-input":
        if (!window.appState.biometricsForm) window.appState.biometricsForm = { weight: "", height: "", birthDate: "", gender: "", activityLevel: "" };
        window.appState.biometricsForm[el.dataset.field] = el.value;
        // Não renderiza para não perder foco
        break;
      case "calorie-goal-select":
        window.appState.selectedCalorieGoal = el.value;
        const bio = window.appState.bio || window.appState.profile.biometrics;
        if (bio && bio.weight && bio.height && bio.birthDate && bio.gender && bio.activityLevel) {
          const bmr = calculateBMR(bio.weight, bio.height, bio.birthDate, bio.gender);
          const tdee = calculateTDEE(bmr, bio.activityLevel);
          const goal = CALORIE_GOALS.find(g => g.id === el.value);
          if (goal && tdee) {
            window.appState.goalsForm = window.appState.goalsForm || { calories: "", protein: "", carbs: "", fat: "" };
            window.appState.goalsForm.calories = String(tdee + goal.delta);
            render(window.appState);
          }
        }
        break;
      case "macro-distribution-select":
        window.appState.selectedMacroDistribution = el.value;
        const dist = MACRO_DISTRIBUTIONS.find(d => d.id === el.value);
        if (dist && window.appState.goalsForm?.calories) {
          const bio = window.appState.profile.biometrics;
          const macros = calculateMacrosFromDistribution(window.appState.goalsForm.calories, dist, bio?.weight);
          if (macros) {
            window.appState.goalsForm.protein = String(macros.protein);
            window.appState.goalsForm.carbs = String(macros.carbs);
            window.appState.goalsForm.fat = String(macros.fat);
            render(window.appState);
          }
        }
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
  });
}
