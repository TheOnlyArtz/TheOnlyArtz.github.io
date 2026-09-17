/* The four axes every party is mapped onto. `low` / `high` name the two
   poles — they are documentation for anyone editing the party vectors
   below, not strings the UI renders. */
export const AXES = [
  { id: 'security', label: 'ביטחון ומדיניות', low: 'פשרה', high: 'קו ניצי' },
  { id: 'economy',  label: 'כלכלה',            low: 'סוציאל-דמוקרטי', high: 'שוק חופשי' },
  { id: 'religion', label: 'דת ומדינה',         low: 'חילוני-ליברלי', high: 'דת במרחב הציבורי' },
  { id: 'law',      label: 'שלטון החוק',        low: 'ביקורת שיפוטית חזקה', high: 'שינוי מאזן' }
];

/* Relative weight of each axis in the final score. Security is politically
   dominant in Israel, so it carries slightly more than the rest. */
export const AXIS_W = { security: 1.15, economy: 1.0, religion: 0.9, law: 1.0 };
export const AXIS_KEYS = Object.keys(AXIS_W);
