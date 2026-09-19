import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getDailyLog(date) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function getDailyLogs(startDate, endDate) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function upsertDailyLog(log) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert({
      id: log.id,
      user_id: log.user_id,
      date: log.date,
      weight: log.weight,
      water: log.water || 0,
      workout_done: log.workout_done || false,
      workout_note: log.workout_note,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDailyLog(date, updates) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('date', date)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDailyLog(date) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('daily_logs')
    .delete()
    .eq('date', date);

  if (error) throw error;
}
