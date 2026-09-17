const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkvpbdackutmzighxxze.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const functionUrl = name => `${SUPABASE_URL}/functions/v1/${name}`;

function headers(json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(SUPABASE_KEY ? { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } : {})
  };
}

async function readJson(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || `Backend request failed (${response.status})`);
  return body;
}

export async function askJev(ideology) {
  if (!SUPABASE_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is not configured');
  const response = await fetch(functionUrl('jev-questions'), {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ ideology })
  });
  return readJson(response);
}

export async function getPublicStats() {
  const response = await fetch(functionUrl('jev-stats'), { headers: headers() });
  return readJson(response);
}
