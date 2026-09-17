import { icon } from '../../core/icons.js';
import { addDays, dateKey } from '../../core/utils.js';
import { trendChartSVG } from './trendChart.js';

export function weightTrendHTML(state) {
  if (!state.profile.settings.trackWeight) return "";
  
  const period = state.historyPeriod || 21;
  const weightData = [];
  const today = new Date();
  
  for (let i = period - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dateKey(d);
    const day = state.diary[k];
    if (day && day.weight) {
      weightData.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: day.weight });
    }
  }
  
  if (weightData.length < 2) return "";
  
  const weights = weightData.map(d => d.value);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const weightChange = weights[weights.length - 1] - weights[0];
  
  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
      ${icon("dumbbell", 15, "var(--fat)")}
      <div style="font-weight:700;font-size:14.5px">Evolução de peso</div>
    </div>
    ${trendChartSVG(weightData, null, "var(--fat)")}
    <div style="display:flex;gap:12px;margin-top:8px;font-size:12px;color:var(--textMuted)">
      <span>Início: ${minW}kg</span>
      <span>Atual: ${maxW}kg</span>
      <span style="color:${weightChange > 0 ? 'var(--over)' : 'var(--good)'}">${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg</span>
    </div>
  </div>`;
}
