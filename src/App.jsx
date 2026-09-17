import { useCallback, useRef, useState } from 'react';
import TopNav from './components/TopNav.jsx';
import Hero from './components/Hero.jsx';
import AnswerPanel from './components/AnswerPanel.jsx';
import TrendsSection from './components/TrendsSection.jsx';
import MethodSection from './components/MethodSection.jsx';
import SiteFooter from './components/SiteFooter.jsx';
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
  /* Restore the draft text, but require a fresh JEV answer before showing
     the recommendation section. */
  const [saved] = useState(readSavedRun);
  const [run, setRun] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const nextId = useRef(1);

  const analyze = useCallback(text => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ text, at: Date.now() }));
    } catch {
      /* storage may be blocked — the run still works, it just is not remembered */
    }
    const requestId = nextId.current + 1;
    nextId.current = requestId;
    setRun(null);
    setIsAnalyzing(true);

    askJev(text)
      .then(answer => {
        if (requestId !== nextId.current) return;
        if (!answer?.result?.ranked?.length) throw new Error('JEV returned no ranked result');
        setRun({ id: requestId, result: answer.result, scroll: true });
        setIsAnalyzing(false);
      })
      .catch(error => {
        if (requestId === nextId.current) setIsAnalyzing(false);
        console.warn('jev-questions unavailable', error.message);
      });
  }, []);

  return (
    <>
      <TopNav />
      <main id="content">
        <Hero initialText={saved ? saved.text : ''} onAnalyze={analyze} isAnalyzing={isAnalyzing} />
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
