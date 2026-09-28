import { getState, showNotification, clearNotification } from '../state/state.js';
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
        setTimeout(() => { clearNotification(); render(getState()); }, 3000);
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
