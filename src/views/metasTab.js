import { settingsViewHTML } from '../components/settings/settingsView.js';
import { macroDonut } from '../components/shared/macroDonut.js';
import { calculateBMR, calculateTDEE, calculateAge } from '../core/utils.js';
import { icon } from '../core/icons.js';
import { esc } from '../core/utils.js';

function tdeeInfoCard(state) {
  const bio = state.profile.biometrics;
  if (!bio || !bio.weight || !bio.height || !bio.birthDate || !bio.gender || !bio.activityLevel) {
    return '';
  }

  const bmr = calculateBMR(bio.weight, bio.height, bio.birthDate, bio.gender);
  const tdee = calculateTDEE(bmr, bio.activityLevel);
  const age = calculateAge(bio.birthDate);

  if (!tdee) return '';

  return `<div class="card" style="padding:16px;background:var(--surface2)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      ${icon("info", 16)}
      <div style="font-size:14px;font-weight:700;color:var(--text)">Suas métricas calculadas</div>
    </div>
    <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">
      Baseado nos seus dados biológicos (${age} anos, ${bio.weight}kg)
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <div style="padding:10px;background:var(--surface);border-radius:6px">
        <div style="font-size:11px;color:var(--textFaint);margin-bottom:2px">BMR (metabolismo basal)</div>
        <div style="font-size:16px;font-weight:700;color:var(--text)">${Math.round(bmr)} kcal</div>
      </div>
      <div style="padding:10px;background:var(--surface);border-radius:6px">
        <div style="font-size:11px;color:var(--textFaint);margin-bottom:2px">TDEE (manutenção)</div>
        <div style="font-size:16px;font-weight:700;color:var(--primary)">${tdee} kcal</div>
      </div>
    </div>
    <div style="font-size:11.5px;color:var(--textMuted);margin-top:10px">
      Use o TDEE como base. Para perder peso, defina calorias abaixo disso. Para ganhar, acima.
    </div>
  </div>`;
}

export function metasTabHTML(state) {
  const goals = state.goalsForm || state.profile.goals;
  let distributionHTML = '';

  if (goals && (parseFloat(goals.protein) > 0 || parseFloat(goals.carbs) > 0 || parseFloat(goals.fat) > 0)) {
    const protein = parseFloat(goals.protein) || 0;
    const carbs = parseFloat(goals.carbs) || 0;
    const fat = parseFloat(goals.fat) || 0;
    
    distributionHTML = `
      <div class="card" style="padding:18px;display:flex;gap:18px;align-items:center;flex-wrap:wrap" id="macro-distribution-card">
        ${macroDonut(protein, carbs, fat)}
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
    ${tdeeInfoCard(state)}
    ${distributionHTML}
    ${settingsViewHTML(state)}
  </div>`;
}
