import { TABS } from '../core/constants.js';
import { hojeTabHTML } from '../views/hojeTab.js';
import { historicoTabHTML } from '../views/historicoTab.js';
import { alimentosTabHTML } from '../views/alimentosTab.js';
import { metasTabHTML } from '../views/metasTab.js';
import { configTabHTML } from '../views/configTab.js';

export function appHTML(state) {
  return `
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">
      <div style="font-size:19px;font-weight:700;letter-spacing:-0.01em">painel nutricional</div>
      <div class="mono" style="font-size:11.5px;color:var(--textFaint);text-transform:capitalize">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
    </div>
    <div style="display:flex;gap:18px;border-bottom:1px solid var(--border);margin-bottom:18px;overflow-x:auto">
      ${TABS.map((t) => `<button type="button" class="tab ${state.tab === t.id ? "active" : ""}" data-action="set-tab" data-tab="${t.id}">${t.label}</button>`).join("")}
    </div>
    ${state.tab === "hoje" ? hojeTabHTML(state) : ""}
    ${state.tab === "historico" ? historicoTabHTML(state) : ""}
    ${state.tab === "alimentos" ? alimentosTabHTML(state) : ""}
    ${state.tab === "metas" ? metasTabHTML(state) : ""}
    ${state.tab === "config" ? configTabHTML(state) : ""}
  `;
}
