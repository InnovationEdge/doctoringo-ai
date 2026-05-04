/**
 * Doctoringo AI — Upload Edge Function
 *
 * Accepts multipart/form-data with one file under field name "file" and
 * uploads it to the `chat-uploads` storage bucket under the user's folder.
 * Returns a signed download URL valid for 24 hours.
 *
 * Body:    multipart/form-data { file: File, session_id?: string }
 * Auth:    Bearer <supabase-jwt>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, jsonError, jsonOk } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function safeFilename(name: string): string {
  return name
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .slice(0, 200);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonError(405, 'Method not allowed');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return jsonError(401, 'Missing authorization');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const jwt = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) return jsonError(401, 'Invalid or expired token');

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, 'Expected multipart/form-data');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return jsonError(400, 'file field required');
  if (file.size === 0) return jsonError(400, 'file is empty');
  if (file.size > MAX_BYTES) return jsonError(413, 'file too large (max 10MB)');
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return jsonError(415, `unsupported media type: ${file.type}`);
  }

  const sessionId = form.get('session_id');
  if (sessionId && typeof sessionId === 'string') {
    const { data: owned } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!owned) return jsonError(403, 'Session not owned');
  }

  const path = `${user.id}/${Date.now()}-${safeFilename(file.name)}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from('chat-uploads')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (upErr) {
    console.error('storage upload error', upErr);
    return jsonError(500, 'Upload failed');
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('chat-uploads')
    .createSignedUrl(path, 60 * 60 * 24);
  if (signErr || !signed?.signedUrl) {
    console.error('sign error', signErr);
    return jsonError(500, 'Signing failed');
  }

  return jsonOk({
    success: true,
    file: {
      id: path,
      name: file.name,
      url: signed.signedUrl,
      type: file.type || 'application/octet-stream',
      size: file.size,
    },
  });
});
