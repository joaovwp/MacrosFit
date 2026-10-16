import { esc } from '../../core/utils.js';
import { formatMacros } from '../../core/macroUtils.js';

export function entryCardHTML(entry) {
  return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--borderSoft)">
    <div style="flex:1;min-width:0">
      <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(entry.name)}</div>
      <div class="mono" style="font-size:10px;color:var(--textMuted);margin-top:1px">${formatMacros({ ...entry, grams: entry.grams }, true)}</div>
    </div>
  </div>`;
}
