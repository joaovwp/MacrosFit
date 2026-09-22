const SCHEMA_VERSION = '2';
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutos
const STORAGE_KEY = 'ft-ui-state';

// Allowlist de chaves que podem ser salvas
const ALLOWLIST = [
  'tab',
  'viewMonth',
  'selectedKey',
  'expandedMeals',
  'qa.name',
  'qa.grams',
  'qa.mealType',
  'lib.query'
];

// Chaves que NUNCA devem ser salvas (dados sensíveis)
const BLOCKLIST = [
  'auth.password',
  'auth.email',
  'importExport.importData',
  'importExport.mealImportData'
];

/**
 * Extrai apenas as chaves permitidas do estado
 */
function extractAllowedState(state) {
  const extracted = {};
  
  for (const key of ALLOWLIST) {
    const keys = key.split('.');
    let value = state;
    let valid = true;
    
    for (const k of keys) {
      if (value == null || typeof value !== 'object') {
        valid = false;
        break;
      }
      value = value[k];
    }
    
    if (valid && value !== undefined) {
      // Define valor aninhado no objeto extraído
      let target = extracted;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
    }
  }
  
  return extracted;
}

/**
 * Salva estado UI no localStorage
 */
export function saveUIState(state) {
  try {
    const allowed = extractAllowedState(state);

    // Serializar viewMonth como ISO string
    if (allowed.viewMonth instanceof Date) {
      allowed.viewMonth = allowed.viewMonth.toISOString();
    }

    const data = {
      schemaVersion: SCHEMA_VERSION,
      timestamp: Date.now(),
      state: allowed
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving UI state:', e);
  }
}

/**
 * Restaura estado UI do localStorage
 */
export function restoreUIState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);

    // Validar schema version
    if (data.schemaVersion !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Validar expiração
    if (Date.now() - data.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Converter viewMonth de volta para Date
    const state = data.state;
    if (state.viewMonth && typeof state.viewMonth === 'string') {
      state.viewMonth = new Date(state.viewMonth);
    }

    return state;
  } catch (e) {
    console.error('Error restoring UI state:', e);
    return null;
  }
}

/**
 * Limpa estado UI do localStorage
 */
export function clearUIState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing UI state:', e);
  }
}

/**
 * Debounce para salvar estado UI
 */
let saveTimeout = null;
export function debouncedSaveUIState(state, delay = 1000) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveUIState(state);
  }, delay);
}
