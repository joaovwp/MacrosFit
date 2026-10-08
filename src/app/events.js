import { authHandlers } from '../handlers/authHandlers.js';
import { todayHandlers } from '../handlers/todayHandlers.js';
import { libraryHandlers } from '../handlers/libraryHandlers.js';
import { settingsHandlers } from '../handlers/settingsHandlers.js';
import { historyHandlers } from '../handlers/historyHandlers.js';
import { profileHandlers } from '../handlers/profileHandlers.js';
import { navigationHandlers } from '../handlers/navigationHandlers.js';
import { entriesHandlers } from '../handlers/entriesHandlers.js';
import { getState } from '../state/state.js';
import { render } from './render.js';

const allHandlers = {
  ...authHandlers,
  ...todayHandlers,
  ...libraryHandlers,
  ...settingsHandlers,
  ...historyHandlers,
  ...profileHandlers,
  ...navigationHandlers,
  ...entriesHandlers
};

export function setupEventHandlers(root) {
  root.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const handler = allHandlers[action];
    if (handler) {
      handler(el, ev);
    }
  });

  root.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const handler = allHandlers[action];
    if (handler) {
      handler(el, ev);
    }
  });

  // Handler específico para select de filtro - usa change, não input
  root.addEventListener('change', (ev) => {
    if (ev.target.id === 'lib-filter') {
      ev.stopPropagation();
      getState().lib.filter = ev.target.value;
      requestAnimationFrame(() => render(getState()));
    }
  });

  // Fechar sugestões ao clicar fora
  document.addEventListener('click', (ev) => {
    const state = getState();
    if (state.qa.showSuggest) {
      const qaNameInput = document.getElementById('qa-name');
      const suggestBox = document.querySelector('.suggest');
      if (qaNameInput && suggestBox && !qaNameInput.contains(ev.target) && !suggestBox.contains(ev.target)) {
        state.qa.showSuggest = false;
        render(state);
      }
    }
  });
}
