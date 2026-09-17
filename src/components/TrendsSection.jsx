import { useEffect, useState } from 'react';
import { getPublicStats } from '../lib/backend.js';

const SPARK_LEN = 24;
const TICK_MS = 30000;
const EMPTY_STATS = { total: 0, hour: 0, leadPct: 0, leadName: null, ms: 0, spark: [] };

function delta(value, unit = '%') {
  if (value == null) return 'אין עדיין נתוני השוואה';
  const direction = value > 0 ? '▲' : value < 0 ? '▼' : '—';
  return `${direction} ${Math.abs(value).toFixed(unit === '%' ? 1 : 2)}${unit}`;
}

export default function TrendsSection() {
  const [kpi, setKpi] = useState(null);

  useEffect(() => {
    let active = true;
    const load = () => getPublicStats()
      .then(stats => { if (active) setKpi({ ...EMPTY_STATS, ...stats }); })
      .catch(error => console.warn('jev-stats unavailable', error.message));

    load();
    const id = window.setInterval(load, TICK_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const stats = kpi || EMPTY_STATS;
  const spark = Array.isArray(stats.spark) && stats.spark.length
    ? stats.spark.slice(-SPARK_LEN)
    : Array(SPARK_LEN).fill(0);
  const max = Math.max(...spark);
  const min = Math.min(...spark);

  return (
    <section className="section" id="trends" data-od-id="trends">
      <div className="container">
        <div className="row-between" style={{ marginBottom: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>מגמות כלל המשתמשים</p>
            <h2>למה נוטים המשתמשים בשעה האחרונה</h2>
          </div>
          <span className="tag" data-od-id="trends-demo-tag">נתוני שימוש חיים · מתעדכן כל 30 שניות</span>
        </div>

        <div className="kpi-grid" data-od-id="kpi-row">
          <div className="card kpi" data-od-id="kpi-completed">
            <span className="kpi-label">ניתוחים שהושלמו</span>
            <span className="kpi-value" dir="ltr">
              <span className="kpi-num" id="kpiTotal">{stats.total.toLocaleString('he-IL')}</span>
            </span>
            <span className="kpi-delta"><b>{delta(stats.totalDeltaPct)}</b> מול אתמול</span>
          </div>

          <div className="card kpi" data-od-id="kpi-last-hour">
            <span className="kpi-label">ניתוחים בשעה האחרונה</span>
            <span className="kpi-value" dir="ltr">
              <span className="kpi-num" id="kpiHour">{stats.hour.toLocaleString('he-IL')}</span>
            </span>
            <div className="spark" id="spark" aria-hidden="true">
              {spark.map((v, i) => {
                /* Index keys are load-bearing here: the window shifts one
                   value per tick, so element i must keep its identity for
                   the CSS height transition to animate instead of remount. */
                const t = (v - min) / Math.max(1, max - min);
                const pct = Math.round(26 + t * 74) + '%';
                return <i key={i} style={{ '--h': pct, '--o': pct }} />;
              })}
            </div>
            <span className="kpi-delta"><b>{delta(stats.hourDeltaPct)}</b> מול השעה הקודמת</span>
          </div>

          <div className="card kpi" data-od-id="kpi-leading">
            <span className="kpi-label">הרשימה המובילה כרגע</span>
            <span className="kpi-value" dir="ltr">
              <span className="kpi-num" id="kpiLeadPct">{stats.leadPct.toFixed(1)}</span>
              <span className="kpi-unit">%</span>
            </span>
            <span className="kpi-delta"><b id="kpiLeadName">{stats.leadName || '—'}</b> מהמשתמשים</span>
          </div>

          <div className="card kpi" data-od-id="kpi-latency">
            <span className="kpi-label">זמן ניתוח ממוצע</span>
            <span className="kpi-value" dir="ltr">
              <span className="kpi-num" id="kpiMs">{stats.ms.toFixed(2)}</span>
              <span className="kpi-unit">s</span>
            </span>
            <span className="kpi-delta"><b>{delta(stats.latencyDeltaMs == null ? null : stats.latencyDeltaMs / 1000, 's')}</b> מאתמול</span>
          </div>
        </div>

        <p className="kpi-foot">הנתונים מצטברים ללא שמירת הטקסטים שנשלחו או מזהי משתמש. השרת מעדכן אותם לאחר ניתוח שהושלם בהצלחה.</p>
      </div>
    </section>
  );
}
