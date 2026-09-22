import { icon } from '../../core/icons.js';
import { esc, round, calculateMacrosFromDistribution, calculateBMR, calculateTDEE } from '../../core/utils.js';
import { macroBar } from '../shared/macroBar.js';
import { MACRO_DISTRIBUTIONS, CALORIE_GOALS } from '../../core/constants.js';

export function ensureGoalsForm(state) {
  if (!state.goalsForm) {
    const g = state.profile.goals || { calories: "", protein: "", carbs: "", fat: "" };
    state.goalsForm = { calories: g.calories || "", protein: g.protein || "", carbs: g.carbs || "", fat: g.fat || "" };
  }
}

export function goalsFormHTML(state) {
  ensureGoalsForm(state);
  const form = state.goalsForm;
  
  const bio = state.profile.biometrics;
  const tdee = bio && bio.weight && bio.height && bio.birthDate && bio.gender && bio.activityLevel 
    ? calculateTDEE(calculateBMR(bio.weight, bio.height, bio.birthDate, bio.gender), bio.activityLevel)
    : null;
  
  const calFromMacros = (parseFloat(form.protein) || 0) * 4 + (parseFloat(form.carbs) || 0) * 4 + (parseFloat(form.fat) || 0) * 9;
  const calGoal = parseFloat(form.calories) || 0;
  const diff = calGoal ? Math.round(((calFromMacros - calGoal) / calGoal) * 100) : 0;
  const showWarn = calGoal > 0 && calFromMacros > 0 && Math.abs(diff) > 8;

  return `<div class="card" style="padding:16px">
    <div style="font-weight:700;font-size:15px;margin-bottom:4px">Metas diárias</div>
    <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Configure suas metas de calorias e macronutrientes.</div>
    
    ${tdee ? `
    <div style="margin-bottom:12px">
      <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Objetivo calórico</div>
      <select class="input" data-action="calorie-goal-select">
        <option value="">Selecione um objetivo</option>
        ${CALORIE_GOALS.map(goal => {
          const calculated = tdee + goal.delta;
          return `<option value="${goal.id}" ${state.selectedCalorieGoal === goal.id ? "selected" : ""}>${goal.label} (${calculated} kcal)</option>`;
        }).join('')}
      </select>
    </div>
    ` : ''}
    
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px">
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px;display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:2px;background:var(--calories)"></div>
        Calorias (kcal)
      </div>
        <input class="input" type="number" value="${esc(form.calories)}" data-action="goal-input" data-field="calories" placeholder="2000"/></div>
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px;display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:2px;background:var(--protein)"></div>
        Proteína (g)
      </div>
        <input class="input" type="number" value="${esc(form.protein)}" data-action="goal-input" data-field="protein" placeholder="150"/></div>
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px;display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:2px;background:var(--carbs)"></div>
        Carboidratos (g)
      </div>
        <input class="input" type="number" value="${esc(form.carbs)}" data-action="goal-input" data-field="carbs" placeholder="200"/></div>
      <div><div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px;display:flex;align-items:center;gap:6px">
        <div style="width:8px;height:8px;border-radius:2px;background:var(--fat)"></div>
        Gordura (g)
      </div>
        <input class="input" type="number" value="${esc(form.fat)}" data-action="goal-input" data-field="fat" placeholder="65"/></div>
    </div>
    
    ${parseFloat(form.calories) > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Distribuição de macros</div>
      <select class="input" data-action="macro-distribution-select">
        <option value="">Selecione uma distribuição</option>
        ${MACRO_DISTRIBUTIONS.map(dist => {
          if (dist.type === "per_kg" && !bio?.weight) return '';
          return `<option value="${dist.id}" ${state.selectedMacroDistribution === dist.id ? "selected" : ""}>${dist.label} - ${dist.description}</option>`;
        }).join('')}
      </select>
    </div>
    ` : ''}
    
    ${calFromMacros > 0 ? `<div style="font-size:12px;color:${showWarn ? "var(--over)" : "var(--textMuted)"};display:flex;align-items:center;gap:6px;margin-bottom:10px">
      ${showWarn ? icon("alert-triangle", 13) : ""}
      Seus macros somam ${Math.round(calFromMacros)} kcal${calGoal > 0 ? ` (${diff > 0 ? "+" : ""}${diff}% da meta de calorias)` : ""}
    </div>` : ""}
    
    <div style="display:flex;align-items:center;gap:10px">
      <button class="btn btn-primary" data-action="goals-save">Salvar metas</button>
      ${state.goalsSaved ? `<span style="font-size:12.5px;color:var(--good)">metas salvas</span>` : ""}
    </div>
  </div>`;
}
