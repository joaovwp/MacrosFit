import { dateKey } from '../../core/utils.js';
import { groupEntriesByMealId } from '../../state/selectors.js';
import { mealCardHTML } from '../shared/mealCard.js';

export function todayEntriesHTML(state) {
  const today = state.diary[dateKey(new Date())] || { entries: [] };
  const entries = today.entries || [];
  if (!entries.length) return `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Nenhum alimento registrado hoje ainda.</div>`;

  const meals = groupEntriesByMealId(today);
  const mealDate = dateKey(new Date());

  return `<div style="display:flex;flex-direction:column;gap:8px">
    ${meals.map((meal) => mealCardHTML(meal, mealDate, state)).join("")}
  </div>`;
}
