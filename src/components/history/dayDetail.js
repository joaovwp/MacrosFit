import { icon } from '../../core/icons.js';
import { esc, parseKey, dayTotals, round } from '../../core/utils.js';
import { MONTHS, MEAL_TYPES } from '../../core/constants.js';
import { groupEntriesByMealId } from '../../state/selectors.js';
import { macroBar } from '../shared/macroBar.js';
import { entryCardHTML } from '../shared/entryCard.js';

export function dayDetailHTML(state) {
  if (!state.selectedKey) return "";
  const day = state.diary[state.selectedKey] || { entries: [] };
  const goals = state.profile.goals;
  const t = dayTotals(day);
  const d = parseKey(state.selectedKey);

  const meals = groupEntriesByMealId(day);

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
    ${meals.map(meal => {
      const mt = MEAL_TYPES.find(m => m.id === meal.mealType) || MEAL_TYPES[MEAL_TYPES.length - 1];
      const mealTotals = meal.entries.reduce((acc, e) => ({
        kcal: acc.kcal + e.kcal,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

      const mealKey = meal.meal_id || meal.mealType;
      const isExpanded = state.expandedMeals[mealKey];
      const mealName = meal.name || mt.label;

      return `<div class="card" style="padding:10px">
        <div style="display:flex;align-items:center;gap:8px;cursor:pointer" data-action="toggle-meal" data-meal-key="${mealKey}">
          ${icon(isExpanded ? "chevron-down" : "chevron-right", 14, "var(--textMuted)")}
          ${icon(mt.icon, 14, "var(--calories)")}
          <div style="font-weight:600;font-size:13px">${esc(mealName)}</div>
          <div class="mono" style="font-size:12px;color:var(--textMuted);margin-left:auto">
            ${Math.round(mealTotals.kcal)} kcal
          </div>
        </div>
        ${isExpanded ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--borderSoft)">
            <div style="display:flex;gap:8px;margin-bottom:8px;font-size:11px;color:var(--textMuted)">
              <span class="mono">P ${round(mealTotals.protein)}g</span>
              <span class="mono">C ${round(mealTotals.carbs)}g</span>
              <span class="mono">G ${round(mealTotals.fat)}g</span>
            </div>
            ${meal.entries.map((e) => entryCardHTML(e, state.entryEdit)).join("")}
            <div style="display:flex;justify-content:flex-end;margin-top:8px">
              <button class="btn btn-icon" style="padding:4px" data-action="export-meal" data-meal-id="${meal.meal_id}" title="Exportar refeição">${icon("download", 12, "var(--textMuted)")}</button>
            </div>
          </div>
        ` : `
          <div style="display:flex;gap:8px;margin-top:6px;font-size:10px;color:var(--textFaint)">
            <span class="mono">P ${round(mealTotals.protein)}g</span>
            <span class="mono">C ${round(mealTotals.carbs)}g</span>
            <span class="mono">G ${round(mealTotals.fat)}g</span>
          </div>
        `}
      </div>`;
    }).join("")}
  </div>`;
}
