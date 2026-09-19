import { ACTIVITY_LEVELS } from './constants.js';

export const uid = () => crypto.randomUUID();

export const normalize = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const round = (v) => Math.round(v * 10) / 10;

export function esc(s) {
  // Função única de escape HTML - escapa & < > " '
  // Uso em atributos HTML também é seguro com essas entidades
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

export function dateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseKey(k) { 
  const [y, m, d] = k.split("-").map(Number); 
  return new Date(y, m - 1, d); 
}

export function addDays(d, n) { 
  const r = new Date(d); 
  r.setDate(r.getDate() + n); 
  return r; 
}

export function emptyDay() { 
  return { 
    entries: [], 
    weight: null, 
    water: 0, 
    workout: { done: false, note: "" } 
  }; 
}

export function dayTotals(day) {
  if (!day || !day.entries.length) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  return day.entries.reduce((acc, e) => ({
    kcal: acc.kcal + e.kcal, 
    protein: acc.protein + e.protein, 
    carbs: acc.carbs + e.carbs, 
    fat: acc.fat + e.fat,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

export function dayScore(day, goals) {
  if (!goals || !day || !day.entries.length) return null;
  const t = dayTotals(day);
  const metrics = [[t.kcal, goals.calories], [t.protein, goals.protein], [t.carbs, goals.carbs], [t.fat, goals.fat]];
  const devs = metrics.filter(([, g]) => g > 0).map(([v, g]) => Math.min(1, Math.abs(v - g) / g));
  if (!devs.length) return null;
  const avg = devs.reduce((a, b) => a + b, 0) / devs.length;
  return clamp(1 - avg, 0, 1);
}

export function scoreLevel(score) {
  if (score == null) return -1;
  if (score >= 0.9) return 4;
  if (score >= 0.72) return 3;
  if (score >= 0.5) return 2;
  if (score >= 0.28) return 1;
  return 0;
}

export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMR(weight, height, birthDate, gender) {
  if (!weight || !height || !birthDate || !gender) return null;
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = calculateAge(birthDate);
  if (!a) return null;
  if (gender === "male") {
    return (10 * w) + (6.25 * h) - (5 * a) + 5;
  } else {
    return (10 * w) + (6.25 * h) - (5 * a) - 161;
  }
}

export function calculateTDEE(bmr, activityLevel) {
  if (!bmr || !activityLevel) return null;
  const level = ACTIVITY_LEVELS.find(l => l.id === activityLevel);
  if (!level) return null;
  return Math.round(bmr * level.multiplier);
}
