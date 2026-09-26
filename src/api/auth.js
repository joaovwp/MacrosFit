import { supabase, isSupabaseConfigured } from '../supabase/client.js';
import { logAction } from './audit.js';

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

  await logAction('signup');

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

  await logAction('login');
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

  await logAction('password_change');
}

export async function updateEmail(newEmail) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) throw error;

  await logAction('email_change', { new_email: newEmail });
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    // AuthSessionMissingError means no session (expected when not logged in)
    if (error.name === 'AuthSessionMissingError') return null;

    // 401/403 means session is invalid/expired
    if (error.status === 401 || error.status === 403) {
      // Sign out local only (session already invalid on server)
      await supabase.auth.signOut({ scope: 'local' });
      return null;
    }

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
