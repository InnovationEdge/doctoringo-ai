/**
 * Doctoringo AI — Share Edge Function
 *
 * Two operations on the same path:
 *   POST { action: 'create',  session_id }    → owner-only, mints share_token
 *   POST { action: 'revoke',  session_id }    → owner-only, clears share_token
 *   GET  ?token=<share_token>                 → public, returns session + msgs
 *
 * Public read is allowed because the existing RLS policy already exposes
 * sessions where is_shared = true.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, jsonError, jsonOk } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

function publicShareUrl(token: string): string {
  const base = Deno.env.get('PUBLIC_SITE_URL') || 'https://doctoringo.com';
  return `${base}/share/${token}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── Public read ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) return jsonError(400, 'token query param required');

    const { data: session, error: sErr } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, share_token, is_shared')
      .eq('share_token', token)
      .eq('is_shared', true)
      .maybeSingle();

    if (sErr) return jsonError(500, 'Lookup failed');
    if (!session) return jsonError(404, 'Shared session not found');

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('session_id', session.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true });

    return jsonOk({
      success: true,
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      messages: messages || [],
    });
  }

  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');

  // ── Owner ops (create / revoke) ──────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return jsonError(401, 'Missing authorization');

  const jwt = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) return jsonError(401, 'Invalid or expired token');

  let body: { action?: string; session_id?: string };
  try { body = await req.json(); } catch { return jsonError(400, 'Invalid JSON body'); }

  const sessionId = body.session_id;
  if (!sessionId || typeof sessionId !== 'string') return jsonError(400, 'session_id required');

  // Verify ownership.
  const { data: owned } = await supabase
    .from('chat_sessions')
    .select('id, share_token, is_shared')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!owned) return jsonError(404, 'Session not found');

  if (body.action === 'revoke') {
    const { error: uErr } = await supabase
      .from('chat_sessions')
      .update({ share_token: null, is_shared: false })
      .eq('id', sessionId);
    if (uErr) return jsonError(500, 'Failed to revoke');
    return jsonOk({ success: true });
  }

  // Default action: create (or return existing).
  let token = owned.share_token;
  if (!token || !owned.is_shared) {
    token = crypto.randomUUID();
    const { error: uErr } = await supabase
      .from('chat_sessions')
      .update({ share_token: token, is_shared: true })
      .eq('id', sessionId);
    if (uErr) return jsonError(500, 'Failed to create share link');
  }

  return jsonOk({
    success: true,
    share_token: token,
    share_url: publicShareUrl(token),
  });
});
