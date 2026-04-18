/**
 * Doctoringo AI — Supabase API Layer
 * Drop-in replacement for Django api.ts, backed by Supabase
 */
import { supabase, edgeFunctionUrl } from './supabase';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any) {
    super(data.detail || data.error || data.message || 'An API error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Authentication API (Supabase Auth)
 */
export const authApi = {
  initCsrf: async () => {
    // Not needed with Supabase — no-op
    return true;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Get profile (may not exist yet for new users)
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
      options: {
        redirectTo: window.location.origin + '/app',
      },
    });
    if (error) console.error('Google login error:', error);
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

  exportUserData: async () => {
    const user = await authApi.getCurrentUser();
    return user;
  },

  deleteAccount: async (_confirmation: string) => {
    // Would need service_role for actual deletion
    await supabase.auth.signOut();
  },

  logoutAllDevices: async () => {
    await supabase.auth.signOut({ scope: 'global' });
  },

  getActiveSessions: async () => [],
};

/**
 * Chat API (Supabase DB + Edge Functions)
 */
// In-memory chat storage (no auth needed)
const localSessions: { id: string; title: string; created_at: string; updated_at: string }[] = [];
const localMessages: Record<string, { id: string; role: string; content: string; created_at: string }[]> = {};

const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || '';
const EDGE_FUNCTION_URL = edgeFunctionUrl('chat');

// Medical system prompt
const SYSTEM_PROMPT = `You are Doctoringo AI — a knowledgeable, empathetic medical health assistant created by Doctoringo.

CORE BEHAVIOR:
- Answer medical questions directly, thoroughly, and confidently
- Provide specific, actionable health advice based on current medical knowledge
- Explain conditions, symptoms, medications, treatments in detail
- Give nutritional plans, mental health guidance, exercise recommendations
- You CAN and SHOULD give medical information freely — this is your purpose

CONVERSATION STYLE:
- Be warm but professional, like a trusted family doctor
- Do NOT repeat greetings — if the user already said hello, get straight to the point
- Do NOT say "I don't have the right to..." or "I can't provide medical advice" — you absolutely can and should
- Do NOT add excessive disclaimers to every response
- Keep responses focused and useful, not padded with warnings

WHEN TO RECOMMEND A DOCTOR:
- ONLY when the situation involves: emergency symptoms (chest pain, difficulty breathing, severe bleeding), need for physical examination, prescription medications, surgical decisions, or ongoing serious conditions
- Frame it naturally: "ამ შემთხვევაში ექიმთან ვიზიტი მნიშვნელოვანია" — not as a disclaimer but as genuine medical guidance

LANGUAGE:
- Respond in the SAME language the user writes in (Georgian, English, or Russian)
- Use medical terminology but explain it simply
- Be concise — no filler text`;

export const chatApi = {
  createSession: async (title: string = 'New Chat') => {
    const session = {
      id: crypto.randomUUID(),
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localSessions.unshift(session);
    localMessages[session.id] = [];
    return session;
  },

  listSessions: async () => localSessions,

  getSessionHistory: async (sessionId: string) => {
    return (localMessages[sessionId] || []).map((m) => ({
      ...m,
      timestamp: m.created_at,
      isUser: m.role === 'user',
    }));
  },

  renameSession: async (sessionId: string, title: string) => {
    const s = localSessions.find((s) => s.id === sessionId);
    if (s) s.title = title;
    return s;
  },

  deleteSession: async (sessionId: string) => {
    const idx = localSessions.findIndex((s) => s.id === sessionId);
    if (idx >= 0) localSessions.splice(idx, 1);
    delete localMessages[sessionId];
    return null;
  },

  deleteAllSessions: async () => {
    localSessions.length = 0;
    Object.keys(localMessages).forEach((k) => delete localMessages[k]);
    return null;
  },

  // SSE streaming via Edge Function (uses service role, no user auth needed)
  sendMessageStream: async (params: {
    sessionId: string | null;
    message: string;
    model_tier: string;
    signal?: AbortSignal;
  }) => {
    // Save user message locally
    let sessionId = params.sessionId;
    if (!sessionId) {
      const session = await chatApi.createSession(params.message.slice(0, 50));
      sessionId = session.id;
    }
    if (!localMessages[sessionId]) localMessages[sessionId] = [];
    localMessages[sessionId].push({
      id: crypto.randomUUID(),
      role: 'user',
      content: params.message,
      created_at: new Date().toISOString(),
    });

    // Build conversation history
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(localMessages[sessionId] || []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Call xAI/Grok API directly
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: params.signal,
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages,
        stream: true,
        temperature: 0.3,
        reasoning_effort: 'medium',
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new ApiError(response.status, { error: err || 'AI service error' });
    }

    // Wrap response to also save assistant message when done
    const originalBody = response.body!;
    const reader = originalBody.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullContent = '';

    const wrappedStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`: connected\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ session_id: sessionId })}\n\n`));

        let buffer = '';
        try {
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
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }

          // Save assistant message
          if (sessionId && fullContent) {
            if (!localMessages[sessionId]) localMessages[sessionId] = [];
            localMessages[sessionId].push({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: fullContent,
              created_at: new Date().toISOString(),
            });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(wrappedStream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  },

  sendMessage: async (params: {
    message: string;
    model_tier?: string;
  }): Promise<{ content: string }> => {
    const response = await chatApi.sendMessageStream({
      sessionId: null,
      message: params.message,
      model_tier: params.model_tier || 'standard',
    });

    if (!response?.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) fullContent += data.content;
          } catch { /* skip */ }
        }
      }
    }
    return { content: fullContent };
  },

  shareSession: async (_sessionId: string) => ({ share_token: '', url: '' }),
  revokeShare: async (_sessionId: string) => null,
};

/**
 * Payment API (stubs — free for now)
 */
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

/**
 * Contact API
 */
export const contactApi = {
  submit: async (data: { name?: string; email: string; subject?: string; message: string }) => {
    // Could be an Edge Function later
    console.log('Contact form submitted:', data);
    return { success: true };
  },
};

/**
 * Documents API (stub)
 */
export const documentsApi = {
  listDocuments: async () => [],
  getDocument: async (_id: string) => null,
  generateDocument: async (_params: any) => null,
  fillForm: async (_params: any) => null,
  deleteDocument: async (_id: string) => null,
  downloadDocument: async (_id: string, _title: string, _format: string) => null,
};

/**
 * Countries API (stub)
 */
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

/**
 * Search API (stub)
 */
export const searchApi = {
  search: async (_query: string) => ({ results: [] }),
};

/**
 * Public Search API (stub)
 */
export const publicSearchApi = {
  search: async (_query: string) => ({ results: [] }),
};

// Re-export helper
export function getCountryCode(jurisdiction?: string | null): string {
  return jurisdiction || 'GE';
}
