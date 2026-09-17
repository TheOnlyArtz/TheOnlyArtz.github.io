# ג'ב — יועצת בחירת מפלגה (React)

Single-page Hebrew/RTL app: you describe your ideology in free text, and the page
ranks the 14 Knesset-26 lists against it, with public live usage stats below.

The input calls the `jev-questions` Supabase Edge Function. The recommendation section
renders only after that response returns; successful requests record only aggregate
stats, never ideology text or user IDs.

## Run

```bash
npm install
npm run dev       # http://127.0.0.1:5173
npm run build     # production bundle into dist/
npm run preview
```

Two environment notes for this machine:

- `.npmrc` pins the registry to `registry.npmjs.org` because the machine-wide
  corporate mirror does not resolve here.
- If `NODE_ENV=production` is set in your shell, `npm install` skips
  devDependencies and `npm run build` fails with "Cannot find package 'vite'".
  Install with `npm install --include=dev`, or unset `NODE_ENV`.

## Layout

```
index.html                 RTL shell, Google Fonts (Cal Sans / Inter / Rubik / Assistant)
src/main.jsx               root render + console self-check
src/App.jsx                run state, localStorage persistence, section order
src/components/            TopNav · Hero (composer + chips) · AnswerPanel
                           (Verdict · RankList · Reasoning) · TrendsSection · MethodSection · SiteFooter
src/data/                  axes.js · parties.js · lexicon.js — the engine's data
src/lib/analyze.js         normalize → axis vector → ranked lists
src/lib/backend.js         jev-questions + public jev-stats Edge Function calls
src/lib/motion.js          prefers-reduced-motion
src/lib/selfCheck.js       window.__jabSelfCheck()
src/styles/tokens.css      Cal.com tokens, verbatim, + the Hebrew locale layer
src/styles/app.css         every rule below the token layer, in original cascade order
supabase/functions/        jev-questions + public jev-stats Edge Functions
supabase/migrations/        aggregate stats table/functions and locked-down grants
```

## Backend

- `jev-questions` accepts `{ ideology }`, calls TypeSafe with the same four-axis party profiles used by the frontend, returns a ranked UI result, and records one aggregate five-minute bucket after success.
- `jev-stats` is public (`GET`) and returns totals, last-hour volume, leader, latency, comparison deltas, and the 24-hour sparkline used by `TrendsSection`.
- `analysis_stats_5m` stores only counters, latency totals, and party counts. RLS is enabled and only the Edge Functions' service role can access the RPCs.

Create `.env` from `.env.example` for the frontend. `VITE_SUPABASE_ANON_KEY` is a publishable browser key; never put a service-role key in Vite env variables.

## Checks

Open the browser console and run:

```js
__jabSelfCheck()
```

For the backend access rules, run `npm run check:rls`. It asserts the public anon key
is denied INSERT/UPDATE/DELETE on `analysis_stats_5m` and denied `record_analysis`,
and exits non-zero if any write path opens up.

It asserts negation flips an axis, an empty signal stays centred at 0.5, no text can
saturate an axis, all 14 lists come back scored and sorted, the top-five model carries
rank/score/opacity, and the CTA keeps the recommendation hidden until JEV responds.

## Stats data

The KPI board is populated by the public `jev-stats` Edge Function and refreshes every
30 seconds. With no completed backend analyses yet, it intentionally shows zeroes.
Party names, leaders and the axis mapping are the real published lists; the mapping is
a coarse reading of public platforms, which the method section states.
