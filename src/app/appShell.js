import { TABS } from '../core/constants.js';
import { hojeTabHTML } from '../views/hojeTab.js';
import { historicoTabHTML } from '../views/historicoTab.js';
import { libraryViewHTML } from '../components/library/libraryView.js';
import { metasTabHTML } from '../views/metasTab.js';
import { profileViewHTML } from '../components/profile/profileView.js';
import { configViewHTML } from '../components/config/configView.js';
import { authViewHTML } from '../components/auth/authView.js';
import { icon } from '../core/icons.js';

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
    <div class="app-container">
      <!-- Navbar -->
      <div class="navbar">
        <button class="menu-btn" data-action="toggle-sidebar">
          ${icon("menu", 20)}
        </button>
        <div class="nav-title">MacrosFit</div>
      </div>
      
      <!-- Swipe Area -->
      <div class="swipe-area" data-action="toggle-sidebar"></div>
      
      <!-- Sidebar -->
      <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}">
        <nav class="sidebar-nav">
          ${TABS.map((t) => `
            <button class="nav-item ${state.tab === t.id ? 'active' : ''}" data-action="set-tab" data-tab="${t.id}">
              ${icon(t.icon, 18, state.tab === t.id ? "var(--calories)" : "var(--textMuted)")}
              <span class="nav-label">${t.label}</span>
            </button>
          `).join('')}
        </nav>
      </aside>
      
      <!-- Overlay -->
      <div class="sidebar-overlay ${state.sidebarOpen ? 'open' : ''}" data-action="toggle-sidebar"></div>
      
      <!-- Main Content -->
      <main class="main-content">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">
          <div style="font-size:19px;font-weight:700;letter-spacing:-0.01em">painel nutricional</div>
          <div class="mono" style="font-size:11.5px;color:var(--textFaint);text-transform:capitalize">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
        </div>
        ${state.connectionError ? `<div style="background:var(--error);color:white;padding:12px;border-radius:4px;margin-bottom:12px;font-size:13px">${state.connectionError}</div>` : ''}
        
        ${state.tab === "hoje" ? hojeTabHTML(state) : ""}
        ${state.tab === "historico" ? historicoTabHTML(state) : ""}
        ${state.tab === "alimentos" ? libraryViewHTML(state) : ""}
        ${state.tab === "metas" ? metasTabHTML(state) : ""}
        ${state.tab === "perfil" ? profileViewHTML(state) : ""}
        ${state.tab === "config" ? configViewHTML(state) : ""}
      </main>
    </div>
  `;
}
