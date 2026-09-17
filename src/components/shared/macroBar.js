import { clamp, round, esc } from '../../core/utils.js';

export function macroBar(label, value, goal, color, unit) {
  unit = unit || "g";
  const pct = goal > 0 ? clamp((value / goal) * 100, 0, 100) : 0;
  const over = goal > 0 && value > goal;
  const remaining = goal - value;
  return `<div>
    <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
      <span style="color:var(--text);font-weight:600">${esc(label)}</span>
      <span class="mono" style="color:var(--textMuted)">${round(value)}${unit} / ${goal ? goal : "–"}${goal ? unit : ""}</span>
    </div>
    <div style="height:8px;border-radius:4px;background:var(--surface2);overflow:hidden">
      <div style="width:${pct}%;height:100%;background:${over ? "var(--over)" : color};transition:width .3s ease"></div>
    </div>
    ${goal > 0 ? `<div style="font-size:11px;margin-top:4px;color:${over ? "var(--over)" : "var(--textFaint)"}">${over ? `+${round(value - goal)}${unit} acima da meta` : `faltam ${round(remaining)}${unit}`}</div>` : ""}
  </div>`;
}
