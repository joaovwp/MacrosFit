import { TABS } from '../core/constants.js';
import { hojeTabHTML } from '../views/hojeTab.js';
import { historicoTabHTML } from '../views/historicoTab.js';
import { alimentosTabHTML } from '../views/alimentosTab.js';
import { metasTabHTML } from '../views/metasTab.js';
import { configTabHTML } from '../views/configTab.js';
import { authViewHTML } from '../components/auth/authView.js';
import { profileViewHTML } from '../components/profile/profileView.js';

export function appHTML(state) {
  // Check if user is authenticated
  if (!state.auth.user && state.tab !== 'auth') {
    state.tab = 'auth';
  }

  // Show auth view if not authenticated
  if (state.tab === 'auth') {
    return authViewHTML(state);
  }

  return `
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">
      <div style="font-size:19px;font-weight:700;letter-spacing:-0.01em">painel nutricional</div>
      <div class="mono" style="font-size:11.5px;color:var(--textFaint);text-transform:capitalize">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
    </div>
    ${state.connectionError ? `<div style="background:var(--error);color:white;padding:12px;border-radius:4px;margin-bottom:12px;font-size:13px">${state.connectionError}</div>` : ''}
    <div style="display:flex;gap:18px;border-bottom:1px solid var(--border);margin-bottom:18px;overflow-x:auto">
      ${TABS.map((t) => `<button type="button" class="tab ${state.tab === t.id ? "active" : ""}" data-action="set-tab" data-tab="${t.id}">${t.label}</button>`).join("")}
      <button type="button" class="tab ${state.tab === 'perfil' ? 'active' : ''}" data-action="set-tab" data-tab="perfil">Perfil</button>
    </div>
    ${state.tab === "hoje" ? hojeTabHTML(state) : ""}
    ${state.tab === "historico" ? historicoTabHTML(state) : ""}
    ${state.tab === "alimentos" ? alimentosTabHTML(state) : ""}
    ${state.tab === "metas" ? metasTabHTML(state) : ""}
    ${state.tab === "config" ? configTabHTML(state) : ""}
    ${state.tab === "perfil" ? profileViewHTML(state) : ""}
  `;
}
