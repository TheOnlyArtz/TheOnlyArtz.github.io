import { useCallback, useRef, useState } from 'react';
import TopNav from './components/TopNav.jsx';
import Hero from './components/Hero.jsx';
import AnswerPanel from './components/AnswerPanel.jsx';
import TrendsSection from './components/TrendsSection.jsx';
import MethodSection from './components/MethodSection.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import { runAnalysis } from './lib/analyze.js';
import { askJev } from './lib/backend.js';

const STORE_KEY = 'jab.partyAdvisor.v2';

function readSavedRun() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    return saved && saved.text ? saved : null;
  } catch {
    return null;      // malformed state is not worth reporting
  }
}

export default function App() {
  /* One read drives both halves of the restore: the text the composer
     starts with and the result shown below it. */
  const [saved] = useState(readSavedRun);
  const [run, setRun] = useState(() =>
    saved ? { id: 1, result: runAnalysis(saved.text), scroll: false } : null);
  const nextId = useRef(1);

  const analyze = useCallback(text => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ text, at: Date.now() }));
    } catch {
      /* storage may be blocked — the run still works, it just is not remembered */
    }
    nextId.current += 1;
    setRun({ id: nextId.current, result: runAnalysis(text), scroll: true });
    // The local result keeps the UI immediate; the edge function is the
    // authoritative JEV request and records the completed analysis for stats.
    askJev(text).catch(error => console.warn('jev-questions unavailable', error.message));
  }, []);

  return (
    <>
      <TopNav />
      <main id="content">
        <Hero initialText={saved ? saved.text : ''} onAnalyze={analyze} />
        {/* Keyed on the run id: a new analysis remounts the panel, which is
            what replays the entrance animation and re-inits the bars. */}
        <AnswerPanel key={run ? run.id : 'idle'} run={run} />
        <TrendsSection />
        <MethodSection />
      </main>
      <SiteFooter />
    </>
  );
}
