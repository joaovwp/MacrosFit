import { round } from './utils.js';

export function formatMacros(totals, includeGrams = false) {
  const parts = [
    `${Math.round(totals.kcal)} kcal`,
  ];

  if (includeGrams) {
    parts.push(`${Math.round(totals.grams || 0)}g`);
  }

  parts.push(`P ${round(totals.protein)}g`);
  parts.push(`C ${round(totals.carbs)}g`);
  parts.push(`G ${round(totals.fat)}g`);

  return parts.join(' · ');
}
