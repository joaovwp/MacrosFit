import { icon } from '../../core/icons.js';
import { esc, addDays, dateKey, dayTotals } from '../../core/utils.js';

export function trendChartSVG(data, goalVal, color) {
  const w = 660, h = 280, padL = 48, padR = 16, padT = 24, padB = 32;
  const vals = data.map((d) => d.value).filter((v) => v != null);
  if (!vals.length && goalVal == null) {
    return `<div style="height:280px;display:flex;align-items:center;justify-content:center;color:var(--textFaint);font-size:13px;padding:20px;text-align:center">
      ${icon("trending-up", 32, "var(--textFaint)", "margin:0 auto 12px")}
      <div>Registre alguns dias para ver o gráfico de calorias</div>
    </div>`;
  }
  let min = vals.length ? Math.min(...vals) : (goalVal || 0);
  let max = vals.length ? Math.max(...vals) : (goalVal || 1);
  if (goalVal != null) { min = Math.min(min, goalVal); max = Math.max(max, goalVal); }
  if (min === max) { min -= 100; max += 100; }
  const pad = (max - min) * 0.15;
  const rMin = min - pad, rMax = max + pad;
  const n = data.length;
  const xw = n > 1 ? (w - padL - padR) / (n - 1) : 0;
  const yOf = (v) => h - padB - ((v - rMin) / (rMax - rMin)) * (h - padT - padB);
  const pts = data.map((d, i) => d.value == null ? null : [padL + i * xw, yOf(d.value)]);
  const valid = pts.filter((p) => p);
  const pathD = valid.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  
  // Grid lines
  const gridCount = 5;
  const grid = [];
  for (let i = 0; i <= gridCount; i++) {
    const val = rMin + (rMax - rMin) * (i / gridCount);
    const y = yOf(val);
    grid.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--borderSoft)" stroke-width="1"/>`);
    grid.push(`<text x="${padL - 8}" y="${(y + 3).toFixed(1)}" font-size="11" fill="var(--textFaint)" text-anchor="end">${Math.round(val)}</text>`);
  }
  
  // X labels
  const xLabels = data.map((d, i) => {
    if (n > 14 && i % Math.ceil(n / 7) !== 0) return "";
    if (n > 7 && i % 2 !== 0) return "";
    return `<text x="${(padL + i * xw).toFixed(1)}" y="${h - 12}" font-size="11" fill="var(--textMuted)" text-anchor="middle">${esc(d.label)}</text>`;
  }).join("");
  
  // Goal line
  const goalLine = goalVal != null ? `
    <line x1="${padL}" y1="${yOf(goalVal).toFixed(1)}" x2="${w - padR}" y2="${yOf(goalVal).toFixed(1)}" stroke="var(--calories)" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>
    <text x="${w - padR + 4}" y="${(yOf(goalVal) - 4).toFixed(1)}" font-size="10" fill="var(--calories)" font-weight="600">Meta</text>
  ` : "";
  
  // Data points
  const points = valid.map((p, i) => {
    const hasData = data[i].value != null;
    if (!hasData) return "";
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="var(--calories)" stroke="var(--surface)" stroke-width="2"/>`;
  }).join("");

  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:280px;overflow:visible">
    ${grid.join("")}
    ${goalLine}
    <path d="${pathD}" fill="none" stroke="var(--calories)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${points}
    ${xLabels}
  </svg>`;
}

export function trendChartHTML(state) {
  const today = new Date();
  const period = state.historyPeriod || 21;
  
  const data = [];
  for (let i = period - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = dateKey(d);
    const day = state.diary[k];
    const t = dayTotals(day);
    data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: day && day.entries.length ? t.kcal : null });
  }
  
  const goalVal = state.profile.goals ? state.profile.goals.calories : null;
  
  // Stats
  const vals = data.map((d) => d.value).filter((v) => v != null);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const min = vals.length ? Math.min(...vals) : 0;

  return `<div class="card" style="padding:20px;background:linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--calories);display:flex;align-items:center;justify-content:center">
          ${icon("trending-up", 20, "#17140A")}
        </div>
        <div>
          <div style="font-weight:700;font-size:16px">Tendência de Calorias</div>
          <div style="font-size:12px;color:var(--textMuted)">Média diária do período</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${[7, 14, 21, 30, 60, 90].map(p => `
          <button type="button" 
            class="chip" 
            data-action="set-period" 
            data-period="${p}"
            style="${state.historyPeriod === p ? "background:var(--calories);color:#17140A;border-color:var(--calories)" : ""}">
            ${p}d
          </button>
        `).join("")}
      </div>
    </div>
    
    ${vals.length > 0 ? `
    <div style="display:flex;gap:20px;margin-bottom:16px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--surface2);border-radius:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--calories)"></div>
        <div>
          <div style="font-size:11px;color:var(--textMuted)">Média</div>
          <div class="mono" style="font-size:16px;font-weight:700;color:var(--text)">${avg}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--surface2);border-radius:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--good)"></div>
        <div>
          <div style="font-size:11px;color:var(--textMuted)">Máxima</div>
          <div class="mono" style="font-size:16px;font-weight:700;color:var(--text)">${Math.round(max)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--surface2);border-radius:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--over)"></div>
        <div>
          <div style="font-size:11px;color:var(--textMuted)">Mínima</div>
          <div class="mono" style="font-size:16px;font-weight:700;color:var(--text)">${min}</div>
        </div>
      </div>
    </div>
    ` : ""}
    
    ${trendChartSVG(data, goalVal, "var(--calories)")}
    
    ${goalVal ? `
    <div style="margin-top:16px;padding:12px;background:var(--surface2);border-radius:8px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:13px;color:var(--textMuted)">Meta diária</div>
      <div class="mono" style="font-size:16px;font-weight:700;color:var(--calories)">${goalVal} kcal</div>
    </div>
    ` : ""}
  </div>`;
}
