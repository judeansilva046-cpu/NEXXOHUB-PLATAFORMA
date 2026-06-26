'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnvironment } from '../env';

const { supabaseUrl, supabaseAnonKey, appUrl } = getPublicEnvironment();

// ✅ CORRIGIDO: Usar createBrowserClient que gerencia cookies automaticamente
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const signUp = async (input: {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  organizationCnpj: string;
}) => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('nexxohub.pendingEmail', input.email);
  }
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        full_name: input.fullName,
        organization_name: input.organizationName,
        organization_cnpj: input.organizationCnpj,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
};

// Export authClient as a convenience wrapper
// ============================================================================
// OAUTH PROVIDERS - Google, GitHub, etc.
// ============================================================================

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
};

export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${appUrl}/auth/callback`,
    },
  });
  return { data, error };
};

// ============================================================================
// PHONE AUTH - SMS/WhatsApp via Twilio
// ============================================================================

export const signInWithPhone = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'sms',
    },
  });
  return { data, error };
};

export const verifyPhoneOtp = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { data, error };
};

// ============================================================================
// MAGIC LINK - Email sem senha
// ============================================================================

export const signInWithMagicLink = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });
  return { data, error };
};

// Export authClient as a convenience wrapper
export const authClient = {
  signIn,
  signOut,
  signUp,
  signInWithGoogle,
  signInWithGitHub,
  signInWithPhone,
  verifyPhoneOtp,
  signInWithMagicLink,
  resetPassword,
  updatePassword,
  getCurrentUser,
  getSession,
};
