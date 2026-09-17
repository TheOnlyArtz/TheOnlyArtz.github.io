import { AXES } from '../data/axes.js';

export default function Reasoning({ result, isIn }) {
  const top = result.selected || result.ranked[0];
  const confidence = result.confidence == null ? '—' : `${result.confidence}%`;

  return (
    <>
      <div className="grid-2 why-grid">
        <div className="why">
          <h3>תשובת ג'ב</h3>
          <div className="signal-row">
            <span className="tag tag-strong">{top.name}</span>
            <span className="tag">ביטחון: {confidence}</span>
            {result.model && <span className="tag">מודל: {result.model}</span>}
          </div>
          <p className="meta why-note">הבחירה והדירוג התקבלו מ־JEV לאחר עיבוד התשובה שלכם.</p>
        </div>

        <div className="why">
          <h3>מיפוי הרשימה לפי ציר — {top.name}</h3>
          <div className="axis-list">
            {AXES.map(a => {
              const value = top.axes?.[a.id];
              return (
                <div className="axis" key={a.id}>
                  <span className="axis-label">{a.label}</span>
                  <span className="axis-track">
                    <span
                      className="axis-fill"
                      style={{
                        '--w': isIn && value != null ? `${value}%` : '0%',
                        '--fill-op': value == null ? '30%' : '100%'
                      }}
                    />
                  </span>
                  <span className={`axis-val${value == null ? ' is-text' : ''}`}>
                    {value == null ? 'לא זמין' : `${value}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="meta why-foot">
        מיפוי הצירים הוא פרופיל העמדות של הרשימה, כפי שנשלח לקריטריוני JEV. הוא אינו סקר
        ואינו מחליף קריאה של מצע הרשימה המלא.
      </p>
    </>
  );
}
