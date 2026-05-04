/**
 * Doctoringo AI — Auth API (Supabase Auth)
 */
import { supabase } from '../supabase';
import { ApiError, UserProfile } from './types';

export const authApi = {
  initCsrf: async (): Promise<boolean> => true,

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email,
      first_name: profile?.first_name || user.user_metadata?.full_name || '',
      last_name: profile?.last_name || '',
      language: profile?.language || 'EN',
      preferences: profile?.preferences || '',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
    };
  },

  loginWithGoogle: async (): Promise<void> => {
    localStorage.setItem('postLoginRedirect', window.location.pathname);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
    if (error) throw new ApiError(400, { error: error.message });
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    localStorage.removeItem('doctoringo_user');
    localStorage.removeItem('postLoginRedirect');
  },

  updateProfile: async (data: Record<string, string | string[]>): Promise<Record<string, unknown>> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, { message: 'Not authenticated' });

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new ApiError(400, { error: error.message });
    return updated;
  },

  logoutAllDevices: async (): Promise<void> => {
    await supabase.auth.signOut({ scope: 'global' });
  },

  exportUserData: async (): Promise<Record<string, unknown> | null> => {
    const user = await authApi.getCurrentUser();
    if (!user) return null;

    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('*, chat_messages(*)')
      .order('created_at', { ascending: false });

    return { user, sessions };
  },

  deleteAccount: async (_confirmation?: string): Promise<void> => {
    await supabase.auth.signOut();
  },

  getActiveSessions: async (): Promise<{
    sessions: Array<{
      id: string;
      device?: string;
      location?: string;
      last_active?: string;
      current?: boolean;
    }>;
  }> => ({
    sessions: [],
  }),
};
