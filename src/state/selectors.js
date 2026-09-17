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
  all.sort((a, b) => b.time - a.time);
  const seen = new Set(); const out = [];
  for (const e of all) {
    const n = normalize(e.name);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push({ name: e.name, grams: e.grams, per100: e.per100 });
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

export function groupEntriesByMealInstance(day) {
  const entries = day.entries || [];
  const grouped = {};
  
  entries.forEach(e => {
    const key = e.mealType || 'outro';
    const instanceId = e.importInstanceId || e.time;
    const instanceKey = `${key}-${instanceId}`;
    
    if (!grouped[instanceKey]) {
      grouped[instanceKey] = {
        mealType: key,
        instanceId: instanceId,
        entries: [],
        time: e.time
      };
    }
    grouped[instanceKey].entries.push(e);
  });
  
  return Object.values(grouped).sort((a, b) => a.time - b.time);
}
