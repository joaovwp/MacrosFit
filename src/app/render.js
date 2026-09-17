import { appHTML } from './appShell.js';

let renderTimeout = null;
let isTextInputActive = false;

export function scheduleRender(state) {
  if (renderTimeout) return;
  renderTimeout = requestAnimationFrame(() => {
    renderTimeout = null;
    render(state);
  });
}

export function render(state) {
  if (isTextInputActive) return;
  
  const root = document.getElementById("root");
  const active = document.activeElement;
  const activeId = active && active.id;
  const selStart = active && "selectionStart" in active ? active.selectionStart : null;
  const selEnd = active && "selectionEnd" in active ? active.selectionEnd : null;
  const action = active && active.dataset.action;
  
  root.innerHTML = appHTML(state);
  
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      if (selStart != null && el.setSelectionRange) {
        try { el.setSelectionRange(selStart, selEnd); } catch (e) {}
      }
    }
  }
}

export function setTextInputActive(value) {
  isTextInputActive = value;
}
