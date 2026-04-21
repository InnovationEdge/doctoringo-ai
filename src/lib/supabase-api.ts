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

// Guest mode — in-memory storage + system prompt (same quality as Edge Function)
const guestMessages: Record<string, { role: string; content: string }[]> = {};

const GUEST_SYSTEM_PROMPT = `შენ ხარ **Doctoringo AI** — სამედიცინო ასისტენტი, შექმნილი Doctoringo-ს მიერ.

შენი პიროვნება: გამოცდილი, ჭკვიანი, ემპათიური ოჯახის ექიმი, რომელიც პაციენტს არა როგორც კითხვარი, არამედ როგორც ცოცხალ ადამიანს ესაუბრება.

# ენის სტანდარტი
- ქართულად → ბუნებრივი ქართული, "თქვენ" ფორმა
- English → respond in clear, warm professional English
- Русский → отвечай на естественном русском
- სამედიცინო ტერმინები: პირველ ხმარებაზე ახსენი ("ჰიპერტენზია — არტერიული წნევის მომატება")

აკრძალული ფრაზები:
❌ "დიდი სიამოვნებით გეხმარებით"
❌ "გთხოვთ გაითვალისწინოთ, რომ..."
❌ მუდმივი გაფრთხილებები ყოველ პასუხში
❌ მისალმების გამეორება უკვე დაწყებულ დიალოგში

# KYC: Know Your Patient
ოქროს წესი: არასდროს გასცე რჩევა კონტექსტის გარეშე.
პირველ რეპლიკაში: დააზუსტე ასაკი, სქესი, ხანგრძლივობა.

# კლინიკური აზროვნება
1. Red flags → 🚨 112-ზე დარეკვა + first-aid ნაბიჯები
2. დიფერენციული დიაგნოზი — 2-3 სავარაუდო მიზეზი
3. მართვის გეგმა: რა გააკეთოს, რა არ, როდის ექიმთან

# რა არ უნდა გააკეთო
❌ რეცეპტურ მედიკამენტებზე კონკრეტული დოზირება
✅ OTC მედიკამენტებზე დოზა OK (Paracetamol, Ibuprofen)
❌ საბოლოო დიაგნოზი — "სავარაუდოდ...", "ხშირად მიუთითებს..."
❌ დაუდასტურებელი მეთოდები (ჰომეოპათია, "ბუნებრივი detox")
❌ პასუხისმგებლობის გადატანა მარტივი "ექიმი ნახეთ"-ით

# მიზანი
ეფექტურად დაეხმარო პაციენტს სწორი გადაწყვეტილება მიიღოს.`;

export const chatApi = {
  listSessions: async (): Promise<ChatSession[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return []; // Guest — no saved sessions

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
      // Guest — return local session
      return { id: crypto.randomUUID(), title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) throw new ApiError(500, error);
    return data;
  },

  getSessionHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return []; // Guest — no history

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

  renameSession: async (sessionId: string, title: string) => {
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

  deleteSession: async (sessionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    await supabase.from('chat_sessions').delete().eq('id', sessionId);
    return null;
  },

  deleteAllSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    await supabase.from('chat_sessions').delete().eq('user_id', user.id);
    return null;
  },

  sendMessageStream: async (params: {
    sessionId: string | null;
    message: string;
    model_tier?: ModelTier;
    signal?: AbortSignal;
  }): Promise<Response> => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Logged in → use Edge Function (API key stays server-side)
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
    }

    // Guest mode → call Grok API directly
    const XAI_KEY = import.meta.env.VITE_XAI_API_KEY || '';
    if (!XAI_KEY) throw new ApiError(503, { error: 'AI სერვისი დროებით მიუწვდომელია. გთხოვთ სცადოთ მოგვიანებით.' });

    // Save to local memory
    if (!guestMessages[params.sessionId || '']) guestMessages[params.sessionId || ''] = [];
    const msgs = guestMessages[params.sessionId || ''];
    msgs.push({ role: 'user', content: params.message });

    const apiMessages = [
      { role: 'system' as const, content: GUEST_SYSTEM_PROMPT },
      ...msgs.slice(-20),
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${XAI_KEY}`, 'Content-Type': 'application/json' },
      signal: params.signal,
      body: JSON.stringify({ model: 'grok-4-1-fast-reasoning', messages: apiMessages, stream: true, temperature: 0.3, max_tokens: 3000 }),
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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ session_id: params.sessionId || 'guest' })}\n\n`));
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
          if (fullContent) msgs.push({ role: 'assistant', content: fullContent });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          const errorMsg = streamError instanceof Error ? streamError.message : 'Stream interrupted';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(wrappedStream, { headers: { 'Content-Type': 'text/event-stream' } });
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
  submit: async (_data: { name?: string; email: string; subject?: string; message: string }) => {
    return { success: true };
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Stubs
// ═══════════════════════════════════════════════════════════════════════════
export const documentsApi = {
  listDocuments: async () => [] as any[],
  getDocument: async (_id: string) => null as any,
  generateDocument: async (_params: any) => ({ id: '', file_url: '', title: '', format: '' }) as any,
  fillForm: async (_params: any) => null as any,
  deleteDocument: async (_id: string) => null as any,
  downloadDocument: async (_id: string, _title: string, _format: string) => null as any,
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
