export default function Verdict({ result }) {
  const top = result.selected || result.ranked[0];
  const second = result.ranked.find(party => party.name !== top.name);
  const gap = second ? top.score - second.score : 0;
  const confidence = result.confidence == null ? '—' : `${result.confidence}%`;

  return (
    <div className="verdict">
      <p className="eyebrow">הרשימה שהכי מתאימה לך</p>
      <h2 className="verdict-name" data-od-id="answer-verdict">{top.name}</h2>
      <p className="lead">
        ג'ב ניתח את מה שכתבת ובחר ב{top.name}. הפירוט שלמטה מציג את דירוג הרשימות
        והפרופיל של הרשימה שנבחרה לפי ארבעת הצירים.
      </p>
      <div className="verdict-tags">
        <span className="tag tag-strong">ביטחון התשובה: {confidence}</span>
        <span className="tag">הסתברות הבחירה: {top.score}%</span>
        {second && <span className="tag">פער מהבאה בתור: {gap} נקודות</span>}
        <span className="tag">בראש הרשימה: {top.leader}</span>
      </div>
    </div>
  );
}
