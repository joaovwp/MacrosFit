import { render } from '../app/render.js';

// Estado global (será setado pelo app.js)
let state = null;

export function setState(newState) {
  state = newState;
}

export function getState() {
  return state;
}

/**
 * Aplica patch ao estado e decide tipo de renderização
 * @param {Object} patch - Objeto com as mudanças (ex: { tab: 'historico' })
 * @param {Object} options - Opções de renderização
 * @param {string} options.render - 'full' | 'partial' | 'none'
 */
export function update(patch, options = { render: 'full' }) {
  if (!state) {
    console.error('State not initialized. Call setState() first.');
    return;
  }

  // Aplica patch ao estado (merge shallow)
  Object.assign(state, patch);

  // Decide tipo de renderização
  if (options.render === 'none') {
    return; // Não renderiza
  }

  if (options.render === 'partial') {
    // Renderização parcial - atualiza apenas nós derivados
    // Por enquanto, usa render full (implementação futura pode otimizar)
    render(state);
    return;
  }

  // Renderização completa (padrão)
  render(state);
}
