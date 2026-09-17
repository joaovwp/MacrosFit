import { icon } from '../../core/icons.js';
import { dateKey, emptyDay } from '../../core/utils.js';

export function extrasBarHTML(settings, diary) {
  const today = diary[dateKey(new Date())] || emptyDay();
  if (!settings.trackWeight && !settings.trackWater && !settings.trackWorkout) return "";
  return `<div style="display:flex;gap:10px;flex-wrap:wrap">
    ${settings.trackWeight ? `<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px">
      <span style="font-size:12.5px;color:var(--textMuted)">Peso</span>
      <input id="extras-weight" class="input" type="number" style="width:64px" value="${today.weight != null ? today.weight : ""}" data-action="extras-weight-input"/>
      <span style="font-size:12px;color:var(--textFaint)">kg</span>
    </div>` : ""}
    ${settings.trackWater ? `<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px">
      ${icon("droplet", 14, "var(--protein)")}
      <span class="mono" style="font-size:12.5px">${today.water || 0}ml</span>
      <button class="btn" style="padding:4px 8px;font-size:11.5px" data-action="extras-water-add" data-amt="250">+250</button>
      <button class="btn" style="padding:4px 8px;font-size:11.5px" data-action="extras-water-add" data-amt="500">+500</button>
      <button class="btn" style="padding:4px 8px;font-size:11.5px" data-action="extras-water-reset">zerar</button>
    </div>` : ""}
    ${settings.trackWorkout ? `<div class="card" style="padding:10px 14px;display:flex;align-items:center;gap:8px">
      ${icon("dumbbell", 14, "var(--fat)")}
      <label class="checkline"><input type="checkbox" data-action="extras-workout-toggle" ${today.workout && today.workout.done ? "checked" : ""}/> treinei hoje</label>
    </div>` : ""}
  </div>`;
}
