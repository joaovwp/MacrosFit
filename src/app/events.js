import { authHandlers } from '../handlers/authHandlers.js';
import { todayHandlers } from '../handlers/todayHandlers.js';
import { libraryHandlers } from '../handlers/libraryHandlers.js';
import { settingsHandlers } from '../handlers/settingsHandlers.js';
import { historyHandlers } from '../handlers/historyHandlers.js';
import { profileHandlers } from '../handlers/profileHandlers.js';
import { navigationHandlers } from '../handlers/navigationHandlers.js';
import { entriesHandlers } from '../handlers/entriesHandlers.js';

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

  root.addEventListener('blur', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    // qa-name-input has special blur handling
    if (action === 'qa-name-input') {
      const handler = allHandlers['qa-name-input-blur'];
      if (handler) {
        handler(el, ev);
      }
    }
  }, true);
}
