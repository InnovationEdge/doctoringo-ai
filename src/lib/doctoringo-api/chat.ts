/**
 * Doctoringo AI — Chat API
 *
 * Guest mode: calls Grok API directly from browser
 * Logged-in: calls Supabase Edge Function (API key server-side)
 */
import { supabase } from '../supabase';
import { ApiError, ChatSession, ChatMessage, ModelTier } from './types';
import { getSystemPrompt } from './prompts';

const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const EDGE_CHAT_URL = `${SUPABASE_BASE_URL}/functions/v1/chat`;
const EDGE_SEARCH_URL = `${SUPABASE_BASE_URL}/functions/v1/search`;
const EDGE_SHARE_URL = `${SUPABASE_BASE_URL}/functions/v1/share`;
const EDGE_UPLOAD_URL = `${SUPABASE_BASE_URL}/functions/v1/upload`;

async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiError(401, { error: 'Sign in required' });
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

// Guest mode — in-memory conversation storage
const guestMessages: Record<string, { role: string; content: string }[]> = {};

export const chatApi = {
  listSessions: async (): Promise<ChatSession[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  createSession: async (title: string = 'New Chat'): Promise<ChatSession> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        id: crypto.randomUUID(),
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) throw new ApiError(500, { error: error.message });
    return data;
  },

  getSessionHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, session_id, role, content, created_at, is_emergency')
      .eq('session_id', sessionId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });

    if (error) return [];

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

  renameSession: async (sessionId: string, title: string): Promise<ChatSession> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: sessionId, title, created_at: '', updated_at: '' };

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) return { id: sessionId, title, created_at: '', updated_at: '' };
    return data;
  },

  deleteSession: async (sessionId: string): Promise<null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    await supabase.from('chat_sessions').delete().eq('id', sessionId);
    return null;
  },

  deleteAllSessions: async (): Promise<null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    await supabase.from('chat_sessions').delete().eq('user_id', user.id);
    return null;
  },

  sendMessageStream: async (params: {
    sessionId: string | null;
    message: string;
    model_tier?: ModelTier;
    mode?: string;
    country_code?: string;
    signal?: AbortSignal;
  }): Promise<Response> => {
    const { data: { session } } = await supabase.auth.getSession();

    // Logged in → Edge Function
    if (session) {
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
          mode: params.mode || 'chat',
          country_code: params.country_code,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(response.status, err);
      }
      return response;
    }

    // Guest mode → Grok API directly
    return streamGuestChat(params);
  },

  sendMessage: async (params: {
    message: string;
    sessionId?: string | null;
    model_tier?: ModelTier;
    country_code?: string;
    mode?: string;
  }): Promise<{ content: string; session_id: string; emergency: boolean }> => {
    const response = await chatApi.sendMessageStream({
      sessionId: params.sessionId ?? null,
      message: params.message,
      model_tier: params.model_tier,
      mode: params.mode,
      country_code: params.country_code,
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

  shareSession: async (
    sessionId: string,
  ): Promise<{ success: boolean; share_token?: string; share_url?: string; error?: string }> => {
    try {
      const res = await authedFetch(EDGE_SHARE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', session_id: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data?.error || 'Share failed' };
      return data;
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Share failed' };
    }
  },

  revokeShare: async (sessionId: string): Promise<null> => {
    try {
      await authedFetch(EDGE_SHARE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', session_id: sessionId }),
      });
    } catch { /* ignore */ }
    return null;
  },

  getSharedSession: async (
    shareToken: string,
  ): Promise<{
    success: boolean;
    id: string;
    title: string;
    created_at: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      created_at: string;
    }>;
    session?: ChatSession;
    error?: string;
  }> => {
    const empty = {
      success: false,
      id: '',
      title: '',
      created_at: '',
      messages: [] as Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>,
    };
    if (!SUPABASE_BASE_URL) return { ...empty, error: 'Backend not configured' };
    try {
      const res = await fetch(
        `${EDGE_SHARE_URL}?token=${encodeURIComponent(shareToken)}`,
        { method: 'GET' },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ...empty, error: data?.error || 'Not found' };
      return data;
    } catch (e) {
      return { ...empty, error: e instanceof Error ? e.message : 'Network error' };
    }
  },

  uploadFile: async (
    file: File,
    sessionId?: string,
  ): Promise<{
    success: boolean;
    file?: { id: string; name: string; url: string; type: string; size: number };
    error?: string;
  }> => {
    try {
      const form = new FormData();
      form.append('file', file);
      if (sessionId) form.append('session_id', sessionId);
      const res = await authedFetch(EDGE_UPLOAD_URL, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data?.error || 'Upload failed' };
      return data;
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Upload failed' };
    }
  },

  searchChats: async (
    query: string,
  ): Promise<{ results: Array<{ id: string; title: string; snippet?: string }>; error?: string }> => {
    try {
      const res = await authedFetch(EDGE_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { results: [], error: data?.error || 'Search failed' };
      return data;
    } catch (e) {
      return { results: [], error: e instanceof Error ? e.message : 'Search failed' };
    }
  },

  getUsageStats: async (): Promise<{
    success: boolean;
    usage?: {
      messages_sent: number;
      sessions_created: number;
      tokens_used: number;
    };
    error?: string;
  }> => ({
    success: false,
    error: 'Usage stats not yet enabled.',
  }),

  getAnalytics: async (
    _days: number,
  ): Promise<{
    success: boolean;
    analytics?: {
      messages_per_day: Array<{ date: string; count: number }>;
      top_topics: Array<{ topic: string; count: number }>;
    };
    error?: string;
  }> => ({
    success: false,
    error: 'Analytics not yet enabled.',
  }),
};

// ─── Guest Chat Helper ───────────────────────────────────────────────────────

async function streamGuestChat(params: {
  sessionId: string | null;
  message: string;
  model_tier?: ModelTier;
  mode?: string;
  signal?: AbortSignal;
}): Promise<Response> {
  const XAI_KEY = import.meta.env.VITE_XAI_API_KEY || '';
  if (!XAI_KEY) {
    throw new ApiError(503, { error: 'AI სერვისი დროებით მიუწვდომელია.' });
  }

  const sessionKey = params.sessionId || '';
  if (!guestMessages[sessionKey]) guestMessages[sessionKey] = [];
  const msgs = guestMessages[sessionKey];
  msgs.push({ role: 'user', content: params.message });

  const apiMessages = [
    { role: 'system' as const, content: getSystemPrompt(params.mode) },
    ...msgs.slice(-20),
  ];

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: params.signal,
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages: apiMessages,
      stream: true,
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new ApiError(response.status, { error: err || 'AI service error' });
  }

  // Wrap stream to collect assistant message
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let fullContent = '';

  const wrappedStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ session_id: params.sessionId || 'guest' })}\n\n`)
      );

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
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch { /* skip unparseable chunks */ }
          }
        }

        if (fullContent) msgs.push({ role: 'assistant', content: fullContent });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (streamError) {
        const errorMsg = streamError instanceof Error ? streamError.message : 'Stream interrupted';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(wrappedStream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
