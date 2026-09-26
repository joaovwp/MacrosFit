import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { getCurrentUser } from './auth.js';
import { mapProfileFromDB } from '../utils/mapper.js';

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

  // Perfil ausente: criar novo
  if (!data) {
    const display_name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuário';
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return mapProfileFromDB(newProfile);
  }

  // Se perfil existe mas não tem display_name, atualizar com email
  if (!data.display_name && user.email) {
    const display_name = user.email.split('@')[0];
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ display_name })
      .eq('id', user.id)
      .select()
      .single();

    if (!updateError) {
      return mapProfileFromDB(updatedProfile);
    }
  }

  return mapProfileFromDB(data);
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
      calorie_goal: goals.calories,
      protein_goal_g: goals.protein,
      carbs_goal_g: goals.carbs,
      fat_goal_g: goals.fat
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
      weight_kg: biometrics.weight,
      height_cm: biometrics.height,
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
