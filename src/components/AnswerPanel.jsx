import { useEffect, useRef, useState } from 'react';
import Verdict from './Verdict.jsx';
import RankList from './RankList.jsx';
import Reasoning from './Reasoning.jsx';
import { prefersReducedMotion } from '../lib/motion.js';

/* `run` is null until the first analysis, and its `id` is the React key the
   parent uses to remount this component — so every new run starts with
   `is-in` absent and the entrance replays. */
export default function AnswerPanel({ run }) {
  const [isIn, setIsIn] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!run) return undefined;

    /* Measured with the content already in the DOM (opacity/transform do
       not affect layout), exactly like the pre-React version. */
    if (run.scroll) {
      const top = sectionRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    if (prefersReducedMotion()) {
      setIsIn(true);
      return undefined;
    }

    /* Two frames: the first commits the un-animated state, the second
       starts the transitions from it. */
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setIsIn(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [run]);

  return (
    <section
      ref={sectionRef}
      className={`section answer${isIn ? ' is-in' : ''}`}
      id="answer"
      data-od-id="answer"
      aria-live="polite"
      hidden={!run}
    >
      <div className="container answer-inner">
        {run && (
          <>
            <Verdict result={run.result} />
            <RankList result={run.result} isIn={isIn} />
            <Reasoning result={run.result} isIn={isIn} />
          </>
        )}
      </div>
    </section>
  );
}
