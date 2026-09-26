import { normalize } from '../core/utils.js';
import { MEAL_TYPES } from '../core/constants.js';

export function qaBasis(state) {
  const n = normalize(state.qa.name);
  if (!n) return null;
  const exact = Object.values(state.library).find((f) => normalize(f.name) === n);
  return exact ? { kcal: exact.kcal, protein: exact.protein, carbs: exact.carbs, fat: exact.fat } : null;
}

export function qaSuggestions(state) {
  const n = normalize(state.qa.name);
  if (!n) return [];
  return Object.values(state.library).filter((f) => normalize(f.name).includes(n)).slice(0, 6);
}

export function qaComputed(state) {
  const basis = qaBasis(state);
  const g = parseFloat(state.qa.grams) || 0;
  if (!basis || g <= 0) return null;
  return { kcal: (basis.kcal * g) / 100, protein: (basis.protein * g) / 100, carbs: (basis.carbs * g) / 100, fat: (basis.fat * g) / 100 };
}

export function recentFoods(state) {
  const all = [];
  Object.values(state.diary).forEach((day) => day.entries.forEach((e) => all.push(e)));
  // Ordenar por criação mais recente (assumindo que entries são ordenadas por created_at ou id)
  // Como não temos mais 'time', usamos ordem reversa
  all.reverse();
  const seen = new Set(); const out = [];
  for (const e of all) {
    const n = normalize(e.name);
    if (seen.has(n)) continue;
    seen.add(n);
    // Se não tiver per100, não pode ser reutilizado
    if (e.food_id && state.library[e.food_id]) {
      const food = state.library[e.food_id];
      out.push({ name: e.name, grams: e.grams, per100: { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat } });
    } else if (e.per100) {
      out.push({ name: e.name, grams: e.grams, per100: e.per100 });
    }
    if (out.length >= 8) break;
  }
  return out;
}

export function groupEntriesByMeal(day) {
  const entries = day.entries || [];
  const grouped = {};
  MEAL_TYPES.forEach(mt => {
    grouped[mt.id] = entries.filter(e => e.mealType === mt.id);
  });
  return grouped;
}

// Agrupar entries por meal_id (agrupamento por refeição real do novo schema)
export function groupEntriesByMealId(day) {
  const entries = day.entries || [];
  const grouped = {};

  entries.forEach(e => {
    const mealId = e.meal_id;
    const mealType = e.mealType || 'outro';

    if (!grouped[mealId]) {
      grouped[mealId] = {
        meal_id: mealId,
        mealType: mealType,
        entries: []
      };
    }
    grouped[mealId].entries.push(e);
  });

  return Object.values(grouped);
}
