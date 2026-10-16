import { icon } from '../../core/icons.js';
import { esc, round, dateKey } from '../../core/utils.js';
import { MEAL_TYPES } from '../../core/constants.js';
import { groupEntriesByMealId } from '../../state/selectors.js';
import { entryCardHTML } from '../shared/entryCard.js';
import { formatMacros } from '../../core/macroUtils.js';

export function todayEntriesHTML(state) {
  const today = state.diary[dateKey(new Date())] || { entries: [] };
  const entries = today.entries || [];
  if (!entries.length) return `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Nenhum alimento registrado hoje ainda.</div>`;

  const meals = groupEntriesByMealId(today);
  const mealDate = dateKey(new Date());

  return `<div style="display:flex;flex-direction:column;gap:8px">
    ${meals.map((meal) => {
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
            ${formatMacros(mealTotals)}
          </div>
        </div>
        ${isExpanded ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--borderSoft)">
            ${meal.entries.map((e) => entryCardHTML(e)).join("")}
            <div style="display:flex;justify-content:flex-end;margin-top:8px;gap:4px">
              <button class="btn btn-icon" style="padding:4px" data-action="edit-meal" data-meal-id="${meal.meal_id}" data-meal-type="${meal.mealType}" data-meal-date="${mealDate}" title="Editar refeição">${icon("pencil", 12, "var(--textMuted)")}</button>
              <button class="btn btn-icon" style="padding:4px" data-action="delete-meal" data-meal-id="${meal.meal_id}" title="Excluir refeição">${icon("trash", 12, "var(--error)")}</button>
              <button class="btn btn-icon" style="padding:4px" data-action="export-meal" data-meal-id="${meal.meal_id}" title="Exportar refeição">${icon("download", 12, "var(--textMuted)")}</button>
            </div>
          </div>
        ` : ""}
      </div>`;
    }).join("")}
  </div>`;
}
