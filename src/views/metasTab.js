import { settingsViewHTML } from '../components/settings/settingsView.js';
import { macroDonut } from '../components/shared/macroDonut.js';

export function metasTabHTML(state) {
  const goals = state.profile.goals;
  let distributionHTML = '';

  if (goals && goals.protein && goals.carbs && goals.fat) {
    distributionHTML = `
      <div class="card" style="padding:18px;display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        ${macroDonut(goals.protein, goals.carbs, goals.fat)}
        <div style="flex:1;min-width:160px">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px">Distribuição da meta</div>
          ${[["Proteína", "var(--protein)"], ["Carboidratos", "var(--carbs)"], ["Gordura", "var(--fat)"]].map(([n, c]) => `
            <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-bottom:4px">
              <div style="width:8px;height:8px;border-radius:2px;background:${c}"></div>
              <span style="color:var(--textMuted)">${n}</span>
            </div>`).join("")}
        </div>
      </div>
    `;
  }

  return `<div style="display:flex;flex-direction:column;gap:16px">
    ${distributionHTML}
    ${settingsViewHTML(state)}
  </div>`;
}
