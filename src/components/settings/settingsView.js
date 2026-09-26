import { goalsFormHTML } from './goalsForm.js';

export function settingsViewHTML(state) {
  return `<div style="display:flex;flex-direction:column;gap:16px">
    ${goalsFormHTML(state)}
  </div>`;
}
