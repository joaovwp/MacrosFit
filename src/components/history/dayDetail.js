import { icon } from '../../core/icons.js';
import { esc, parseKey, dayTotals, round } from '../../core/utils.js';
import { MONTHS, MEAL_TYPES } from '../../core/constants.js';
import { groupEntriesByMealInstance } from '../../state/selectors.js';
import { macroBar } from '../shared/macroBar.js';

export function dayDetailHTML(state) {
  if (!state.selectedKey) return "";
  const day = state.diary[state.selectedKey] || { entries: [], weight: null, water: 0, workout: { done: false, note: "" } };
  const goals = state.profile.goals;
  const t = dayTotals(day);
  const d = parseKey(state.selectedKey);
  
  const mealInstances = groupEntriesByMealInstance(day);
  
  return `<div class="card" style="padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-weight:700;font-size:14.5px">${d.getDate()} de ${MONTHS[d.getMonth()]}</div>
      <button class="btn btn-icon" data-action="daydetail-close">${icon("x", 14)}</button>
    </div>
    ${goals ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
      ${macroBar("Calorias", t.kcal, goals.calories, "var(--calories)", " kcal")}
      ${macroBar("Proteína", t.protein, goals.protein, "var(--protein)")}
      ${macroBar("Carboidratos", t.carbs, goals.carbs, "var(--carbs)")}
      ${macroBar("Gordura", t.fat, goals.fat, "var(--fat)")}
    </div>` : ""}
    <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:8px">Refeições registradas</div>
    ${mealInstances.map(instance => {
      const mt = MEAL_TYPES.find(m => m.id === instance.mealType) || MEAL_TYPES[MEAL_TYPES.length - 1];
      const mealTotals = instance.entries.reduce((acc, e) => ({
        kcal: acc.kcal + e.kcal,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      
      return `<div style="margin-bottom:8px;padding:8px;background:var(--surface2);border-radius:6px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${icon(mt.icon, 12, "var(--calories)")}
          <span style="font-size:12px;font-weight:600">${esc(mt.label)}</span>
          <span class="mono" style="font-size:11px;color:var(--textMuted);margin-left:auto">${Math.round(mealTotals.kcal)} kcal</span>
        </div>
        <div style="font-size:10px;color:var(--textFaint)">
          ${instance.entries.map(e => `${esc(e.name)} (${e.grams}g)`).join(", ")}
        </div>
      </div>`;
    }).join("")}
    ${(day.weight || day.water > 0 || (day.workout && day.workout.done)) ? `<div style="display:flex;gap:14px;margin-top:12px;font-size:12px;color:var(--textMuted)">
      ${day.weight ? `<span>Peso: ${day.weight}kg</span>` : ""}
      ${day.water > 0 ? `<span>Água: ${day.water}ml</span>` : ""}
      ${day.workout && day.workout.done ? `<span>Treino ✓</span>` : ""}
    </div>` : ""}
  </div>`;
}
