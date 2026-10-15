import { getState, showNotification } from '../state/state.js';
import { render } from '../app/render.js';
import * as authApi from '../api/auth.js';
import { handleError } from '../core/errorHandler.js';

export const authHandlers = {
  'auth-toggle-mode': (el, ev) => {
    const state = getState();
    state.auth.mode = state.auth.mode === 'login' ? 'signup' : 'login';
    state.auth.error = null;
    render(state);
  },

  'auth-submit': (el, ev) => {
    const { email, password, displayName } = getState().auth;
    if (!email || !password) {
      getState().auth.error = "Preencha e-mail e senha";
      render(getState());
      return;
    }
    if (getState().auth.mode === 'signup' && !displayName) {
      getState().auth.error = "Preencha seu nome";
      render(getState());
      return;
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

        const [{ getProfile }, { getUserFoods }, { getAllMeals }, { getFoods }] = await Promise.all([
          import('../api/profile.js'),
          import('../api/user_foods.js'),
          import('../api/meals.js'),
          import('../api/foods.js')
        ]);

        const [profile, userFoods, meals, foods] = await Promise.all([
          getProfile(),
          getUserFoods(),
          getAllMeals(user.id),
          getFoods()
        ]);

        const { mapUserFoodFromDB } = await import('../utils/mapper.js');
        const { emptyDay } = await import('../core/utils.js');
        const { groupEntriesByMealId } = await import('../state/selectors.js');

        const library = {};
        userFoods.forEach(food => {
          const mapped = mapUserFoodFromDB(food);
          if (mapped) {
            library[mapped.id] = mapped;
          }
        });

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

        getState().profile = profile;
        getState().library = library;
        getState().foods = foods;
        getState().diary = diary;

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
  },

  'auth-reset-password': (el, ev) => {
    const email = getState().auth.email;
    if (!email) {
      getState().auth.error = "Preencha seu e-mail";
      render(getState());
      return;
    }
    (async () => {
      try {
        await authApi.resetPasswordForEmail(email);
        getState().auth.error = null;
        getState().auth.loading = false;
        showNotification("E-mail de recuperação enviado", 'success');
        render(getState());
      } catch (e) {
        const error = handleError(e, 'auth-reset-password');
        getState().auth.error = error.message;
        render(getState());
      }
    })();
  },

  'auth-email-input': (el, ev) => {
    getState().auth.email = el.value;
  },

  'auth-password-input': (el, ev) => {
    getState().auth.password = el.value;
  },

  'auth-display-name-input': (el, ev) => {
    getState().auth.displayName = el.value;
  }
};
