export function macroDonut(protein, carbs, fat, size) {
  size = size || 168;
  const p = Math.max(0, protein * 4), c = Math.max(0, carbs * 4), f = Math.max(0, fat * 9);
  const total = p + c + f;
  let grad;
  if (total <= 0) {
    grad = "var(--surface2)";
  } else {
    const p1 = (p / total) * 100, p2 = p1 + (c / total) * 100;
    grad = `conic-gradient(var(--protein) 0 ${p1}%, var(--carbs) ${p1}% ${p2}%, var(--fat) ${p2}% 100%)`;
  }
  return `<div class="donut" style="background:${grad}">
    <div class="donut-hole"><div class="mono" style="font-size:20px;font-weight:700">${Math.round(total)}</div><div style="font-size:10.5px;color:var(--textMuted)">kcal</div></div>
  </div>`;
}
