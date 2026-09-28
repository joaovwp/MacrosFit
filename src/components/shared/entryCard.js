import { icon } from '../../core/icons.js';
import { esc } from '../../core/utils.js';

export function entryCardHTML(entry, entryEdit) {
  return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--borderSoft)">
    <div style="flex:1;min-width:0">
      <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(entry.name)}</div>
      <div class="mono" style="font-size:10px;color:var(--textMuted);margin-top:1px">${Math.round(entry.kcal)} kcal · ${entry.grams}g</div>
    </div>
    ${entryEdit.id === entry.id ? `
      <input class="input" style="width:50px;text-align:center;-moz-appearance:textfield" type="number" value="${esc(entryEdit.val)}" data-action="entry-edit-input" autofocus/>
      <span style="font-size:10px;color:var(--textFaint)">g</span>
      <button class="btn btn-icon" data-action="entry-edit-confirm" data-id="${entry.id}" data-fallback="${entry.grams}">${icon("check", 12)}</button>
      <button class="btn btn-icon" data-action="entry-edit-cancel">${icon("x", 12)}</button>
    ` : `
      <button class="btn btn-icon" data-action="entry-edit-start" data-id="${entry.id}" data-grams="${entry.grams}">${icon("pencil", 12)}</button>
      <button class="btn btn-icon btn-danger" data-action="entry-delete" data-id="${entry.id}">${icon("trash", 12)}</button>
    `}
  </div>`;
}
