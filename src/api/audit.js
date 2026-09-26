import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function logAction(action, details = {}) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.rpc('log_audit', { p_action: action, p_details: details });
  } catch (e) {
    console.warn('[audit]', action, e);
  }
}
