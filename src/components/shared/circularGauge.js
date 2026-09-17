import { clamp, esc } from '../../core/utils.js';

export function circularGauge(value, max, color, size, label, unit) {
  size = size || 148;
  const pct = max > 0 ? clamp(value / max, 0, 1) : 0;
  const r = (size - 16) / 2, c = 2 * Math.PI * r;
  const over = max > 0 && value > max;
  const dcolor = over ? "var(--over)" : color;
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--surface2)" stroke-width="11" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${dcolor}" stroke-width="11" fill="none" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" stroke-linecap="round" style="transition:stroke-dashoffset .4s ease"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div class="mono" style="font-size:26px;font-weight:700;color:var(--text);line-height:1">${Math.round(value)}</div>
      <div style="font-size:11px;color:var(--textMuted);margin-top:4px">${esc(unit)}</div>
      ${label ? `<div style="font-size:10.5px;color:var(--textFaint);margin-top:2px">${esc(label)}</div>` : ""}
    </div>
  </div>`;
}
