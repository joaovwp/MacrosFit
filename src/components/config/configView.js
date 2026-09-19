import { icon } from '../../core/icons.js';
import { esc } from '../../core/utils.js';

export function configViewHTML(state) {
  return `<div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Importar/Exportar dados</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Faça backup dos seus dados ou importe de outro dispositivo.</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn" data-action="export-data">${icon("download", 14)} Exportar JSON</button>
        <button class="btn" data-action="show-import">${icon("upload", 14)} Importar JSON</button>
      </div>
      ${state.importExport.showImport ? `<div style="margin-bottom:12px">
        <textarea class="input" placeholder="Cole o JSON aqui..." style="min-height:120px;font-family:monospace;font-size:12px" data-action="import-text-input">${esc(state.importExport.importData)}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" data-action="import-data">Importar</button>
          <button class="btn" data-action="cancel-import">Cancelar</button>
        </div>
      </div>` : ""}
    </div>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Importar refeição</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Importe uma refeição específica de um arquivo JSON.</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn" data-action="show-meal-import">${icon("upload", 14)} Importar refeição</button>
      </div>
      ${state.importExport.showMealImport ? `<div style="margin-bottom:12px">
        <div style="font-size:11px;color:var(--textFaint);margin-bottom:6px">Formato esperado:</div>
        <pre style="background:var(--surface2);padding:8px;border-radius:6px;font-size:10px;color:var(--textMuted);margin-bottom:8px;overflow-x:auto">{
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
        <textarea class="input" placeholder="Cole o JSON da refeição aqui..." style="min-height:120px;font-family:monospace;font-size:12px" data-action="meal-import-text-input">${esc(state.importExport.mealImportData)}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" data-action="import-meal">Importar refeição</button>
          <button class="btn" data-action="cancel-meal-import">Cancelar</button>
        </div>
      </div>` : ""}
    </div>
    <div class="card" style="padding:16px">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px">Sobre o app</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:8px">MacrosFit v2.1</div>
      <div style="font-size:11px;color:var(--textFaint)">Rastreamento de calorias e macronutrientes com organização por refeições.</div>
    </div>
    <div class="card" style="padding:16px;border-color:var(--over)">
      <div style="font-weight:700;font-size:15px;margin-bottom:4px;color:var(--over)">Zona de risco</div>
      <div style="font-size:12.5px;color:var(--textMuted);margin-bottom:12px">Apaga permanentemente metas, biblioteca e histórico.</div>
      ${state.confirmDelete ? `<div style="display:flex;gap:8px">
        <button class="btn" style="background:var(--over);border-color:var(--over);color:#fff" data-action="reset-confirm">Confirmar exclusão</button>
        <button class="btn" data-action="reset-cancel">Cancelar</button>
      </div>` : `<button class="btn" data-action="reset-ask">Apagar todos os dados</button>`}
    </div>
  </div>`;
}
