import { icon } from '../../core/icons.js';
import { esc, dateKey, parseKey, addDays, dayTotals, dayScore } from '../../core/utils.js';
import { FULL_WEEKDAYS } from '../../core/constants.js';

export function insightsGridHTML(state) {
  const keys = Object.keys(state.diary).filter((k) => state.diary[k].entries.length > 0).sort();
  if (!keys.length) return `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Registre alguns dias para ver seus insights aqui.</div>`;

  let streak = 0, cursor = new Date();
  while (true) {
    const k = dateKey(cursor);
    if (state.diary[k] && state.diary[k].entries.length > 0) { streak++; cursor = addDays(cursor, -1); } else break;
  }
  const goals = state.profile.goals;
  const period = state.historyPeriod || 21;
  const periodKeys = keys.filter((k) => (new Date() - parseKey(k)) / 86400000 <= period);
  
  let onTarget = 0, calSum = 0, calCount = 0, proteinSum = 0, carbsSum = 0, fatSum = 0;
  const foodCount = {};
  const weekdayScores = Array.from({ length: 7 }, () => []);
  
  periodKeys.forEach((k) => {
    const day = state.diary[k];
    const t = dayTotals(day);
    calSum += t.kcal; calCount++;
    proteinSum += t.protein;
    carbsSum += t.carbs;
    fatSum += t.fat;
    if (goals && goals.calories && Math.abs(t.kcal - goals.calories) / goals.calories <= 0.1) onTarget++;
    day.entries.forEach((e) => { const n = e.name.trim(); foodCount[n] = (foodCount[n] || 0) + 1; });
    const s = dayScore(day, goals);
    if (s != null) weekdayScores[parseKey(k).getDay()].push(s);
  });
  
  const topFood = Object.entries(foodCount).sort((a, b) => b[1] - a[1])[0];
  const avgCal = calCount ? calSum / calCount : 0;
  const avgProtein = calCount ? proteinSum / calCount : 0;
  const avgCarbs = calCount ? carbsSum / calCount : 0;
  const avgFat = calCount ? fatSum / calCount : 0;
  const adherence = periodKeys.length ? Math.round((onTarget / periodKeys.length) * 100) : 0;
  const weekdayAvg = weekdayScores.map((arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null));
  let bestDay = null, bestVal = -1;
  weekdayAvg.forEach((v, i) => { if (v != null && v > bestVal) { bestVal = v; bestDay = i; } });

  const cards = [
    { label: "Sequência atual", value: `${streak} ${streak === 1 ? "dia" : "dias"}`, iconName: "flame" },
    { label: `Média de calorias (${period}d)`, value: `${Math.round(avgCal)} kcal`, iconName: "trending-up" },
    { label: `Aderência à meta (${period}d)`, value: goals ? `${adherence}%` : "defina metas", iconName: "sparkles" },
    { label: `Média de proteína (${period}d)`, value: `${Math.round(avgProtein)}g`, iconName: "protein" },
    { label: `Média de carboidratos (${period}d)`, value: `${Math.round(avgCarbs)}g`, iconName: "carbs" },
    { label: `Média de gordura (${period}d)`, value: `${Math.round(avgFat)}g`, iconName: "fat" },
  ];
  if (bestDay != null) cards.push({ label: "Melhor dia da semana", value: FULL_WEEKDAYS[bestDay], iconName: "check", cap: true });
  if (topFood) cards.push({ label: "Alimento mais registrado", value: `${topFood[0]} (${topFood[1]}x)`, iconName: "list-plus" });

  return `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px">
    ${cards.map((c) => `<div class="card" style="padding:12px 14px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        ${icon(c.iconName, 13, "var(--calories)")}
        <div style="font-size:11px;color:var(--textMuted)">${esc(c.label)}</div>
      </div>
      <div class="mono" style="font-size:15px;font-weight:700;${c.cap ? "text-transform:capitalize" : ""}">${esc(c.value)}</div>
    </div>`).join("")}
  </div>`;
}
