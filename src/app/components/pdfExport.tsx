import { Download } from "lucide-react";
import { Button, type ButtonVariant } from "./primitives";

/**
 * ייצוא תשובות שאלון לקובץ PDF - בלי תלויות חיצוניות.
 * נבנה מסמך הדפסה נקי (עברית, מימין לשמאל) בתוך iframe מוסתר,
 * ומשם הדפדפן שומר אותו כ-PDF. כותרת המסמך היא שם הקובץ המוצע.
 */

export type PdfCell = string | number | null | undefined;

/** טבלה אחת במסמך - כותרת, כותרות עמודות ושורות */
export interface PdfTable {
  title?: string;
  columns: string[];
  rows: PdfCell[][];
}

const esc = (value: PdfCell) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** המלש"ב המחובר - בדמו הפרטים קבועים */
export const CANDIDATE = { name: "ישראלה ישראלית" };

const pad = (n: number) => String(n).padStart(2, "0");

const today = () => {
  const d = new Date();
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** שם קובץ קריא, בלי תווים שאסורים בשמות קבצים */
export const answersFileName = (questionnaire: string) =>
  `${questionnaire} - תשובות המלשב - ${today().replace(/\./g, "-")}`.replace(
    /[/\\:*?"<>|]/g,
    "-",
  );

const tableHtml = (table: PdfTable) => `
  ${table.title ? `<h2>${esc(table.title)}</h2>` : ""}
  <table>
    <thead>
      <tr>${table.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${table.rows
        .map(
          (row) =>
            `<tr>${table.columns
              .map(
                (_, i) =>
                  `<td${typeof row[i] === "number" ? ' class="num"' : ""}>${esc(
                    row[i],
                  )}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")}
    </tbody>
  </table>`;

function documentHtml({
  title,
  questionnaire,
  meta,
  tables,
}: {
  title: string;
  questionnaire: string;
  meta: [string, PdfCell][];
  tables: PdfTable[];
}) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    color: #171c23;
    font-size: 11pt;
    line-height: 1.5;
  }
  header {
    border-bottom: 2px solid #008ff0;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  h1 { font-size: 18pt; margin: 0 0 8px; }
  h2 { font-size: 13pt; margin: 18px 0 6px; }
  dl {
    display: grid;
    grid-template-columns: max-content max-content;
    justify-content: start;
    gap: 2px 14px;
    margin: 0;
    font-size: 10pt;
  }
  dt { font-weight: bold; }
  dd { margin: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid rgba(23, 28, 35, 0.25);
    padding: 5px 7px;
    text-align: right;
    vertical-align: top;
  }
  th { background: #f0f4f8; font-weight: bold; }
  /* שורות מתחלפות - קל יותר לעקוב אחרי שורה ארוכה */
  tbody tr:nth-child(even) td { background: #fafbfc; }
  td.num { text-align: center; white-space: nowrap; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  footer {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid rgba(23, 28, 35, 0.15);
    font-size: 9pt;
    color: rgba(23, 28, 35, 0.6);
  }
</style>
</head>
<body>
  <header>
    <h1>${esc(questionnaire)}</h1>
    <dl>
      <dt>שם המלש"ב</dt><dd>${esc(CANDIDATE.name)}</dd>
      <dt>תאריך הפקה</dt><dd>${today()} ${nowTime()}</dd>
      ${meta
        .map(
          ([label, value]) =>
            `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`,
        )
        .join("")}
    </dl>
  </header>
  ${tables.map(tableHtml).join("")}
  <footer>המסמך הופק מאזור האישי באתר מתגייסים ומרכז את התשובות שנשמרו בשאלון.</footer>
</body>
</html>`;
}

/** פותח את המסמך בחלון הדפסה מוסתר - משם נשמר כ-PDF */
export function printPdf(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;left:-9999px;top:0;width:0;height:0;border:0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const print = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    // ההסרה רק אחרי שחלון ההדפסה נסגר, אחרת התוכן נעלם ממנו
    setTimeout(() => frame.remove(), 1000);
  };

  if (doc.readyState === "complete") setTimeout(print, 60);
  else frame.onload = print;
}

export interface AnswersExport {
  /** שם השאלון - לכותרת המסמך ולשם הקובץ */
  questionnaire: string;
  /** כותרות העמודות של טבלת התשובות */
  columns: string[];
  /** שורות התשובות, לפי סדר העמודות */
  rows: PdfCell[][];
  /** שורות מידע נוספות בראש המסמך (תווית + ערך) */
  meta?: [string, PdfCell][];
  /** התווית של ספירת השורות בראש המסמך */
  countLabel?: string;
  /** טבלאות נוספות אחרי טבלת התשובות */
  extraTables?: PdfTable[];
}

/** מפיק את מסמך ה-PDF של תשובות המלש"ב */
export function exportAnswersPdf({
  questionnaire,
  columns,
  rows,
  meta = [],
  countLabel = "מספר תשובות",
  extraTables = [],
}: AnswersExport) {
  printPdf(
    documentHtml({
      title: answersFileName(questionnaire),
      questionnaire,
      meta: [[countLabel, rows.length], ...meta],
      tables: [
        { title: 'תשובות המלש"ב', columns, rows },
        ...extraTables,
      ],
    }),
  );
}

// ── הכפתור ──────────────────────────────────────────────────────────────────

/**
 * כפתור "ייצוא ל-PDF" - מקבל את תשובות המלש"ב ומפיק מהן מסמך להורדה.
 * מופיע בסיכומי השאלונים ובמסכי הסיום של משימות.
 */
export function ExportPdfButton({
  variant = "outline",
  label = "ייצוא ל-PDF",
  className,
  disabled,
  ...data
}: AnswersExport & {
  variant?: ButtonVariant;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const empty = data.rows.length === 0;
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={disabled || empty}
      title={
        empty
          ? "אין עדיין תשובות לייצוא"
          : 'ייצוא כל תשובות המלש"ב לקובץ PDF'
      }
      onClick={() => exportAnswersPdf(data)}
    >
      <Download size={15} className="shrink-0" />
      {label}
    </Button>
  );
}
