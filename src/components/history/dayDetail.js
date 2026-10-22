import { icon } from '../../core/icons.js';
import { parseKey, dayTotals } from '../../core/utils.js';
import { MONTHS } from '../../core/constants.js';
import { groupEntriesByMealId } from '../../state/selectors.js';
import { macroBar } from '../shared/macroBar.js';
import { mealCardHTML } from '../shared/mealCard.js';

export function dayDetailHTML(state) {
  if (!state.selectedKey) return "";
  const day = state.diary[state.selectedKey] || { entries: [] };
  const goals = state.profile?.goals;
  const t = dayTotals(day);
  const d = parseKey(state.selectedKey);

  const meals = groupEntriesByMealId(day);
  const mealDate = state.selectedKey;

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
    ${meals.map(meal => mealCardHTML(meal, mealDate, state)).join("")}
  </div>`;
}
