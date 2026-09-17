import { icon } from '../../core/icons.js';
import { esc, round } from '../../core/utils.js';
import { MEAL_TYPES } from '../../core/constants.js';
import { recentFoods, qaSuggestions, qaBasis, qaComputed } from '../../state/selectors.js';

export function quickAddFormHTML(state) {
  const recent = recentFoods(state);
  const suggestions = state.qa.showSuggest ? qaSuggestions(state) : [];
  const basis = qaBasis(state);
  const computed = qaComputed(state);
  const grams = parseFloat(state.qa.grams) || 0;
  const canSubmit = state.qa.name.trim() && grams > 0 && (computed || parseFloat(state.qa.manual.kcal) > 0);

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      ${icon("list-plus", 17, "var(--calories)")}
      <div style="font-weight:700;font-size:15px">Registrar alimento</div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Tipo de refeição</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${MEAL_TYPES.map((mt) => `
          <button type="button" class="chip" data-action="qa-meal-select" data-meal="${mt.id}" 
            style="${state.qa.mealType === mt.id ? "border-color:var(--calories);background:var(--calories);color:#17140A" : ""}">
            ${icon(mt.icon, 12, state.qa.mealType === mt.id ? "#17140A" : "var(--textMuted)")}
            ${esc(mt.label)}
          </button>
        `).join("")}
      </div>
    </div>
    ${recent.length ? `<div class="ft-scroll" style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px">
      ${recent.map((r, i) => `<div class="chip" data-action="qa-pick-recent" data-index="${i}">${esc(r.name)}</div>`).join("")}
    </div>` : ""}
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <div style="position:relative;flex:2">
        <input id="qa-name" class="input" placeholder="Nome do alimento" value="${esc(state.qa.name)}" data-action="qa-name-input" autocomplete="off"/>
        ${suggestions.length ? `<div class="suggest">
          ${suggestions.map((f) => `<div class="suggest-item" data-action="qa-pick-suggestion" data-id="${f.id}"><span>${esc(f.name)}</span><span class="mono" style="color:var(--textMuted)">${Math.round(f.kcal)} kcal/100g</span></div>`).join("")}
        </div>` : ""}
      </div>
      <input id="qa-grams" class="input" placeholder="g" type="number" inputmode="decimal" style="flex:1" value="${esc(state.qa.grams)}" data-action="qa-grams-input"/>
    </div>
    ${computed ? `<div style="display:flex;gap:14px;font-size:12.5px;color:var(--textMuted);margin-bottom:10px;flex-wrap:wrap">
      <span class="mono" style="color:var(--calories)">${Math.round(computed.kcal)} kcal</span>
      <span class="mono" style="color:var(--protein)">P ${round(computed.protein)}g</span>
      <span class="mono" style="color:var(--carbs)">C ${round(computed.carbs)}g</span>
      <span class="mono" style="color:var(--fat)">G ${round(computed.fat)}g</span>
      <a class="link" data-action="qa-open-manual">ajustar manualmente</a>
    </div>` : ""}
    ${!computed && state.qa.name.trim() ? (state.qa.manualOpen ? `<div style="margin-bottom:10px">
      <div style="font-size:12px;color:var(--textMuted);margin-bottom:6px">Alimento novo — valores para ${grams > 0 ? `${grams}g` : "essa quantidade"}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">
        <input class="input" placeholder="kcal" type="number" value="${esc(state.qa.manual.kcal)}" data-action="qa-manual-input" data-field="kcal"/>
        <input class="input" placeholder="prot. g" type="number" value="${esc(state.qa.manual.protein)}" data-action="qa-manual-input" data-field="protein"/>
        <input class="input" placeholder="carb. g" type="number" value="${esc(state.qa.manual.carbs)}" data-action="qa-manual-input" data-field="carbs"/>
        <input class="input" placeholder="gord. g" type="number" value="${esc(state.qa.manual.fat)}" data-action="qa-manual-input" data-field="fat"/>
      </div>
      <label class="checkline"><input type="checkbox" data-action="qa-savelib-toggle" ${state.qa.saveToLib ? "checked" : ""}/> Salvar na biblioteca para reconhecer da próxima vez</label>
    </div>` : `<div style="margin-bottom:10px"><a class="link" data-action="qa-open-manual">não encontrei na biblioteca — inserir valores manualmente</a></div>`) : ""}
    <div style="display:flex;align-items:center;gap:10px">
      <button class="btn btn-primary" data-action="qa-submit" ${canSubmit ? "" : "disabled"}>${icon("plus", 15)} Adicionar</button>
      ${state.qa.msg ? `<span style="font-size:12.5px;color:var(--good)">${esc(state.qa.msg)}</span>` : ""}
    </div>
  </div>`;
}
