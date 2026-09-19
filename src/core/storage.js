import { STORAGE_KEYS, DEFAULT_PROFILE } from './constants.js';

export async function loadAll() {
  const out = { profile: DEFAULT_PROFILE, library: {}, diary: {} };
  try {
    const p = localStorage.getItem(STORAGE_KEYS.profile);
    if (p) {
      const parsed = JSON.parse(p);
      // Migrar dados antigos: age -> birthDate
      if (parsed.biometrics && parsed.biometrics.age && !parsed.biometrics.birthDate) {
        const age = parsed.biometrics.age;
        const birthYear = new Date().getFullYear() - age;
        parsed.biometrics.birthDate = `${birthYear}-01-01`;
        delete parsed.biometrics.age;
      }
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

export async function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Falha ao salvar", key, e); }
}
