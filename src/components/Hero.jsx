import { useEffect, useRef, useState } from 'react';
import { SAMPLES } from '../data/lexicon.js';

/* The five opinion fragments the chips append. The labels are UI copy;
   the actual text comes from SAMPLES so the chip and the lexicon stay in
   step. */
const CHIPS = [
  { sample: 0, odId: 'chip-economy', label: 'כלכלה חופשית' },
  { sample: 1, odId: 'chip-social', label: 'צדק חברתי' },
  { sample: 2, odId: 'chip-religion', label: 'דת ומדינה' },
  { sample: 3, odId: 'chip-law', label: 'שלטון החוק' },
  { sample: 4, odId: 'chip-security', label: 'ביטחון' }
];

const TOO_SHORT = 'כתבו לפחות משפט קצר — למשל מה דעתכם על כלכלה, ביטחון, דת ומדינה או שלטון החוק.';
const MIN_CHARS = 8;
const MAX_CHARS = 1200;
const MAX_GROW = 420;

export default function Hero({ initialText = '', onAnalyze, isAnalyzing = false }) {
  const [text, setText] = useState(initialText);
  const [notice, setNotice] = useState('');
  const areaRef = useRef(null);

  function autogrow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, MAX_GROW) + 'px';
  }

  // Covers typing, chip appends and the restored first value alike.
  useEffect(autogrow, [text]);

  // Web fonts change the metrics the box was measured with.
  useEffect(() => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(autogrow);
  }, []);

  function submit() {
    if (isAnalyzing) return;
    const value = text.trim();
    if (value.length < MIN_CHARS) {
      setNotice(TOO_SHORT);
      if (areaRef.current) areaRef.current.focus();
      return;
    }
    setNotice('');
    onAnalyze(value);
  }

  function addSample(i) {
    const current = text.trim();
    setText(current ? current + ' ' + SAMPLES[i] : SAMPLES[i]);
    setNotice('');
    if (areaRef.current) areaRef.current.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <section className="section hero" data-od-id="hero">
      <div className="container hero-center">
        <p className="eyebrow" data-od-id="hero-eyebrow">בחירות 2026 · 14 רשימות · כנסת 26</p>
        <h1 data-od-id="hero-title">תנו לג'ב לעזור לכם לבחור</h1>
        <p className="lead">כתבו בשפה חופשית מה חשוב לכם — כלכלה, ביטחון, דת ומדינה, שלטון החוק. ג'ב ממפה את הדברים לארבעה צירים, משווה אותם למצעים ומדרג את הרשימות.</p>

        {/* The sandbox that hosts the embedded preview can block native form
            submission (the browser returns before dispatching `submit`), so
            the CTA is wired directly and stays a plain button. The form
            listener is kept for standalone contexts where submission is
            allowed, and so Enter still submits. */}
        <form
          className="composer"
          id="chatForm"
          data-od-id="chat-form"
          noValidate
          onSubmit={e => { e.preventDefault(); submit(); }}
        >
          <textarea
            id="ideology"
            ref={areaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_CHARS}
            aria-label="כתבו כאן את תפיסת העולם שלכם"
            placeholder="לדוגמה: אני מאמין בכלכלה חופשית ובביטחון חזק, אבל גם בבריאות ובחינוך ציבוריים ובשלטון חוק חזק."
          />
          <div className="composer-foot">
            <span className="counter" dir="ltr"><span id="charCount">{text.length}</span> / {MAX_CHARS}</span>
            <button
              className="btn btn-primary"
              type="button"
              id="analyzeBtn"
              data-od-id="analyze-cta"
              onClick={submit}
              disabled={isAnalyzing}
              aria-busy={isAnalyzing}
            >
              {isAnalyzing && <span className="button-spinner" aria-hidden="true" />}
              {isAnalyzing ? 'ג\'ב מנתח...' : 'ג\'ב, תנתח לי'}
            </button>
          </div>
        </form>

        <div id="formNotice" className="notice" role="status" hidden={!notice}>{notice}</div>

        <div className="chips" data-od-id="sample-chips">
          <span className="chips-label">הוסף לדברים שלך</span>
          {CHIPS.map(c => (
            <button
              key={c.odId}
              className="chip"
              type="button"
              data-sample={c.sample}
              data-od-id={c.odId}
              disabled={text.includes(SAMPLES[c.sample])}
              onClick={() => addSample(c.sample)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="meta chat-hint">Enter לשליחה · Shift + Enter לירידת שורה</p>
      </div>
    </section>
  );
}
