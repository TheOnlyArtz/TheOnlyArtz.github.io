import { AXES } from '../data/axes.js';

export default function Reasoning({ result, isIn }) {
  const top = result.ranked[0];

  return (
    <>
      <div className="grid-2 why-grid">
        <div className="why">
          <h3>מה זיהיתי בדברים שלך</h3>
          <div className="signal-row">
            {result.signals.length
              ? result.signals.slice(0, 8).map(s => <span className="tag" key={s.label}>{s.label}</span>)
              : <span className="tag">לא זוהו מונחי עמדה</span>}
          </div>
          <p className="meta why-note">מונחים שזוהו בטקסט, אחרי התחשבות בשלילה בהקשר.</p>
        </div>

        <div className="why">
          <h3>התאמה לפי ציר — {top.name}</h3>
          <div className="axis-list">
            {AXES.map(a => {
              const known = result.touched[a.id];
              return (
                <div className={`axis${known ? '' : ' is-prior'}`} key={a.id}>
                  <span className="axis-label">{a.label}</span>
                  <span className="axis-track">
                    <span
                      className="axis-fill"
                      style={{
                        '--w': isIn ? `${top.axes[a.id]}%` : '0%',
                        '--fill-op': known ? '100%' : '30%'
                      }}
                    />
                  </span>
                  <span className={`axis-val${known ? '' : ' is-text'}`}>
                    {known ? `${top.axes[a.id]}%` : 'לא הוזכר'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="meta why-foot">
        צירים שכתבתם עליהם מקבלים משקל מלא; צירים שלא הוזכרו נשארים במשקל חלקי ולכן מסומנים
        כ"לא הוזכר". הציון הוא אחוז ההתאמה המשוקלל בין הווקטור שלכם לוקטור של כל רשימה.
      </p>
    </>
  );
}
