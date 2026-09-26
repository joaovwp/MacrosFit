import { initialState } from './state.js';

// Estado encapsulado em closure
let appState = null;

// Inicializar estado
export function initializeState() {
  appState = { ...initialState };
  return appState;
}

// Obter estado atual (retorna referência direta para permitir mutações)
// Nota: Isso permite mutações diretas, o que é aceitável para o tamanho do projeto
export function getState() {
  if (!appState) {
    appState = { ...initialState };
  }
  return appState;
}

// Atualizar estado (para mutações diretas)
export function setState(newState) {
  appState = newState;
}

// Mostrar notificação
export function showNotification(message, type = 'info') {
  if (!appState) {
    appState = { ...initialState };
  }
  appState.notification = { message, type };
}

// Limpar notificação
export function clearNotification() {
  if (!appState) {
    appState = { ...initialState };
  }
  appState.notification = null;
}
