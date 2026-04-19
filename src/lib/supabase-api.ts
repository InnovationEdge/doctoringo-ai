/**
 * Doctoringo AI — Supabase API Layer
 *
 * Chat goes through Supabase Edge Function `/chat` (keeps xAI API key server-side).
 * Sessions and messages are persisted in Supabase DB with RLS.
 */
import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any) {
    super(data?.detail || data?.error || data?.message || 'An API error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  is_emergency?: boolean;
  timestamp?: string;
  isUser?: boolean;
}

export type ModelTier = 'fast' | 'reasoning' | 'premium';

// ═══════════════════════════════════════════════════════════════════════════
// Auth API
// ═══════════════════════════════════════════════════════════════════════════
export const authApi = {
  initCsrf: async () => true,

  getCurrentUser: async () => {
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

  loginWithGoogle: async () => {
    localStorage.setItem('postLoginRedirect', window.location.pathname);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
    if (error) throw new ApiError(400, error);
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('doctoringo_user');
    localStorage.removeItem('postLoginRedirect');
  },

  updateProfile: async (data: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, { message: 'Not authenticated' });

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new ApiError(400, error);
    return updated;
  },

  logoutAllDevices: async () => {
    await supabase.auth.signOut({ scope: 'global' });
  },

  exportUserData: async () => {
    const user = await authApi.getCurrentUser();
    if (!user) return null;

    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('*, chat_messages(*)')
      .order('created_at', { ascending: false });

    return { user, sessions };
  },

  deleteAccount: async (_confirmation?: string) => {
    await supabase.auth.signOut();
  },

  getActiveSessions: async () => [],
};

// ═══════════════════════════════════════════════════════════════════════════
// Chat API
// ═══════════════════════════════════════════════════════════════════════════
const EDGE_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const chatApi = {
  listSessions: async (): Promise<ChatSession[]> => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw new ApiError(500, error);
    return data || [];
  },

  createSession: async (title: string = 'New Chat'): Promise<ChatSession> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, { message: 'Not authenticated' });

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) throw new ApiError(500, error);
    return data;
  },

  getSessionHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, session_id, role, content, created_at, is_emergency')
      .eq('session_id', sessionId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });

    if (error) throw new ApiError(500, error);

    return (data || []).map((m) => ({
      id: m.id,
      session_id: m.session_id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at,
      is_emergency: m.is_emergency,
      timestamp: m.created_at,
      isUser: m.role === 'user',
    }));
  },

  renameSession: async (sessionId: string, title: string) => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new ApiError(500, error);
    return data;
  },

  deleteSession: async (sessionId: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw new ApiError(500, error);
    return null;
  },

  deleteAllSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, { message: 'Not authenticated' });

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id);

    if (error) throw new ApiError(500, error);
    return null;
  },

  sendMessageStream: async (params: {
    sessionId: string | null;
    message: string;
    model_tier?: ModelTier;
    signal?: AbortSignal;
  }): Promise<Response> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, { message: 'Not authenticated' });

    const response = await fetch(EDGE_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      signal: params.signal,
      body: JSON.stringify({
        session_id: params.sessionId,
        message: params.message,
        model_tier: params.model_tier || 'reasoning',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, err);
    }

    return response;
  },

  sendMessage: async (params: {
    message: string;
    sessionId?: string | null;
    model_tier?: ModelTier;
  }): Promise<{ content: string; session_id: string; emergency: boolean }> => {
    const response = await chatApi.sendMessageStream({
      sessionId: params.sessionId ?? null,
      message: params.message,
      model_tier: params.model_tier,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let sessionId = '';
    let emergency = false;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) fullContent += parsed.content;
          if (parsed.session_id) sessionId = parsed.session_id;
          if (parsed.emergency) emergency = true;
        } catch { /* skip */ }
      }
    }

    return { content: fullContent, session_id: sessionId, emergency };
  },

  shareSession: async (_sessionId: string) => ({ share_token: '', url: '' }),
  revokeShare: async (_sessionId: string) => null,
};

// ═══════════════════════════════════════════════════════════════════════════
// Payment / Quota API
// ═══════════════════════════════════════════════════════════════════════════
export const paymentApi = {
  getSubscriptionStatus: async () => ({
    status: 'free',
    is_paid: false,
    is_active: true,
  }),

  getModelQuota: async () => ({
    remaining: 999,
    total: 999,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════
// Contact API
// ═══════════════════════════════════════════════════════════════════════════
export const contactApi = {
  submit: async (data: { name?: string; email: string; subject?: string; message: string }) => {
    console.log('Contact form submitted:', data);
    return { success: true };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Stubs
// ═══════════════════════════════════════════════════════════════════════════
export const documentsApi = {
  listDocuments: async () => [],
  getDocument: async (_id: string) => null,
  generateDocument: async (_params: any) => null,
  fillForm: async (_params: any) => null,
  deleteDocument: async (_id: string) => null,
  downloadDocument: async (_id: string, _title: string, _format: string) => null,
};

export interface Country {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  source_name: string;
  source_url: string;
  default_language: string;
  document_count: number;
  is_active: boolean;
}

export interface CountriesResponse {
  success: boolean;
  countries: Country[];
  default: string;
}

export const countriesApi = {
  getCountries: async (): Promise<CountriesResponse> => ({
    success: true,
    countries: [{ code: 'GE', name: 'Georgia', native_name: 'საქართველო', flag_emoji: '🇬🇪', source_name: '', source_url: '', default_language: 'ka', document_count: 0, is_active: true }],
    default: 'GE',
  }),
};

export const searchApi = {
  search: async (_query: string) => ({ results: [] }),
};

export const publicSearchApi = {
  search: async (_query: string) => ({ results: [] }),
};

export function getCountryCode(jurisdiction?: string | null): string {
  return jurisdiction || 'GE';
}
