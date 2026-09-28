import { getState, showNotification, clearNotification } from '../state/state.js';
import { render } from '../app/render.js';
import * as authApi from '../api/auth.js';
import * as profileApi from '../api/profile.js';
import { handleError } from '../core/errorHandler.js';
import { validateForm } from '../core/utils.js';

export const profileHandlers = {
  'profile-edit': (el, ev) => {
    getState().profileTab.editing = true;
    getState().profileTab.form.displayName = getState().profile.display_name || '';
    getState().profileTab.form.email = getState().auth.user?.email || '';
    render(getState());
  },

  'profile-cancel-edit': (el, ev) => {
    getState().profileTab.editing = false;
    getState().profileTab.form = { displayName: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' };
    render(getState());
  },

  'profile-logout': (el, ev) => {
    (async () => {
      try {
        await authApi.signOut();
        const { endSession } = await import('../core/session.js');
        endSession();
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
  },

  'profile-save': (el, ev) => {
    const { displayName, email } = getState().profileTab.form;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rules = {
      email: { pattern: emailRegex, message: 'E-mail inválido' }
    };

    const errors = validateForm(rules, { email: email || '' });
    if (errors.length > 0) {
      showNotification(errors[0], 'error');
      render(getState());
      setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      return;
    }

    (async () => {
      try {
        getState().profileTab.saving = true;
        render(getState());

        if (displayName && displayName !== getState().profile.display_name) {
          await profileApi.updateProfile({ display_name: displayName });
          getState().profile.display_name = displayName;
        }
        if (email && email !== getState().auth.user?.email) {
          await authApi.updateEmail(email);
          getState().auth.user.email = email;
        }
        getState().profileTab.saving = false;
        getState().profileTab.editing = false;
        showNotification("Perfil atualizado com sucesso!", 'success');
        render(getState());
        setTimeout(() => { clearNotification(); render(getState()); }, 1800);
      } catch (e) {
        const error = handleError(e, 'profile-save');
        getState().profileTab.saving = false;
        showNotification(error.message, 'error');
        render(getState());
        setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      }
    })();
  },

  'profile-show-change-password': (el, ev) => {
    const state = getState();
    state.profileTab.showChangePassword = true;
    state.profileTab.form = { 
      currentPassword: '', 
      newPassword: '', 
      confirmPassword: '' 
    };
    render(state);
  },

  'profile-cancel-change-password': (el, ev) => {
    const state = getState();
    state.profileTab.showChangePassword = false;
    state.profileTab.form.currentPassword = '';
    state.profileTab.form.newPassword = '';
    state.profileTab.form.confirmPassword = '';
    state.profileTab.passwordChanged = false;
    render(state);
  },

  'profile-change-password': (el, ev) => {
    const { currentPassword, newPassword, confirmPassword } = getState().profileTab.form;
    
    if (!currentPassword || currentPassword.trim() === '') {
      getState().profileTab.passwordChanged = false;
      showNotification('Preencha a senha atual', 'error');
      render(getState());
      setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      return;
    }
    
    if (!newPassword || newPassword.trim() === '') {
      getState().profileTab.passwordChanged = false;
      showNotification('Preencha a nova senha', 'error');
      render(getState());
      setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      return;
    }
    
    if (newPassword.length < 8) {
      getState().profileTab.passwordChanged = false;
      showNotification('A nova senha deve ter no mínimo 8 caracteres', 'error');
      render(getState());
      setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      getState().profileTab.passwordChanged = false;
      showNotification('A nova senha e a confirmação não coincidem', 'error');
      render(getState());
      setTimeout(() => { clearNotification(); render(getState()); }, 3000);
      return;
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
  },

  'profile-show-delete': (el, ev) => {
    getState().profileTab.showDeleteConfirm = true;
    render(getState());
  },

  'profile-cancel-delete': (el, ev) => {
    getState().profileTab.showDeleteConfirm = false;
    render(getState());
  },

  'profile-confirm-deactivate': (el, ev) => {
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
  },

  'profile-display-name-input': (el, ev) => {
    getState().profileTab.form.displayName = el.value;
  },

  'profile-email-input': (el, ev) => {
    getState().profileTab.form.email = el.value;
  },

  'profile-current-password-input': (el, ev) => {
    getState().profileTab.form.currentPassword = el.value;
  },

  'profile-new-password-input': (el, ev) => {
    getState().profileTab.form.newPassword = el.value;
  },

  'profile-confirm-password-input': (el, ev) => {
    getState().profileTab.form.confirmPassword = el.value;
  }
};
