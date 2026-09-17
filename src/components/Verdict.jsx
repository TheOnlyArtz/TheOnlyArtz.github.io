export default function Verdict({ result }) {
  const [top, second] = result.ranked;
  const gap = top.score - second.score;
  const thin = result.coverage === 0;
  const weak = result.coverage > 0 && result.coverage < 3;

  let lead;
  if (thin) {
    lead = 'לא הצלחתי לזהות מספיק מונחי עמדה בטקסט, ולכן הדירוג נשען על נקודת פתיחה מרכזית. הוסיפו מה דעתכם על כלכלה, ביטחון, דת ומדינה או שלטון החוק — והדירוג יתחדד.';
  } else if (gap <= 4) {
    lead = `הפער בינו לבין ${second.name} הוא ${gap} נקודות בלבד, כלומר שתיהן קרובות לתפיסה שכתבת. כדאי לקרוא את שתי המצעות לפני שמחליטים.`;
  } else {
    lead = `הציון ${top.score} מתוך 100, בפער של ${gap} נקודות מהבאה בתור (${second.name}). הפירוט שלמטה מראה איפה יש התאמה ואיפה יש פער.`;
  }

  const coverageTag = thin
    ? 'אות חלש · תוצאה מרכזית'
    : weak
      ? `אות דל · ${result.coverage} מונחים`
      : `${result.coverage} מונחי עמדה זוהו`;

  return (
    <div className="verdict">
      <p className="eyebrow">הרשימה שהכי מתאימה לך</p>
      <h2 className="verdict-name" data-od-id="answer-verdict">{top.name}</h2>
      <p className="lead">{lead}</p>
      <div className="verdict-tags">
        <span className="tag tag-strong">{top.score} מתוך 100</span>
        <span className="tag">פער מהבאה בתור: {gap}</span>
        <span className="tag">{coverageTag}</span>
        <span className="tag">בראש הרשימה: {top.leader}</span>
      </div>
    </div>
  );
}
