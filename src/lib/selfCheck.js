import { AXIS_KEYS } from '../data/axes.js';
import { runAnalysis, rankModel } from './analyze.js';

const STORE_KEY = 'jab.partyAdvisor.v2';
const CHECK_TEXT = 'שוק חופשי והורדת מיסים';

/* A controlled input only sees a value written through the native setter
   followed by a bubbling `input` event. */
function setTextareaValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/* Drives the real CTA rather than a test-only path, then puts the user's
   own text back. Re-running the previous analysis is the closest thing to
   the original's "restore the view": submitting also scrolls to the answer,
   which the vanilla version (which re-rendered the DOM directly) did not do.
   If the previous text was too short to analyze, there is nothing to
   re-render and the panel keeps this check's result until the next submit. */
function ctaWaitsForAnswer() {
  const area = document.getElementById('ideology');
  const button = document.getElementById('analyzeBtn');
  if (!area || !button) return false;

  const previous = area.value;
  setTextareaValue(area, CHECK_TEXT);
  button.click();
  const staysHiddenUntilJevAnswers = !document.getElementById('answer');

  setTextareaValue(area, previous);
  if (previous.trim().length >= 8) button.click();
  else {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
  }
  return staysHiddenUntilJevAnswers;
}

export function installSelfCheck() {
  window.__jabSelfCheck = function __jabSelfCheck() {
    const none = runAnalysis('אני אוהב פיצה');
    const saturate = runAnalysis('שוק חופשי, הורדת מיסים, הפרטה, יזמות, מגזר פרטי, תחרות ועסקים.');
    const model = rankModel(runAnalysis(CHECK_TEXT));

    const checks = [
      ['negation flips the law axis',
        runAnalysis('רפורמה משפטית עכשיו').user.law > runAnalysis('אני נגד רפורמה משפטית').user.law],
      ['no signal leaves every axis centred',
        none.coverage === 0 && AXIS_KEYS.every(k => none.user[k] === 0.5)],
      ['a single text can never saturate an axis',
        AXIS_KEYS.every(k => saturate.user[k] >= 0.12 && saturate.user[k] <= 0.88)],
      ['all 14 real lists come back scored and sorted',
        none.ranked.length === 14 && none.ranked.every((p, i, r) => i === 0 || r[i - 1].score >= p.score)],
      ['top-five model carries rank, score and bar opacity',
        model.length === 5 && model.every((m, i) => m.rank === i + 1 && m.score >= 0 && m.score <= 100 && m.op > 0)
          && model[0].score >= model[4].score],
      ['the CTA keeps the answer hidden until JEV responds', ctaWaitsForAnswer()]
    ];

    const failed = checks.filter(c => !c[1]);
    console.table(checks.map(c => ({ check: c[0], pass: c[1] })));
    return failed.length === 0
      ? 'ג\'ב: כל הבדיקות עברו'
      : 'ג\'ב: נכשלו — ' + failed.map(f => f[0]).join(' | ');
  };
}
