import { icon } from '../../core/icons.js';
import { esc, normalize, round } from '../../core/utils.js';

export function libraryViewHTML(state) {
  const q = normalize(state.lib.query);
  const libraryList = Object.values(state.library).filter((f) => (!q || normalize(f.name).includes(q))).sort((a, b) => a.name.localeCompare(b.name));
  const standardList = (state.lib.standardFoods || []).filter((f) => (!q || normalize(f.name).includes(q))).sort((a, b) => a.name.localeCompare(b.name));

  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Biblioteca de alimentos</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Seus alimentos base e alimentos padrão TACO (valores por 100g).</div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <div style="position:relative;flex:1">
          <span style="position:absolute;left:10px;top:10px">${icon("search", 14, "var(--textFaint)")}</span>
          <input id="lib-search-input" class="input" style="padding-left:30px" placeholder="Buscar alimento" value="${esc(state.lib.query)}" data-action="lib-search-input"/>
        </div>
        <button class="btn btn-primary" data-action="lib-toggle-add">${icon("plus", 15)} Novo</button>
      </div>
      ${state.lib.adding ? `<div class="card" style="padding:14px;margin-bottom:14px;background:var(--surface2)">
        ${state.lib.conversionWarning ? `<div style="background:var(--surface2);padding:8px;border-radius:6px;margin-bottom:12px;font-size:11px;color:var(--textMuted)">
          ${icon("info", 12, "var(--protein)")} ${esc(state.lib.conversionWarning)}
        </div>` : ""}
        <div style="font-size:12px;color:var(--textMuted);margin-bottom:8px">Valores nutricionais</div>
        <div style="display:grid;grid-template-columns:2fr repeat(4,1fr);gap:6px;margin-bottom:10px">
          <div>
            <div style="font-size:10px;color:var(--textFaint);margin-bottom:2px">Nome</div>
            <input class="input" placeholder="Nome do alimento" value="${esc(state.lib.form.name)}" data-action="lib-form-input" data-field="name"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--calories);margin-bottom:2px">kcal</div>
            <input class="input" placeholder="kcal" type="number" value="${esc(state.lib.form.kcal)}" data-action="lib-form-input" data-field="kcal"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--protein);margin-bottom:2px">prot.</div>
            <input class="input" placeholder="prot." type="number" value="${esc(state.lib.form.protein)}" data-action="lib-form-input" data-field="protein"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--carbs);margin-bottom:2px">carb.</div>
            <input class="input" placeholder="carb." type="number" value="${esc(state.lib.form.carbs)}" data-action="lib-form-input" data-field="carbs"/>
          </div>
          <div>
            <div style="font-size:10px;color:var(--fat);margin-bottom:2px">gord.</div>
            <input class="input" placeholder="gord." type="number" value="${esc(state.lib.form.fat)}" data-action="lib-form-input" data-field="fat"/>
          </div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:10px;color:var(--textFaint);margin-bottom:2px">Gramas (base dos valores informados)</div>
          <input class="input" placeholder="gramas" type="number" value="${esc(state.lib.form.grams)}" data-action="lib-form-input" data-field="grams"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" data-action="lib-submit">${state.lib.editingId ? "Salvar alterações" : "Adicionar"}</button>
          <button class="btn" data-action="lib-cancel-add">Cancelar</button>
        </div>
      </div>` : ""}

      ${libraryList.length > 0 ? `<div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;color:var(--textMuted);margin-bottom:8px">Meus alimentos</div>
        <div class="card" style="padding:4px">
          ${libraryList.map((f) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--borderSoft)">
            <div style="flex:1">
              <div style="font-size:13.5px;font-weight:600">${esc(f.name)}</div>
              <div class="mono" style="font-size:11px;color:var(--textMuted);margin-top:2px">${Math.round(f.kcal)} kcal · P${round(f.protein)}g C${round(f.carbs)}g G${round(f.fat)}g /100g</div>
            </div>
            <button class="btn btn-icon" data-action="lib-edit" data-id="${f.id}">${icon("pencil", 13)}</button>
            <button class="btn btn-icon btn-danger" data-action="lib-delete" data-id="${f.id}">${icon("trash", 13)}</button>
          </div>`).join("")}
        </div>
      </div>` : ""}

      ${standardList.length > 0 ? `<div>
        <div style="font-size:12px;font-weight:600;color:var(--textMuted);margin-bottom:8px">Alimentos padrão (TACO)</div>
        <div class="card" style="padding:4px">
          ${standardList.map((f) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--borderSoft)">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:13.5px;font-weight:600">${esc(f.name)}</span>
                <span class="qa-badge qa-badge--standard">TACO</span>
              </div>
              <div class="mono" style="font-size:11px;color:var(--textMuted);margin-top:2px">${Math.round(f.kcal)} kcal · P${round(f.protein)}g C${round(f.carbs)}g G${round(f.fat)}g /100g</div>
            </div>
          </div>`).join("")}
        </div>
      </div>` : ""}

      ${libraryList.length === 0 && standardList.length === 0 ? `<div class="card" style="padding:20px;text-align:center;color:var(--textFaint);font-size:13.5px">Nenhum alimento encontrado. Busque por nome ou adicione novos alimentos.</div>` : ""}
    </div>
  </div>`;
}
