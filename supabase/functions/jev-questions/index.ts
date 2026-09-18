import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import questions from "./JevQuestionsInput.json" with { type: "json" };
import PARTY_PROFILES from "./parties.json" with { type: "json" };


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalize(value: unknown) {
  return String(value ?? "")
    .replace(/[״”“"'׳!–—-]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function asPercent(value: unknown) {
  if (value && typeof value === "object") {
    const candidate = value as { probability?: unknown; score?: unknown; value?: unknown };
    value = candidate.probability ?? candidate.score ?? candidate.value;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number <= 1 ? number * 100 : number)));
}

function probabilityFor(probabilities: unknown, partyName: string) {
  if (!probabilities || typeof probabilities !== "object" || Array.isArray(probabilities)) return null;
  const entries = Object.entries(probabilities as Record<string, unknown>);
  const key = normalize(partyName);
  const match = entries.find(([name]) => normalize(name) === key);
  return match ? asPercent(match[1]) : null;
}

function toResult(answer: { choice?: unknown; probabilities?: unknown; confidence?: unknown }, model: unknown) {
  const selectedName = PARTY_PROFILES.find(party => normalize(party.name) === normalize(answer.choice))?.name
    ?? String(answer.choice ?? "");
  const ranked = PARTY_PROFILES.map(party => ({
    ...party,
    score: probabilityFor(answer.probabilities, party.name) ?? (party.name === selectedName ? 100 : 0),
    axes: party.v,
  })).sort((a, b) => {
    if (a.name === selectedName) return -1;
    if (b.name === selectedName) return 1;
    return b.score - a.score || a.name.localeCompare(b.name, "he");
  });

  return {
    selected: ranked.find(party => party.name === selectedName) ?? ranked[0],
    ranked,
    confidence: asPercent(answer.confidence),
    model,
  };
}

Deno.serve(async (req) => {
  const startedAt = performance.now();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { ideology?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  if (typeof body.ideology !== "string" || !body.ideology.trim()) {
    return json({ error: "ideology must be a non-empty string" }, 400);
  }

  const apiKey = Deno.env.get("TYPESAFE_API_KEY");
  if (!apiKey) return json({ error: "TYPESAFE_API_KEY is not configured" }, 500);

  const upstream = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state: `Ideology: ${body.ideology.trim()}`,
      model: "jev-latest",
      questions,
    }),
  });

  const result = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return json({ error: "TypeSafe API request failed", details: result }, upstream.status);
  }

  const answer = result?.answers?.["Party to elect"];
  if (!answer || answer.type !== "choice") {
    return json({ error: "TypeSafe API returned an unexpected answer" }, 502);
  }

  const statsKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY")
    ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (statsKey) {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", statsKey);
    const { error } = await supabase.rpc("record_analysis", {
      p_party_name: answer.choice,
      p_latency_ms: Math.round(performance.now() - startedAt),
    });
    if (error) console.error("record_analysis failed", error.message);
  }

  return json({
    choice: answer.choice,
    scores: answer.probabilities,
    confidence: answer.confidence,
    model: result.model,
    usage: result.usage,
    result: toResult(answer, result.model),
  });
});
