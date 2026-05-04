/**
 * Doctoringo AI — Chat Edge Function
 *
 * Responsibilities:
 *  1. Verify Supabase JWT (user auth)
 *  2. Rate-limit per user (daily quota)
 *  3. Persist chat history to Supabase DB
 *  4. Detect medical emergencies (red flags)
 *  5. Proxy to xAI Grok API (key stays server-side)
 *  6. Stream response back to client (SSE)
 *  7. Log token usage + cost
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Config ──────────────────────────────────────────────────────────────────
const XAI_API_KEY = Deno.env.get('XAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

const DAILY_LIMIT_FREE = 50;
const DAILY_LIMIT_PAID = 500;
const HISTORY_TURNS = 20;

// ─── Pricing (per 1M tokens) ─────────────────────────────────────────────────
const PRICING: Record<string, { input: number; output: number }> = {
  'grok-4-1-fast-non-reasoning': { input: 0.20, output: 0.50 },
  'grok-4-1-fast-reasoning': { input: 0.20, output: 0.50 },
  'grok-4': { input: 3.00, output: 15.00 },
};

// ─── Model tier routing ──────────────────────────────────────────────────────
function chooseModel(tier: string): string {
  switch (tier) {
    case 'fast': return 'grok-4-1-fast-non-reasoning';
    case 'premium': return 'grok-4';
    case 'reasoning':
    default: return 'grok-4-1-fast-reasoning';
  }
}

// ─── Emergency detection (EN + KA + RU) ──────────────────────────────────────
const EMERGENCY_PATTERNS: RegExp[] = [
  /\b(suicid|kill\s+myself|end\s+my\s+life)\b/i,
  /(თავის\s*მოკვლ|თავი\s*მოვიკლა|თვითმკვლელობ)/i,
  /(самоубий|покончить\s+с\s+собой|убить\s+себя)/i,
  /\b(heart\s+attack|cardiac\s+arrest|chest\s+pain.{0,20}(severe|crushing|radiat))/i,
  /(ინფარქტ|გულის\s*შეტევ|ძლიერი\s*ტკივილი.{0,20}გულმკერდ)/i,
  /(инфаркт|сильная\s+боль\s+в\s+груди)/i,
  /\b(stroke|facial\s+droop|sudden.{0,15}(numbness|weakness))/i,
  /(ინსულტ|სახის\s*დამრეცებ|უცებ\s*დაუსუსტდ)/i,
  /(инсульт|перекос\s+лица)/i,
  /(can'?t\s+breathe|severe\s+shortness\s+of\s+breath|anaphyla)/i,
  /(ვერ\s*ვსუნთქავ|სუნთქვა\s*გამიძნელდ|ანაფილაქს)/i,
  /(не\s+могу\s+дышать|анафилакс)/i,
  /(uncontrolled\s+bleeding|unconscious|won'?t\s+wake\s+up|seizure)/i,
  /(მძიმე\s*სისხლდენ|ცნობიერების\s*დაკარგვ|კრუნჩხვ)/i,
];

function detectEmergency(message: string): boolean {
  return EMERGENCY_PATTERNS.some((p) => p.test(message));
}

// ─── System prompts ──────────────────────────────────────────────────────────
// IMPORTANT: keep these in sync with frontend/src/lib/doctoringo-api/prompts.ts.
// The Edge Function and the guest-mode client must use identical persona so
// the experience does not change based on auth state.

const MEDICAL_SYSTEM_PROMPT = `შენ ხარ **Doctoringo AI** — სამედიცინო ასისტენტი, შექმნილი Doctoringo-ს მიერ.

ROLE: გამოცდილი, ემპათიური ოჯახის ექიმი. პაციენტს ესაუბრები როგორც ცოცხალ ადამიანს, არა კითხვარს.

# ენის სტანდარტი (აუცილებელი)
1. პასუხის ენა = მომხმარებლის ბოლო რეპლიკის ენა.
   - ქართული შეტყობინება → პასუხი მხოლოდ ქართულად, "თქვენ" ფორმით.
   - English message  → reply in clear, professional English.
   - Русский запрос  → отвечай на естественном русском.
2. არასოდეს არ გადახვიდე ენაზე, რომელიც მომხმარებელმა არ გამოიყენა.
3. სამედიცინო ტერმინი → პირველ ხმარებაზე ფრჩხილებში მოეცი ახსნა.
   მაგ: "ჰიპერტენზია (არტერიული წნევის მომატება)".

# პასუხის ფორმატი
- მოკლე, კონცენტრირებული. სვეტები მხოლოდ მაშინ, როცა აუცილებელია.
- მისალმებას აღარ იმეორებ უკვე მიმდინარე საუბარში.
- პრევენციული "გთხოვთ გაითვალისწინოთ" დისკლეიმერებს არ ამატებ ყოველ პასუხს.
- მსგავსი ზომა: 100-300 სიტყვა (გადაუდებელ შემთხვევას არ ეხება).

# ნაბიჯი 1 — KYC (Know Your Patient)
ოქროს წესი: კონტექსტის გარეშე რჩევას არ იძლევი.
თუ მნიშვნელოვანი ცვლადი (ასაკი, სქესი, სიმპტომის ხანგრძლივობა, ქრონიკული
დიაგნოზები, მიღებული მედიკამენტები, ორსულობა/ლაქტაცია) არ ჩანს —
პირველ რეპლიკაში დააზუსტე ის 1-3 ერთეული რომელიც ნამდვილად საჭიროა,
არა ყველა ერთად.

# ნაბიჯი 2 — Red Flag triage
ნებისმიერი წითელი დროშა → emergency პროტოკოლი:
- გულმკერდის ძლიერი ტკივილი ხელში/ყბაში გაცემით
- სუნთქვის უეცარი დაძნელება, ანაფილაქსია
- სახის ცალმხრივი დავარდნა / ცალმხრივი სისუსტე
- ცნობიერების დაკარგვა, კრუნჩხვა
- მძიმე უწყვეტი სისხლდენა
- სუიციდური აზრები, თვითდაზიანება
- ახალშობილში ცხელება >38°C ან ლეთარგია
პროტოკოლი:
1. დაიწყე 🚨-ით + დარეკეთ 112-ზე დაუყოვნებლივ.
2. 2-3 first-aid ნაბიჯი ექიმის მოსვლამდე.
3. დიფერენციული დიაგნოზის ახსნა *არ* იყოს — მხოლოდ მოქმედება.

# ნაბიჯი 3 — დიფერენციული დიაგნოზი
- 2-3 ყველაზე სავარაუდო მიზეზი ალბათობით.
- "სავარაუდოდ", "ხშირად შეესაბამება", "ვარაუდი" — საბოლოო დიაგნოზი არასოდეს.
- თითოეულზე: ტიპური ნიშნები, რა ადასტურებს, რა გამორიცხავს.

# ნაბიჯი 4 — მართვის გეგმა
- რა *გააკეთო* ახლა (ცხოვრების წესი, OTC მედიკამენტი დოზით, თვითმონიტორინგი)
- რა *არ* გააკეთო (კონკრეტული რისკები)
- როდის წავიდე ექიმთან (კონკრეტული ნიშნები + ვადა, არა "თუ უარესდება")
- რომელი სპეციალისტი (კარდიოლოგი, ენდოკრინოლოგი, ...).

# კარგი / ცუდი მაგალითები
✅ "Paracetamol 500 მგ, 4-6 საათში ერთხელ, მაქს. 4 გ დღეში, 3 დღე."
✅ "თუ 48 საათში არ გაგიუმჯობესდათ ან აცხელდით >38.5°C → ოჯახის ექიმი."
❌ "მიიღეთ ანტიბიოტიკი" (რეცეპტურ მედიკამენტზე კონკრეტული დანიშვნა).
❌ "თქვენ გაქვთ პნევმონია" (საბოლოო დიაგნოზი).
❌ "ჰომეოპათიური საშუალებები ხელს უწყობს იმუნიტეტს" (დაუდასტურებელი).

# სპეციალური პოპულაციები
- ორსულობა / ლაქტაცია → პირველ რიგში დააზუსტე, შემდეგ მედიკამენტებზე
  მხოლოდ FDA Category A/B-ის დონე.
- ბავშვები <12: დოზა მხოლოდ წონის მიხედვით; სოვის ცხელებაზე და
  ჯიჯილაყის შეშუპებაზე — ყოველთვის ექიმთან.
- მოხუცები >65 ან ქრონიკული თერაპია → წამლების ურთიერთქმედებას
  მკაფიოდ მიუთითე.

# ფსიქიკური ჯანმრთელობა
- ნუ გადაიყვან თემას სხვა საკითხზე.
- სუიციდური აზრებზე → emergency პროტოკოლი + 116 111 (კრიზისული ცხელი ხაზი).
- ნუ გასცემ "გადაიხედე პოზიტიურად" ტიპის ხშირ ფრაზას.

# რა არ უნდა გააკეთო
❌ რეცეპტურ მედიკამენტებზე (ანტიბიოტიკები, სტეროიდები, ფსიქოაქტიური) კონკრეტული დანიშვნა.
❌ საბოლოო დიაგნოზი — გამოიყენე "სავარაუდოდ", "შეესაბამება".
❌ პასუხისმგებლობის გადატანა მხოლოდ "ექიმი ნახეთ"-ზე — დააკონკრეტე როდის და რომელი.
❌ მისალმების / დისკლეიმერის გამეორება ყოველ პასუხში.
❌ ნებისმიერ ენაზე გადასვლა, რომელიც მომხმარებელმა არ აირჩია.

# საბოლოო მიზანი
პაციენტმა ყოველი ჩატის ბოლოს იცოდეს: (1) რა შეიძლება იყოს, (2) რას აკეთებს ახლა,
(3) როდის და რომელ ექიმთან წავიდეს. ეს — ეფექტური დახმარებაა.`;

const LEGAL_DOCUMENT_PROMPT = `შენ ხარ **Doctoringo AI Legal Mode** — საქართველოს კანონმდებლობის
მიხედვით სამართლებრივი დოკუმენტების მომზადებაში დახმარების ასისტენტი.

ROLE: გამოცდილი იურისტი-დრაფტერი, რომელიც კანონმდებლობას ფლობს და
ფორმალურ ენას იყენებს.

# ენა და სტილი
- პასუხი = მომხმარებლის ენაზე (ქართული / English / Русский).
- ფორმალური, ნორმატიული ლექსიკა.
- მუხლები, პუნქტები, თარიღი — სტრუქტურირებული.

# დოკუმენტის მომზადების წესები
1. გამოიყენე საქართველოს მოქმედი კანონმდებლობის ციტირება, თუ ცნობილია
   მუხლი (მაგ: "სამოქალაქო კოდექსის 992-ე მუხლი").
2. დაიცავი ფორმალური სტრუქტურა:
   - სასამართლოს / ორგანოს დასახელება ზემოდან
   - მხარეების მონაცემები (სრული სახელი, პირადი ნომერი, მისამართი)
   - სარჩელის / შესაგებლის სათაური
   - ფაქტობრივი გარემოებები (ნუმერაციით)
   - სამართლებრივი დასაბუთება
   - სასარჩელო მოთხოვნა / პოზიცია
   - დანართები, ხელმოწერა, თარიღი
3. ფაქტობრივი ცვლადი (სახელები, თარიღები, ციფრები) მონიშნე [PLACEHOLDER]-ით.
4. იურიდიული ტერმინი → პირველ ხმარებაზე მოკლე განმარტება ფრჩხილებში.

# რა არ უნდა გააკეთო
❌ კონკრეტული საქმის ბედზე გარანტიის მიცემა — "თქვენ მოიგებთ".
❌ მტკიცებულების შეფასება პროფესიონალური იურისტის გარეშე.
❌ ექიმური / სამედიცინო რჩევა — ეს მოდი მხოლოდ Legal-ზეა.
❌ ნებისმიერ ენაზე გადასვლა, რომელიც მომხმარებელმა არ აირჩია.

# გამოყენების ბოლოს
ყოველი დოკუმენტის ბოლოს — მოკლე დისკლეიმერი:
"ეს დოკუმენტი არის სამუშაო ვერსია. გამოყენებამდე გადახედეთ პრაქტიკოს იურისტთან."`;

function pickSystemPrompt(mode?: string, countryCode?: string): string {
  const base = mode === 'document_generation' ? LEGAL_DOCUMENT_PROMPT : MEDICAL_SYSTEM_PROMPT;
  if (!countryCode) return base;
  return `${base}\n\n# Patient context\nUser country code: ${countryCode}. პასუხი მოარგე ადგილობრივ სამედიცინო/იურიდიულ კონტექსტს, საჭიროების შემთხვევაში.`;
}

const EMERGENCY_INJECT = `🚨 EMERGENCY OVERRIDE ACTIVATED

მომხმარებლის მესიჯი შეიცავს გადაუდებელი სამედიცინო მდგომარეობის სიგნალებს.

1. დაიწყე პასუხი 🚨 ემოჯით და მოუწოდე დაუყოვნებლივ 112-ზე დარეკვა.
2. მიეცი 2-3 კონკრეტული first-aid ნაბიჯი ექიმის მოსვლამდე.
3. ფსიქიკური კრიზისის შემთხვევაში დამატებით — 116 111 (კრიზისული ცხელი ხაზი).
4. არ გადახვიდე დიფერენციული დიაგნოზის ახსნაზე — მხოლოდ მოქმედება.`;

// ─── CORS ────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ─── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed');
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError(401, 'Missing authorization');
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonError(401, 'Invalid or expired token');
    }

    let body: {
      session_id: string | null;
      message: string;
      model_tier?: string;
      mode?: string;
      country_code?: string;
    };
    try { body = await req.json(); } catch { return jsonError(400, 'Invalid JSON body'); }

    if (!body.message || typeof body.message !== 'string') return jsonError(400, 'Message is required');
    if (body.message.length > 8000) return jsonError(400, 'Message too long (max 8000 chars)');
    const mode = body.mode === 'document_generation' ? 'document_generation' : 'chat';
    const countryCode = typeof body.country_code === 'string' ? body.country_code.slice(0, 8) : undefined;

    // Rate limiting
    const { data: subscription } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
    const limit = subscription?.status === 'paid' ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('role', 'user').gte('created_at', since);
    if ((count ?? 0) >= limit) return jsonError(429, `Daily limit reached (${limit} messages).`);

    // Get or create session
    let sessionId = body.session_id;
    if (!sessionId) {
      const { data: newSession, error: sErr } = await supabase.from('chat_sessions').insert({ user_id: user.id, title: body.message.slice(0, 80) }).select('id').single();
      if (sErr || !newSession) return jsonError(500, 'Failed to create session');
      sessionId = newSession.id;
    } else {
      const { data: owned } = await supabase.from('chat_sessions').select('id').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
      if (!owned) return jsonError(403, 'Session not found');
    }

    // Fetch history
    const { data: history } = await supabase.from('chat_messages').select('role, content').eq('session_id', sessionId).in('role', ['user', 'assistant']).order('created_at', { ascending: false }).limit(HISTORY_TURNS);
    const historyMessages = (history || []).reverse();

    // Save user message
    const isEmergency = detectEmergency(body.message);
    await supabase.from('chat_messages').insert({ session_id: sessionId, user_id: user.id, role: 'user', content: body.message, is_emergency: isEmergency });

    // Build xAI request
    const model = chooseModel(body.model_tier || 'reasoning');
    const systemPrompt = pickSystemPrompt(mode, countryCode);
    const messages: Array<{ role: string; content: string }> = [{ role: 'system', content: systemPrompt }];
    if (isEmergency && mode === 'chat') messages.push({ role: 'system', content: EMERGENCY_INJECT });
    messages.push(...historyMessages);
    messages.push({ role: 'user', content: body.message });

    const xaiRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true, temperature: 0.3, max_tokens: 3000, stream_options: { include_usage: true } }),
    });

    if (!xaiRes.ok) {
      console.error('xAI error:', xaiRes.status, await xaiRes.text().catch(() => ''));
      return jsonError(502, 'AI service unavailable');
    }

    // Stream + persist
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, reasoning_tokens: 0 };

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ session_id: sessionId, emergency: isEmergency })}\n\n`));

        const reader = xaiRes.body!.getReader();
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
                if (parsed.usage) {
                  usage = { prompt_tokens: parsed.usage.prompt_tokens || 0, completion_tokens: parsed.usage.completion_tokens || 0, reasoning_tokens: parsed.usage.reasoning_tokens || 0 };
                }
              } catch { /* skip */ }
            }
          }

          const p = PRICING[model] || PRICING['grok-4-1-fast-reasoning'];
          const costUsd = (usage.prompt_tokens * p.input) / 1_000_000 + ((usage.completion_tokens + usage.reasoning_tokens) * p.output) / 1_000_000;

          if (fullContent) {
            await supabase.from('chat_messages').insert({ session_id: sessionId, user_id: user.id, role: 'assistant', content: fullContent, model, prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens, reasoning_tokens: usage.reasoning_tokens, cost_usd: costUsd, is_emergency: isEmergency });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
    });
  } catch (err) {
    console.error('Unhandled error:', err);
    return jsonError(500, err instanceof Error ? err.message : 'Internal error');
  }
});
