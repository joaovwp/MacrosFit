import { toggleSwitch } from '../shared/toggleSwitch.js';
import { goalsFormHTML } from './goalsForm.js';
import { extrasBarHTML } from '../today/extrasBar.js';

export function settingsViewHTML(state) {
  return `<div style="display:flex;flex-direction:column;gap:16px">
    ${goalsFormHTML(state)}
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Acompanhamento extra</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:14px">Opcional — ative só o que fizer sentido pra você.</div>
      ${[["trackWeight", "Peso corporal"], ["trackWater", "Consumo de água"], ["trackWorkout", "Treino do dia"]].map(([key, label]) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--borderSoft)">
          <span style="font-size:13.5px">${label}</span>
          ${toggleSwitch(state.profile.settings[key], "settings-toggle", key)}
        </div>`).join("")}
    </div>
    ${extrasBarHTML(state.profile.settings, state.diary)}
  </div>`;
}
