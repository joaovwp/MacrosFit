import { icon } from '../../core/icons.js';
import { esc, addDays, dateKey, dayTotals } from '../../core/utils.js';

export function trendChartSVG(data, goalVal, color) {
  const w = 660, h = 220, padL = 36, padR = 8, padT = 10, padB = 22;
  const vals = data.map((d) => d.value).filter((v) => v != null);
  if (!vals.length && goalVal == null) {
    return `<div style="height:220px;display:flex;align-items:center;justify-content:center;color:var(--textFaint);font-size:12.5px">Sem dados suficientes ainda.</div>`;
  }
  let min = vals.length ? Math.min(...vals) : (goalVal || 0);
  let max = vals.length ? Math.max(...vals) : (goalVal || 1);
  if (goalVal != null) { min = Math.min(min, goalVal); max = Math.max(max, goalVal); }
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.1;
  const rMin = min - pad, rMax = max + pad;
  const n = data.length;
  const xw = n > 1 ? (w - padL - padR) / (n - 1) : 0;
  const yOf = (v) => h - padB - ((v - rMin) / (rMax - rMin)) * (h - padT - padB);
  const pts = data.map((d, i) => d.value == null ? null : [padL + i * xw, yOf(d.value)]);
  const valid = pts.filter((p) => p);
  const pathD = valid.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const gridVals = [rMin, rMin + (rMax - rMin) * 0.5, rMax];
  const grid = gridVals.map((v) => `<line x1="${padL}" y1="${yOf(v).toFixed(1)}" x2="${w - padR}" y2="${yOf(v).toFixed(1)}" stroke="var(--borderSoft)"/>
    <text x="2" y="${(yOf(v) + 3).toFixed(1)}" font-size="10" fill="var(--textFaint)">${Math.round(v)}</text>`).join("");
  const xLabels = data.map((d, i) => (i % 3 === 0 ? `<text x="${(padL + i * xw).toFixed(1)}" y="${h - 6}" font-size="10" fill="var(--textFaint)" text-anchor="middle">${esc(d.label)}</text>` : "")).join("");
  const goalLine = goalVal != null ? `<line x1="${padL}" y1="${yOf(goalVal).toFixed(1)}" x2="${w - padR}" y2="${yOf(goalVal).toFixed(1)}" stroke="var(--textFaint)" stroke-dasharray="4 4"/>` : "";
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:220px;overflow:visible">
    ${grid}${goalLine}
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.2"/>
    ${xLabels}
  </svg>`;
}

export function trendChartHTML(state) {
  const metrics = [
    { key: "calories", label: "Calorias", color: "var(--calories)", goalKey: "calories", dataKey: "kcal" },
    { key: "protein", label: "Proteína", color: "var(--protein)", goalKey: "protein", dataKey: "protein" },
    { key: "carbs", label: "Carboidratos", color: "var(--carbs)", goalKey: "carbs", dataKey: "carbs" },
    { key: "fat", label: "Gordura", color: "var(--fat)", goalKey: "fat", dataKey: "fat" },
  ];
  const active = metrics.find((m) => m.key === state.trendMetric) || metrics[0];
  const data = [];
  const today = new Date();
  const period = state.historyPeriod || 21;
  
  for (let i = period - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dateKey(d);
    const day = state.diary[k];
    const t = dayTotals(day);
    data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: day && day.entries.length ? t[active.dataKey] : null });
  }
  const goalVal = state.profile.goals ? state.profile.goals[active.goalKey] : null;

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:6px">
        ${icon("trending-up", 15, "var(--calories)")}
        <div style="font-weight:700;font-size:14.5px">Tendência</div>
      </div>
      <div style="display:flex;gap:4px">
        ${[7, 14, 21, 30, 60, 90].map(p => `<button type="button" class="tab" style="padding:5px 9px" data-action="set-period" data-period="${p}">
          <span style="color:${state.historyPeriod === p ? "var(--calories)" : "var(--textMuted)"};font-weight:700">${p}d</span>
        </button>`).join("")}
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:12px">
      ${metrics.map((m) => `<button type="button" class="tab" style="padding:5px 9px" data-action="trend-set-metric" data-metric="${m.key}">
        <span style="color:${state.trendMetric === m.key ? m.color : "var(--textMuted)"};font-weight:700">${m.label}</span>
      </button>`).join("")}
    </div>
    ${trendChartSVG(data, goalVal, active.color)}
  </div>`;
}
