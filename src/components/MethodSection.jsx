export default function MethodSection() {
  return (
    <section className="section" id="method" data-od-id="method">
      <div className="container grid-1-2">
        <div>
          <p className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>השיטה</p>
          <h2>איך ג'ב מגיע לדירוג</h2>
        </div>
        <div className="method-body">
          <p className="lead">הטקסט שלכם מנורמל ומסונן למונחי עמדה. לכל מונח יש כיוון באחד מארבעה צירים: ביטחון ומדיניות, כלכלה, דת ומדינה, שלטון החוק. שלילה בהקשר הופכת את הכיוון, ולכן "אני נגד רפורמה משפטית" לא ייקרא כמו תמיכה בה.</p>
          <p className="lead">מכל מונח נבנה וקטור עמדות אישי, שמשווה לוקטור של כל רשימה. הציון הוא אחוז ההתאמה המשוקלל בין הווקטורים — לא סקר, לא תחזית מנדטים ולא המלצה מחייבת.</p>
          <hr className="rule" />
          <div className="tag-row">
            <span className="tag">4 צירים</span>
            <span className="tag">14 רשימות</span>
            <span className="tag">מיפוי גס על בסיס מצעים פומביים</span>
          </div>
        </div>
      </div>
    </section>
  );
}
