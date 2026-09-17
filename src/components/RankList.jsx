import { useEffect, useState } from 'react';
import { rankModel } from '../lib/analyze.js';
import { prefersReducedMotion } from '../lib/motion.js';

const COUNT_MS = 700;

/* Counts a score up from 0 with the same ease-out curve the bars use.
   Owns its own state so a 700ms animation never re-renders the list. */
function RankValue({ value, delay, active }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!active) {
      setShown(0);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const step = now => {
        const t = Math.min((now - start) / COUNT_MS, 1);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [active, value, delay]);

  return shown;
}

export default function RankList({ result, isIn }) {
  return (
    <ol className="rank" data-od-id="rank-list">
      {rankModel(result).map(m => {
        /* Rows land 70ms apart, after the verdict has composed. Set inline
           because the delay is per-rank data, not styling. */
        const delay = `${m.rank * 70}ms`;
        return (
          <li
            key={m.name}
            className={`rank-row${m.rank === 1 ? ' is-top' : ''}`}
            data-od-id={`rank-row-${m.rank}`}
            style={{ transitionDelay: delay }}
          >
            <span className="rank-num num">{m.rank}</span>
            <span className="rank-ident">
              <span className="rank-name">{m.name}</span>
              <span className="rank-leader">{m.leader}</span>
            </span>
            <span className="rank-bar">
              <span className="bar" role="img" aria-label={`${m.name}: התאמה ${m.score} מתוך 100`}>
                <span
                  className="bar-fill"
                  style={{
                    '--w': isIn ? `${m.score}%` : '0%',
                    '--fill-op': `${m.op}%`,
                    transitionDelay: delay
                  }}
                />
              </span>
            </span>
            <span className="rank-score" dir="ltr">
              <span className="rank-val num">
                <RankValue value={m.score} delay={m.rank * 70} active={isIn} />
              </span>
              <span className="rank-unit">/100</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
