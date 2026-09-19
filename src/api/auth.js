import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function signUp(email, password, displayName) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: window.location.origin
    }
  });

  if (error) throw error;

  // Check if email confirmation is required
  if (!data.session && data.user) {
    return { user: data.user, requiresConfirmation: true };
  }

  return data;
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`
  });

  if (error) throw error;
}

export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}

export async function updateEmail(newEmail) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) throw error;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    // AuthSessionMissingError means no session (expected when not logged in)
    // 403 means session is invalid (expected after deletion/logout)
    if (error.name === 'AuthSessionMissingError' || error.status === 403) return null;
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

export async function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => subscription.unsubscribe();
}
