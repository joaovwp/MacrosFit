import { icon } from '../core/icons.js';
import { dateKey, emptyDay, dayTotals } from '../core/utils.js';
import { circularGauge } from '../components/shared/circularGauge.js';
import { macroBar } from '../components/shared/macroBar.js';
import { macroDonut } from '../components/shared/macroDonut.js';
import { quickAddFormHTML } from '../components/today/quickAddForm.js';
import { todayEntriesHTML } from '../components/today/todayEntries.js';
import { extrasBarHTML } from '../components/today/extrasBar.js';

export function hojeTabHTML(state) {
  const goals = state.profile.goals;
  if (!goals) {
    return `<div class="card" style="padding:28px;text-align:center">
      ${icon("sparkles", 22, "var(--calories)", "margin:0 auto 10px")}
      <div style="font-weight:700;font-size:15.5px;margin-bottom:6px">Defina suas metas para começar</div>
      <div style="font-size:13px;color:var(--textMuted);margin-bottom:16px">Configure calorias, proteína, carboidratos e gordura na aba Metas.</div>
      <button class="btn btn-primary" data-action="set-tab" data-tab="metas">Ir para Metas</button>
    </div>`;
  }
  const today = state.diary[dateKey(new Date())] || emptyDay();
  const totals = dayTotals(today);
  
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:18px">
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        ${circularGauge(totals.kcal, goals.calories, "var(--calories)", 148, totals.kcal > goals.calories ? "acima da meta" : "consumidas", "kcal")}
        <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:12px">
          ${macroBar("Proteína", totals.protein, goals.protein, "var(--protein)")}
          ${macroBar("Carboidratos", totals.carbs, goals.carbs, "var(--carbs)")}
          ${macroBar("Gordura", totals.fat, goals.fat, "var(--fat)")}
        </div>
      </div>
      <div style="font-size:12px;margin-top:12px;color:${totals.kcal > goals.calories ? "var(--over)" : "var(--textFaint)"}">
        ${totals.kcal > goals.calories ? `${Math.round(totals.kcal - goals.calories)} kcal acima da meta de hoje` : `restam ${Math.round(goals.calories - totals.kcal)} kcal hoje`}
      </div>
    </div>
    <div class="card" style="padding:18px;display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      ${macroDonut(goals.protein, goals.carbs, goals.fat)}
      <div style="flex:1;min-width:160px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">Distribuição da meta</div>
        ${[["Proteína", "var(--protein)"], ["Carboidratos", "var(--carbs)"], ["Gordura", "var(--fat)"]].map(([n, c]) => `
          <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;margin-bottom:4px">
            <div style="width:8px;height:8px;border-radius:2px;background:${c}"></div>
            <span style="color:var(--textMuted)">${n}</span>
          </div>`).join("")}
      </div>
    </div>
    ${extrasBarHTML(state.profile.settings, state.diary)}
    ${quickAddFormHTML(state)}
    ${todayEntriesHTML(state)}
  </div>`;
}
