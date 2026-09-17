import { AXIS_KEYS, AXIS_W } from '../data/axes.js';
import { PARTIES } from '../data/parties.js';
import { LEX, NEG } from '../data/lexicon.js';

/* ═══════════════════════════════════════════════════════════════════════
 * The scoring engine — free text → axis vector → ranked lists.
 *
 * This is a deterministic, in-page stand-in for a backend endpoint. The
 * seam is deliberately narrow: exactly one function (`runAnalysis`) is
 * called from the UI, so switching to a server means replacing this file
 * and awaiting the result in `useAnalysisRun`.
 *
 * Note on the existing Supabase function in `supabase/functions/jev-questions`:
 * it answers with a single `{ answer }` choice ("Party to elect"), not a
 * ranked top-five. Wiring it up therefore needs either a client-side
 * ranking around a single verdict, or a richer server response — a
 * product decision, not a port decision.
 * ═══════════════════════════════════════════════════════════════════════ */

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/* STEP scales one unit of signal; CAP bounds how far a single axis can
   travel from the centre so a long text cannot saturate it; PRIOR is how
   much an axis you never mentioned still counts toward the score. */
const STEP = 0.08, CAP = 0.38, PRIOR = 0.4;

/* Bar opacity per rank, so the top list reads lighter as it goes down. */
const FILL_OP = [100, 66, 52, 42, 34];

function normalize(s) {
  return s
    .replace(/[\u0591-\u05C7]/g, '')          // niqqud
    .replace(/["'\u05F3\u05F4\u2018\u2019\u201C\u201D`]/g, '')
    .replace(/[.,;:!?()[\]{}\-–—/\\|*_+=<>@#$%^&~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenIndex(tokens, phrase, text) {
  if (phrase.includes(' ')) {
    const at = text.indexOf(phrase);
    if (at < 0) return -1;
    const head = phrase.split(' ')[0];
    return tokens.findIndex(t => head.includes(t) || t.includes(head));
  }
  return tokens.findIndex(t => t.includes(phrase));
}

/**
 * Score every list against one free-text statement.
 *
 * @param {string} raw the user's ideology text
 * @returns {{
 *   user: Record<string, number>,      // the user's own 0–1 position per axis
 *   ranked: Array<object>,             // all 14 lists, best first
 *   signals: Array<{label: string, axis: string}>,  // de-duplicated hits
 *   coverage: number,                  // how many distinct signals were found
 *   touched: Record<string, boolean>   // which axes the text actually spoke to
 * }}
 */
export function runAnalysis(raw) {
  const text = normalize(raw);
  const tokens = text ? text.split(' ') : [];
  const acc = { security: 0, economy: 0, religion: 0, law: 0 };
  const touched = { security: false, economy: false, religion: false, law: false };
  const signals = [];

  for (const [term, axis, dir, weight, label] of LEX) {
    const i = tokenIndex(tokens, term, text);
    if (i < 0) continue;
    const negated = tokens.slice(Math.max(0, i - 3), i).some(t => NEG.has(t));
    acc[axis] += (negated ? -dir : dir) * weight * STEP;
    touched[axis] = true;
    signals.push({ label, axis });
  }

  const user = {};
  let wSum = 0;
  for (const k of AXIS_KEYS) {
    user[k] = clamp(0.5 + clamp(acc[k], -CAP, CAP), 0, 1);
    wSum += AXIS_W[k] * (touched[k] ? 1 : PRIOR);
  }

  const ranked = PARTIES.map(p => {
    let dist = 0;
    const axes = {};
    for (const k of AXIS_KEYS) {
      const delta = Math.abs(user[k] - p.v[k]);
      dist += AXIS_W[k] * (touched[k] ? 1 : PRIOR) * delta;
      axes[k] = Math.round(100 * (1 - delta));
    }
    return { ...p, score: Math.round(100 * (1 - dist / wSum)), axes };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'he'));

  const unique = [];
  for (const s of signals) if (!unique.some(x => x.label === s.label)) unique.push(s);

  return { user, ranked, signals: unique, coverage: unique.length, touched };
}

/**
 * The pure slice the ranked list renders: top five with rank, bar opacity
 * and the per-axis breakdown of each list.
 */
export function rankModel(result) {
  return result.ranked.slice(0, 5).map((p, i) => ({
    rank: i + 1, name: p.name, leader: p.leader, score: p.score, axes: p.axes, op: FILL_OP[i]
  }));
}
