import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getCurrentUser } from './auth.js';

export async function getProfile() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoals(goals) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBiometrics(biometrics) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      weight: biometrics.weight,
      height: biometrics.height,
      birth_date: biometrics.birth_date,
      gender: biometrics.gender,
      activity_level: biometrics.activity_level
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSettings(settings) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      track_weight: settings.track_weight,
      track_water: settings.track_water,
      track_workout: settings.track_workout,
      theme: settings.theme,
      language: settings.language
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deactivateAccount() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      deactivated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function hardDeleteAccount() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  // Deactivate profile first
  await deactivateAccount();

  // Note: Full account deletion requires Edge Function with service_role
  // For now, we deactivate and the user can contact support for permanent deletion
  // The CASCADE on user_id will delete all data when the auth user is deleted
}
