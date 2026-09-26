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
  const canAddItem = state.qa.name.trim() && grams > 0 && (computed || parseFloat(state.qa.manual.kcal) > 0);
  const canSubmitNewFood = state.qa.newFoodForm.name.trim() &&
    parseFloat(state.qa.newFoodForm.kcal) > 0 &&
    parseFloat(state.qa.newFoodForm.protein) >= 0 &&
    parseFloat(state.qa.newFoodForm.carbs) >= 0 &&
    parseFloat(state.qa.newFoodForm.fat) >= 0;
  const canSaveMeal = state.qa.currentMealItems.length > 0;

  return `<div class="card" style="padding:16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      ${icon("list-plus", 17, "var(--calories)")}
      <div style="font-weight:700;font-size:15px">Registrar refeição</div>
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
    <div style="margin-bottom:10px">
      <div style="font-size:11.5px;color:var(--textFaint);margin-bottom:4px">Data (opcional)</div>
      <input class="input" type="date" value="${esc(state.qa.targetDate || "")}" data-action="qa-date-input" placeholder="Hoje"/>
    </div>
    ${recent.length ? `<div class="ft-scroll" style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px">
      ${recent.map((r, i) => `<div class="chip" data-action="qa-pick-recent" data-index="${i}">${esc(r.name)}</div>`).join("")}
    </div>` : ""}

    ${state.qa.conversionWarning ? `<div style="background:var(--surface2);padding:8px;border-radius:6px;margin-bottom:12px;font-size:11px;color:var(--textMuted)">
      ${icon("info", 12, "var(--protein)")} ${esc(state.qa.conversionWarning)}
    </div>` : ""}

    ${state.qa.newFoodMode ? `
      <div class="card" style="padding:14px;margin-bottom:14px;background:var(--surface2)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${icon("plus", 14, "var(--protein)")}
          <div style="font-size:12px;font-weight:600">Cadastrar novo alimento</div>
          <button class="btn btn-icon" style="margin-left:auto" data-action="qa-new-food-cancel">${icon("x", 12)}</button>
        </div>
        <div style="font-size:11px;color:var(--textMuted);margin-bottom:8px">Valores nutricionais</div>
        <div style="display:grid;grid-template-columns:2fr repeat(4,1fr);gap:6px;margin-bottom:10px">
          <div>
            <div style="font-size:10px;color:var(--textFaint);margin-bottom:2px">Nome</div>
            <input class="input" placeholder="Nome do alimento" value="${esc(state.qa.newFoodForm.name)}" data-action="qa-new-food-input" data-field="name"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--calories);margin-bottom:2px">kcal</div>
            <input class="input" placeholder="kcal" type="number" value="${esc(state.qa.newFoodForm.kcal)}" data-action="qa-new-food-input" data-field="kcal"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--protein);margin-bottom:2px">prot.</div>
            <input class="input" placeholder="prot." type="number" value="${esc(state.qa.newFoodForm.protein)}" data-action="qa-new-food-input" data-field="protein"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--carbs);margin-bottom:2px">carb.</div>
            <input class="input" placeholder="carb." type="number" value="${esc(state.qa.newFoodForm.carbs)}" data-action="qa-new-food-input" data-field="carbs"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--fat);margin-bottom:2px">gord.</div>
            <input class="input" placeholder="gord." type="number" value="${esc(state.qa.newFoodForm.fat)}" data-action="qa-new-food-input" data-field="fat"/>
          </div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:10px;color:var(--textFaint);margin-bottom:2px">Gramas (base dos valores informados)</div>
          <input class="input" placeholder="gramas" type="number" value="${esc(state.qa.newFoodForm.grams)}" data-action="qa-new-food-input" data-field="grams"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="qa-new-food-submit" ${canSubmitNewFood ? "" : "disabled"}>Salvar e usar</button>
          <button class="btn" data-action="qa-new-food-cancel">Cancelar</button>
        </div>
      </div>
    ` : `
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <div style="position:relative;flex:2">
          <input id="qa-name" class="input" placeholder="Nome do alimento" value="${esc(state.qa.name)}" data-action="qa-name-input" autocomplete="off"/>
          ${suggestions.length ? `<div class="suggest">
            ${suggestions.map((f) => `<div class="suggest-item" data-action="qa-pick-suggestion" data-id="${f.id}" data-source="${f.source || 'user'}">
              <div class="qa-suggestion-header">
                <span>${esc(f.name)}</span>
                <span class="qa-badge qa-badge--${f.source === 'standard' ? 'standard' : 'user'}">${f.source === 'standard' ? 'TACO' : 'Meu'}</span>
              </div>
              <span class="qa-suggestion-macros">${Math.round(f.kcal)} kcal (100g) · P ${round(f.protein)}g · C ${round(f.carbs)}g · G ${round(f.fat)}g</span>
            </div>`).join("")}
          </div>` : ""}
        </div>
        <input id="qa-grams" class="input" placeholder="g" type="number" inputmode="decimal" style="flex:1" value="${esc(state.qa.grams)}" data-action="qa-grams-input"/>
      </div>
      ${computed ? `<div style="display:flex;gap:14px;font-size:12.5px;color:var(--textMuted);margin-bottom:10px;flex-wrap:wrap" data-qa-computed-macros>
        <span class="mono" style="color:var(--calories)">${Math.round(computed.kcal)} kcal</span>
        <span class="mono" style="color:var(--protein)">P ${round(computed.protein)}g</span>
        <span class="mono" style="color:var(--carbs)">C ${round(computed.carbs)}g</span>
        <span class="mono" style="color:var(--fat)">G ${round(computed.fat)}g</span>
      </div>` : ""}
      ${!computed && state.qa.name.trim() ? (state.qa.manualOpen ? `<div style="margin-bottom:10px">
        <div style="font-size:12px;color:var(--textMuted);margin-bottom:6px">Alimento não encontrado na biblioteca</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">
          <input class="input" placeholder="kcal" type="number" value="${esc(state.qa.manual.kcal)}" data-action="qa-manual-input" data-field="kcal"/>
          <input class="input" placeholder="prot. g" type="number" value="${esc(state.qa.manual.protein)}" data-action="qa-manual-input" data-field="protein"/>
          <input class="input" placeholder="carb. g" type="number" value="${esc(state.qa.manual.carbs)}" data-action="qa-manual-input" data-field="carbs"/>
          <input class="input" placeholder="gord. g" type="number" value="${esc(state.qa.manual.fat)}" data-action="qa-manual-input" data-field="fat"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="qa-new-food-mode">Registrar alimento</button>
          <button class="btn" data-action="qa-open-manual-cancel">Cancelar</button>
        </div>
      </div>` : `<div style="margin-bottom:10px"><a class="link" data-action="qa-open-manual">Não encontrou o alimento? Cadastrar novo</a></div>`) : ""}
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-primary" data-action="qa-add-item" ${canAddItem ? "" : "disabled"}>${icon("plus", 15)} Adicionar</button>
        ${state.qa.msg ? `<span style="font-size:12.5px;color:var(--good)">${esc(state.qa.msg)}</span>` : ""}
      </div>
    `}

    ${state.qa.currentMealItems.length > 0 ? `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--borderSoft)">
        <div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--textMuted)">Itens da refeição (${state.qa.currentMealItems.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
          ${state.qa.currentMealItems.map((item, index) => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--surface2);border-radius:6px">
              <div style="flex:1">
                <div style="font-size:12px;font-weight:500">${esc(item.name)}</div>
                <div style="font-size:11px;color:var(--textMuted)">
                  <span class="mono">${Math.round(item.grams)}g</span>
                  <span style="margin:0 4px">•</span>
                  <span class="mono" style="color:var(--calories)">${Math.round(item.kcal)} kcal</span>
                  <span style="margin:0 4px">•</span>
                  <span class="mono" style="color:var(--protein)">P ${round(item.protein)}g</span>
                  <span style="margin:0 4px">•</span>
                  <span class="mono" style="color:var(--carbs)">C ${round(item.carbs)}g</span>
                  <span style="margin:0 4px">•</span>
                  <span class="mono" style="color:var(--fat)">G ${round(item.fat)}g</span>
                </div>
              </div>
              <button class="btn btn-icon" data-action="qa-remove-temp-item" data-index="${index}">${icon("trash-2", 14, "var(--error)")}</button>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="qa-save-meal" ${canSaveMeal ? "" : "disabled"}>${icon("check", 14)} Registrar refeição</button>
          <button class="btn" data-action="qa-clear-meal">${icon("x", 14)} Limpar</button>
        </div>
      </div>
    ` : ""}

    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--borderSoft)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        ${icon("upload", 17, "var(--calories)")}
        <div style="font-weight:700;font-size:15px">Importar refeição</div>
      </div>
      <textarea class="input" placeholder="Cole o JSON da refeição aqui..." style="min-height:100px;font-family:monospace;font-size:12px;resize:vertical;margin-bottom:12px" data-action="meal-import-text-input">${esc(state.importExport.mealImportData || "")}</textarea>
      <div style="background:var(--surface2);padding:8px;border-radius:6px;font-size:10px;color:var(--textMuted);margin-bottom:12px;overflow-x:auto">
        <div style="font-size:11px;color:var(--textFaint);margin-bottom:4px">Exemplo:</div>
        <pre style="margin:0;white-space:pre-wrap;font-size:9px">{
  "mealType": "almoco",
  "mealName": "Almoço",
  "items": [
    {
      "name": "Arroz",
      "grams": 100,
      "kcal": 130,
      "protein": 2.7,
      "carbs": 28,
      "fat": 0.3
    }
  ]
}</pre>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" data-action="import-meal">${icon("upload", 14)} Importar refeição</button>
      </div>
    </div>
  </div>`;
}
