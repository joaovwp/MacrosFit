import { icon } from '../../core/icons.js';
import { esc, dateKey, parseKey, addDays, dayTotals } from '../../core/utils.js';
import { WEEKDAYS, MONTHS } from '../../core/constants.js';

export function calendarMonthHTML(state) {
  const year = state.viewMonth.getFullYear(), month = state.viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const todayK = dateKey(new Date());
  const goals = state.profile.goals;

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button class="btn btn-icon" data-action="cal-prev">${icon("chevron-left", 15)}</button>
      <div style="font-weight:700;font-size:14.5px;text-transform:capitalize">${MONTHS[month]} ${year}</div>
      <button class="btn btn-icon" data-action="cal-next">${icon("chevron-right", 15)}</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:6px">
      ${WEEKDAYS.map((w) => `<div style="font-size:10.5px;color:var(--textFaint);text-align:center;text-transform:uppercase">${w}</div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
      ${cells.map((d) => {
        if (!d) return `<div></div>`;
        const key = dateKey(new Date(year, month, d));
        const day = state.diary[key];
        const isToday = key === todayK;
        const hasData = day && day.entries && day.entries.length > 0;
        
        let cellStyle = "background:var(--surface2);border-color:var(--borderSoft)";
        let dayColor = "var(--textMuted)";
        let dayDetails = "";
        
        if (hasData && goals) {
          const t = dayTotals(day);
          const pct = goals.calories > 0 ? (t.kcal / goals.calories) * 100 : 0;
          const onTarget = Math.abs(pct - 100) <= 10;
          
          if (onTarget) {
            cellStyle = "background:var(--good)20;border-color:var(--good)";
            dayColor = "var(--good)";
          } else if (pct > 110) {
            cellStyle = "background:var(--over)20;border-color:var(--over)";
            dayColor = "var(--over)";
          } else if (pct < 90) {
            cellStyle = "background:var(--calories)20;border-color:var(--calories)";
            dayColor = "var(--calories)";
          }
          
          dayDetails = `
            <div style="position:absolute;bottom:3px;right:3px;display:flex;flex-direction:column;gap:2px;font-size:9px;text-align:right;">
              <div style="color:var(--calories);font-weight:600">${Math.round(t.kcal)} kcal</div>
              <div style="color:var(--protein)">P: ${Math.round(t.protein)}g</div>
              <div style="color:var(--carbs)">C: ${Math.round(t.carbs)}g</div>
              <div style="color:var(--fat)">G: ${Math.round(t.fat)}g</div>
            </div>
          `;
        }
        
        if (isToday) {
          cellStyle = "background:var(--calories)30;border-color:var(--calories)";
          dayColor = "var(--calories)";
        }
        
        return `<button type="button" class="cal-cell ${hasData ? "has-data" : ""} ${state.selectedKey === key ? "selected" : ""}"
          style="${cellStyle};min-height:65px"
          data-action="cal-select-day" data-key="${key}" ${hasData ? "" : "disabled"}>
          <span style="position:absolute;top:3px;left:5px;font-size:10.5px;color:${dayColor}">${d}</span>
          ${dayDetails}
        </button>`;
      }).join("")}
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12px;color:var(--textMuted);flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:var(--good)"></div>Na meta</div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:var(--calories)"></div>Abaixo</div>
      <div style="display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:2px;background:var(--over)"></div>Acima</div>
    </div>
  </div>`;
}
