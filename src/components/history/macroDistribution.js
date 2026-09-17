import { parseKey, dayTotals } from '../../core/utils.js';

export function macroDistributionHTML(state) {
  const goals = state.profile.goals;
  if (!goals) return "";
  
  const period = state.historyPeriod || 21;
  const periodKeys = Object.keys(state.diary).filter((k) => 
    state.diary[k].entries.length > 0 && (new Date() - parseKey(k)) / 86400000 <= period
  );
  
  if (periodKeys.length === 0) return "";
  
  let totalProtein = 0, totalCarbs = 0, totalFat = 0;
  periodKeys.forEach(k => {
    const t = dayTotals(state.diary[k]);
    totalProtein += t.protein;
    totalCarbs += t.carbs;
    totalFat += t.fat;
  });
  
  const avgProtein = totalProtein / periodKeys.length;
  const avgCarbs = totalCarbs / periodKeys.length;
  const avgFat = totalFat / periodKeys.length;
  
  const pPct = goals.protein > 0 ? (avgProtein / goals.protein) * 100 : 0;
  const cPct = goals.carbs > 0 ? (avgCarbs / goals.carbs) * 100 : 0;
  const fPct = goals.fat > 0 ? (avgFat / goals.fat) * 100 : 0;
  
  return `<div class="card" style="padding:16px">
    <div style="font-weight:700;font-size:14.5px;margin-bottom:12px">Distribuição média de macros (${period}d)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:8px">
        <div style="font-size:24px;font-weight:700;color:var(--protein)">${Math.round(avgProtein)}g</div>
        <div style="font-size:11px;color:var(--textMuted);margin-top:4px">Proteína</div>
        <div style="font-size:10px;color:${pPct >= 100 ? 'var(--good)' : 'var(--calories)'};margin-top:2px">${Math.round(pPct)}% da meta</div>
      </div>
      <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:8px">
        <div style="font-size:24px;font-weight:700;color:var(--carbs)">${Math.round(avgCarbs)}g</div>
        <div style="font-size:11px;color:var(--textMuted);margin-top:4px">Carboidratos</div>
        <div style="font-size:10px;color:${cPct >= 100 ? 'var(--good)' : 'var(--calories)'};margin-top:2px">${Math.round(cPct)}% da meta</div>
      </div>
      <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:8px">
        <div style="font-size:24px;font-weight:700;color:var(--fat)">${Math.round(avgFat)}g</div>
        <div style="font-size:11px;color:var(--textMuted);margin-top:4px">Gordura</div>
        <div style="font-size:10px;color:${fPct >= 100 ? 'var(--good)' : 'var(--calories)'};margin-top:2px">${Math.round(fPct)}% da meta</div>
      </div>
    </div>
  </div>`;
}
