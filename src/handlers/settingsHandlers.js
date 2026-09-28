import { getState, showNotification } from '../state/state.js';
import { render } from '../app/render.js';
import * as profileApi from '../api/profile.js';
import { resetAll, exportData, importData, exportMeal } from '../state/mutations.js';
import { ensureGoalsForm } from '../components/settings/goalsForm.js';
import { ensureBiometricsForm } from '../components/settings/biometricsForm.js';
import { validateForm, calculateMacrosFromDistribution, calculateBMR, calculateTDEE } from '../core/utils.js';
import { MACRO_DISTRIBUTIONS, CALORIE_GOALS } from '../core/constants.js';
import { dateKey } from '../core/utils.js';

export const settingsHandlers = {
  'goals-save': (el, ev) => {
    ensureGoalsForm(getState());
    const f = getState().goalsForm;

    const rules = {
      calories: { required: true, min: 1, message: 'Calorias deve ser maior que 0' }
    };

    const errors = validateForm(rules, f);
    if (errors.length > 0) {
      showNotification(errors[0], 'error');
      render(getState());
      return;
    }

    (async () => {
      try {
        getState().goalsSaving = true;
        render(getState());

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
        getState().goalsSaving = false;
        showNotification("Metas salvas com sucesso!", 'success');
        render(getState());
      } catch (error) {
        console.error('Erro ao salvar metas:', error);
        getState().goalsSaving = false;
        showNotification(error.message || 'Erro ao salvar metas', 'error');
        render(getState());
      }
    })();
  },

  'bio-save': (el, ev) => {
    ensureBiometricsForm(getState());
    const f = getState().biometricsForm;

    const rules = {
      weight: { required: true, min: 1, message: 'Peso deve ser maior que 0' },
      height: { required: true, min: 1, message: 'Altura deve ser maior que 0' },
      birthDate: { required: true, message: 'Data de nascimento é obrigatória' },
      gender: { required: true, message: 'Gênero é obrigatório' },
      activityLevel: { required: true, message: 'Nível de atividade é obrigatório' }
    };

    const errors = validateForm(rules, f);
    if (errors.length > 0) {
      showNotification(errors[0], 'error');
      render(getState());
      return;
    }

    (async () => {
      try {
        getState().biometricsSaving = true;
        render(getState());

        await profileApi.updateBiometrics({
          biometrics: {
            weight: parseFloat(f.weight),
            height: parseFloat(f.height),
            birthDate: f.birthDate,
            gender: f.gender,
            activityLevel: f.activityLevel
          }
        });
        getState().profile.biometrics = {
          weight: parseFloat(f.weight),
          height: parseFloat(f.height),
          birthDate: f.birthDate,
          gender: f.gender,
          activityLevel: f.activityLevel
        };
        getState().biometricsSaving = false;
        showNotification("Dados biológicos salvos com sucesso!", 'success');
        render(getState());
      } catch (error) {
        console.error('Erro ao salvar biometria:', error);
        getState().biometricsSaving = false;
        showNotification(error.message || 'Erro ao salvar dados', 'error');
        render(getState());
      }
    })();
  },

  'reset-ask': (el, ev) => {
    getState().confirmDelete = true;
    render(getState());
  },

  'reset-cancel': (el, ev) => {
    getState().confirmDelete = false;
    render(getState());
  },

  'reset-confirm': (el, ev) => {
    (async () => {
      try {
        await resetAll(getState());
        showNotification("Dados apagados com sucesso!", 'success');
        render(getState());
      } catch (e) {
        showNotification(e.message || 'Erro ao apagar dados', 'error');
        render(getState());
      }
    })();
  },

  'export-data': (el, ev) => {
    exportData(getState());
  },

  'show-import': (el, ev) => {
    getState().importExport.showImport = true;
    getState().importExport.importData = "";
    render(getState());
  },

  'cancel-import': (el, ev) => {
    getState().importExport.showImport = false;
    getState().importExport.importData = "";
    render(getState());
  },

  'import-data': (el, ev) => {
    (async () => {
      try {
        await importData(getState());
        render(getState());
      } catch (e) {
        showNotification(e.message || 'Erro ao importar dados', 'error');
        render(getState());
      }
    })();
  },

  'export-meal': (el, ev) => {
    exportMeal(getState(), el.dataset.mealId);
  },

  'goal-input': (el, ev) => {
    if (!getState().goalsForm) getState().goalsForm = { calories: "", protein: "", carbs: "", fat: "" };
    getState().goalsForm[el.dataset.field] = el.value;
  },

  'bio-input': (el, ev) => {
    if (!getState().biometricsForm) getState().biometricsForm = { weight: "", height: "", birthDate: "", gender: "", activityLevel: "" };
    getState().biometricsForm[el.dataset.field] = el.value;
  },

  'calorie-goal-select': (el, ev) => {
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
  },

  'macro-distribution-select': (el, ev) => {
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
  },

  'import-text-input': (el, ev) => {
    getState().importExport.importData = el.value;
  }
};
