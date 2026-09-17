import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) return json({ error: "Supabase key is not configured" }, 500);

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", key);
  const { data, error } = await supabase.rpc("get_public_stats");
  if (error) {
    console.error("get_public_stats failed", error.message);
    return json({ error: "Unable to load public stats" }, 500);
  }

  return json(data);
});
