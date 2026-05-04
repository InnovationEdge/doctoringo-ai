/**
 * Doctoringo AI — Search Edge Function
 *
 * Returns chat sessions of the authenticated user that match a query
 * via trigram similarity over title + message content.
 *
 * Body: { query: string }
 * Auth: Bearer <supabase-jwt>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, jsonError, jsonOk } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return jsonError(401, 'Missing authorization');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return jsonError(401, 'Invalid or expired token');

  let body: { query?: unknown };
  try { body = await req.json(); } catch { return jsonError(400, 'Invalid JSON body'); }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (query.length < 2) return jsonOk({ results: [] });
  if (query.length > 200) return jsonError(400, 'Query too long');

  // Use a per-request client signed in as the user so the SECURITY DEFINER
  // function still has auth.uid() set correctly.
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient.rpc('search_chat_sessions', { q: query });
  if (error) {
    console.error('search rpc error', error);
    return jsonError(500, 'Search failed');
  }

  return jsonOk({
    results: (data || []).map((row: {
      id: string;
      title: string;
      snippet: string | null;
      updated_at: string;
      score: number;
    }) => ({
      id: row.id,
      title: row.title,
      snippet: row.snippet || '',
      updated_at: row.updated_at,
      score: row.score,
      type: 'chat',
    })),
  });
});
