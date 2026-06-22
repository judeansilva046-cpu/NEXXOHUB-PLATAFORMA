import { supabase } from './client';

export const authClient = {
  signUp: async (email: string, password: string, userData?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error };
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user, error };
  },

  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
