import { STORAGE_KEYS, DEFAULT_PROFILE } from './constants.js';

export function loadAll() {
  const out = { profile: DEFAULT_PROFILE, library: {}, diary: {} };
  try { 
    const p = localStorage.getItem(STORAGE_KEYS.profile); 
    if (p) {
      const parsed = JSON.parse(p);
      out.profile = { 
        ...DEFAULT_PROFILE, 
        ...parsed,
        biometrics: { ...DEFAULT_PROFILE.biometrics, ...parsed.biometrics },
        settings: { ...DEFAULT_PROFILE.settings, ...parsed.settings }
      }; 
    } 
  } catch (e) {}
  try { const l = localStorage.getItem(STORAGE_KEYS.library); if (l) out.library = JSON.parse(l); } catch (e) {}
  try { const d = localStorage.getItem(STORAGE_KEYS.diary); if (d) out.diary = JSON.parse(d); } catch (e) {}
  return out;
}

export function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Falha ao salvar", key, e); }
}
