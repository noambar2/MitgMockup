import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Send,
} from "lucide-react";
import {
  Button,
  Dialog,
  FieldLabel,
  FIELD_CLASS,
  FormTopBar,
  IconCircle,
} from "./primitives";

/**
 * סקר צו ראשון - שלב לכל נושא, ובראש כל תחנה שאלת סינון "האם ביצעת
 * את התחנה". תשובת "לא" מעמעמת את שאר שאלות התחנה ומאפשרת להמשיך.
 * היציאה מהסקר שומרת טיוטה כך שאפשר להמשיך מאותו שלב.
 */

// ── תשובות מוכנות ───────────────────────────────────────────────────────────

const SCALE_LABELS: Record<number, string> = {
  1: "במידה מועטה מאוד",
  2: "במידה מועטה",
  3: "במידה בינונית",
  4: "במידה רבה",
  5: "במידה רבה מאוד",
};

const SCALE_1_5 = [1, 2, 3, 4, 5];

const TEXT_HINT = "רשום הערתך/הארתך כאן.";

type QuestionType =
  | "scale1to5"
  | "yesNo"
  | "choice"
  | "text"
  | "slider";

interface Question {
  section: string;
  text: string;
  type: QuestionType;
  /** שאלת הסינון שבראש התחנה - "האם ביצעת את התחנה" */
  gate?: boolean;
  /** אפשרויות מותאמות - רק ל-choice */
  options?: string[];
  /** טקסט מנחה בשדה טקסט חופשי */
  hint?: string;
  /** שדה פירוט נוסף מתחת לבחירה */
  detail?: {
    label: string;
    /** השדה מוצג תמיד, או רק כשנבחרה תשובה מסוימת */
    when?: "always" | "כן";
    required?: boolean;
  };
}

const SECTIONS = {
  data: "תחנת אימות הנתונים",
  interview: "תחנת הריאיון האישי",
  tests: "תחנת המבחנים",
  lab: "תחנת המעבדה - בדיקת שתן/דם",
  medical: "תחנת הוועדה הרפואית",
  prep: "ההכנה לצו הראשון",
  office: "שאלות כלליות בנוגע ללשכת הגיוס",
  execution: "ביצוע הצו הראשון",
} as const;

const PROFESSIONAL = "האם המענה בתחנה היה מקצועי ומובן?";
const PERSONAL =
  "עד כמה היחס שניתן לך על ידי נותני השירות בתחנה היה אישי ואדיב?";

const QUESTIONS: Question[] = [
  // ── תחנת אימות הנתונים ──
  {
    section: SECTIONS.data,
    text: "האם ביצעת את תחנת אימות הנתונים?",
    type: "yesNo",
    gate: true,
  },
  { section: SECTIONS.data, text: PROFESSIONAL, type: "scale1to5" },
  { section: SECTIONS.data, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.data,
    text: "הערות/הארות כלליות לגבי תחנת אימות הנתונים.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── תחנת הריאיון האישי ──
  {
    section: SECTIONS.interview,
    text: "האם ביצעת את תחנת הריאיון האישי?",
    type: "yesNo",
    gate: true,
  },
  {
    section: SECTIONS.interview,
    text: PROFESSIONAL,
    type: "scale1to5",
  },
  { section: SECTIONS.interview, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.interview,
    text: "הערות/הארות כלליות לגבי תחנת הריאיון האישי.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── תחנת המבחנים ──
  {
    section: SECTIONS.tests,
    text: "האם ביצעת את תחנת המבחנים?",
    type: "yesNo",
    gate: true,
  },
  {
    section: SECTIONS.tests,
    text: "האם היו הפרעות בזמן הבחינה שגרמו לחוסר ריכוז?",
    type: "scale1to5",
  },
  { section: SECTIONS.tests, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.tests,
    text: "במידה וברשותך אבחון דידקטי/פסיכולוגי כלשהו - האם העברת אותו טרם ההתייצבות בלשכת הגיוס?",
    type: "choice",
    options: ["כן", "לא", "אין לי אבחון"],
  },
  {
    section: SECTIONS.tests,
    text: "הערות/הארות כלליות לגבי תחנת המבחנים.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── תחנת המעבדה ──
  {
    section: SECTIONS.lab,
    text: "האם ביצעת את תחנת המעבדה (בדיקת שתן/דם)?",
    type: "yesNo",
    gate: true,
  },
  {
    section: SECTIONS.lab,
    text: "האם העברת תוצאות בדיקות שתן/דם טרם ההתייצבות בלשכת הגיוס?",
    type: "yesNo",
  },
  {
    section: SECTIONS.lab,
    text: "הערות/הארות כלליות לגבי תחנת המעבדה.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── תחנת הוועדה הרפואית ──
  {
    section: SECTIONS.medical,
    text: "האם ביצעת את תחנת הוועדה הרפואית?",
    type: "yesNo",
    gate: true,
  },
  { section: SECTIONS.medical, text: PROFESSIONAL, type: "scale1to5" },
  { section: SECTIONS.medical, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.medical,
    text: "עד כמה היחס שניתן לך על ידי הרופא היה מקצועי ואדיב?",
    type: "scale1to5",
  },
  {
    section: SECTIONS.medical,
    text: "האם מילאת שאלון רפואי ברשת ושלחת עם חתימת רופא?",
    type: "yesNo",
    detail: { label: "פרט", when: "always" },
  },
  {
    section: SECTIONS.medical,
    text: "הערות/הארות כלליות לגבי תחנת הוועדה הרפואית.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── ההכנה לצו הראשון ──
  {
    section: SECTIONS.prep,
    text: "האם עברת הכנה לצו הראשון במסגרת בית הספר?",
    type: "yesNo",
  },
  {
    section: SECTIONS.prep,
    text: "האם עברת הכנה לצו הראשון במסגרות אחרות?",
    type: "yesNo",
    detail: {
      label: "במידה ועברת הכנה במסגרת אחרת, באילו?",
      when: "כן",
      required: true,
    },
  },
  {
    section: SECTIONS.prep,
    text: "במידה והעברת מסמכים/בדיקות/אבחונים טרם ההתייצבות בלשכת הגיוס - כיצד העברת אותם?",
    type: "choice",
    options: [
      "אתר מתגייסים",
      "דואר אלקטרוני",
      "פקס",
      "לא העברתי מסמכים טרם ההתייצבות",
    ],
  },
  {
    section: SECTIONS.prep,
    text: "האם קיבלת אישור לכך שהמסמכים/בדיקות/אבחונים שהעברת התקבלו וטופלו טרם ההתייצבות?",
    type: "yesNo",
  },
  {
    section: SECTIONS.prep,
    text: "האם ההכנה שבוצעה סייעה לך להבין את מהלך ותכניו של הצו הראשון?",
    type: "yesNo",
    detail: { label: "פרט", when: "always" },
  },
  {
    section: SECTIONS.prep,
    text: "הערות/הארות כלליות.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── שאלות כלליות לגבי לשכת הגיוס ──
  {
    section: SECTIONS.office,
    text: "שילוט והכוונה ברורים.",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "סדר וניקיון לשכת הגיוס.",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "מהי מידת שביעות רצונך מזמני ההמתנה במהלך יום הצו הראשון באופן כללי?",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "שביעות רצון כללית מיום הצו הראשון.",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "האם זכור לך נותן שירות כלשהו לטובה/לרעה?",
    type: "text",
    hint: TEXT_HINT,
  },
  {
    section: SECTIONS.office,
    text: "הערות/הארות כלליות.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── ביצוע הצו הראשון ──
  {
    section: SECTIONS.execution,
    text: "באיזו מידה תהליך ההכנה וההרצאות שליוו את הצו סייעו לך להיערכות לקראת הצו הראשון?",
    type: "scale1to5",
  },
  {
    section: SECTIONS.execution,
    text: "באיזו שביעות רצון מהמענה החינוכי בצו הראשון נתרמה לך?",
    type: "scale1to5",
  },
  {
    section: SECTIONS.execution,
    text: 'האם פגשת את מד"נית בית הספר והאם סייעה לך במענה לשאלותיך?',
    type: "yesNo",
    detail: { label: "פרט", when: "always" },
  },
  {
    section: SECTIONS.execution,
    text: "בהמשך להערותיך, האם אתה מסכים שנעביר את הסקר עם פרטיך להתייחסות מפקדי הלשכה?",
    type: "yesNo",
  },
];

/** מספר השאלה באפיון - שאלות הסינון שהוספנו אינן נספרות */
const SPEC_NUMBERS = QUESTIONS.reduce<Record<number, number>>(
  (acc, question, index) => {
    if (!question.gate) {
      acc[index] = Object.keys(acc).length + 1;
    }
    return acc;
  },
  {},
);

/** כל נושא בסקר הוא שלב אחד, ובתוכו כל שאלות אותו נושא */
const STEPS = QUESTIONS.reduce<
  { section: string; items: { question: Question; index: number }[] }[]
>((acc, question, index) => {
  const current = acc[acc.length - 1];
  if (current && current.section === question.section) {
    current.items.push({ question, index });
  } else {
    acc.push({ section: question.section, items: [{ question, index }] });
  }
  return acc;
}, []);

/** כתבות ההמשך במסך הסיום - השלבים הבאים בתהליך הגיוס */
const NEXT_STEPS: { title: string; text: string }[] = [
  {
    title: "הצו הראשון",
    text: "מה עובר עליך ביום הצו הראשון, אילו תחנות יש ואיך מתכוננים אליהן.",
  },
  {
    title: 'יום המא"ה',
    text: "יום המשימות והאתגרים שבודק התאמה לתפקידים לוחמים ומקצועיים.",
  },
  {
    title: "שאלון ההעדפות",
    text: "איך מדרגים תפקידים ומסלולים, ומה קורה עם הבחירות שלך אחר כך.",
  },
  {
    title: "המיון המתקדם",
    text: "ימי המיון הייעודיים ליחידות ולתפקידים, ומה כדאי לדעת לפניהם.",
  },
  {
    title: "יום הגיוס",
    text: "מה לוקחים, מתי מגיעים ומה קורה מרגע ההגעה לבקו\"ם ועד השיבוץ.",
  },
];

interface Answer {
  value?: string;
  detail?: string;
}

/**
 * טיוטת הסקר נשמרת מחוץ לקומפוננטה - יציאה וחזרה ממשיכות
 * מאותה שאלה עם התשובות שכבר נענו.
 */
const draftStore: { answers: Record<number, Answer>; step: number } = {
  answers: {},
  step: 0,
};

/** שאלה שנדרשת תשובה עליה - כל שאלה שאינה טקסט חופשי */
const isRequired = (question: Question) => question.type !== "text";

const isAnswered = (question: Question, answer: Answer) => {
  if (!isRequired(question)) return true;
  if (!answer.value) return false;
  const needsDetail =
    question.detail?.required &&
    (question.detail.when === "always" ||
      answer.value === question.detail.when);
  return !needsDetail || Boolean(answer.detail?.trim());
};

// ── פקדי מענה ───────────────────────────────────────────────────────────────

/** אפשרות בחירה יחידה - עיגול רדיו ותווית, כמו בשאלון תחביבים */
function RadioOption({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className="flex items-center gap-2.5 text-right w-fit"
    >
      <span
        className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          selected
            ? "border-[#008ff0]"
            : "border-[rgba(23,28,35,0.3)]"
        }`}
      >
        {selected && (
          <span className="w-[11px] h-[11px] rounded-full bg-[#008ff0]" />
        )}
      </span>
      <span className="text-[#171c23] text-[15px]">{label}</span>
    </button>
  );
}

/** אפשרות בחירה ככרטיס - לסולמות ולשאלות עם אפשרויות מותאמות */
function OptionCard({
  label,
  badge,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  badge?: number;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 rounded-[10px] border px-4 py-3.5 text-right transition-colors ${
        selected
          ? "border-[#008ff0] bg-[rgba(0,143,240,0.06)]"
          : "border-[rgba(23,28,35,0.12)] bg-white hover:border-[rgba(0,143,240,0.35)]"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${
          selected
            ? "bg-[#008ff0] text-white"
            : "bg-[rgba(23,28,35,0.06)] text-[#171c23]"
        }`}
      >
        {badge ?? (selected ? <Check size={14} /> : "")}
      </span>
      <span
        className={`text-[15px] text-[#171c23] ${selected ? "font-semibold" : ""}`}
      >
        {label}
      </span>
    </button>
  );
}

/** סרגל דירוג 1-5 - אותו פקד כמו סולם השליטה בשאלון תחביבים */
function RatingBar({
  value,
  disabled,
  onChange,
}: {
  value?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        {SCALE_1_5.map((n) => {
          const selected = value === String(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${n} - ${SCALE_LABELS[n]}`}
              className={`flex-1 h-[52px] rounded-[10px] text-[18px] font-semibold border transition-colors ${
                selected
                  ? "bg-[rgba(0,143,240,0.06)] border-[#008ff0] text-[#008ff0]"
                  : "bg-white border-[rgba(23,28,35,0.12)] text-[#171c23] hover:bg-[rgba(0,143,240,0.06)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-[#171c23] opacity-60">
        <span>{SCALE_LABELS[1]}</span>
        <span>{SCALE_LABELS[5]}</span>
      </div>
    </div>
  );
}

/** שאלה אחת בתוך שלב: מספר השאלה, נוסח, פקד המענה ושדה פירוט */
function QuestionBlock({
  question,
  number,
  answer,
  disabled,
  onValue,
  onDetail,
}: {
  question: Question;
  /** מספר השאלה באפיון; לשאלת הסינון אין מספר */
  number?: number;
  answer: Answer;
  /** התחנה לא בוצעה - השאלה מוצגת מעומעמת ואינה נדרשת */
  disabled?: boolean;
  onValue: (v: string) => void;
  onDetail: (v: string) => void;
}) {
  const showDetail =
    question.detail &&
    (question.detail.when === "always" ||
      answer.value === question.detail.when);

  return (
    <div
      aria-disabled={disabled}
      className={`flex flex-col ${disabled ? "opacity-40 pointer-events-none select-none" : ""}`}
    >
      {number !== undefined && (
        <span className="text-[#171c23] text-[12px] opacity-45 text-right mb-1">
          שאלה {number}
        </span>
      )}
      <FieldLabel required={isRequired(question)}>
        {question.text}
      </FieldLabel>

      {question.type === "text" ? (
        <textarea
          value={answer.value ?? ""}
          onChange={(e) => onValue(e.target.value)}
          placeholder={question.hint}
          rows={4}
          disabled={disabled}
          className={`${FIELD_CLASS} resize-none leading-relaxed`}
        />
      ) : question.type === "slider" ||
        question.type === "scale1to5" ? (
        <RatingBar
          value={answer.value}
          disabled={disabled}
          onChange={onValue}
        />
      ) : question.type === "yesNo" ? (
        <div className="flex flex-col gap-2.5">
          {["כן", "לא"].map((label) => (
            <RadioOption
              key={label}
              label={label}
              selected={answer.value === label}
              disabled={disabled}
              onClick={() => onValue(label)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((label) => (
            <OptionCard
              key={label}
              label={label}
              selected={answer.value === label}
              disabled={disabled}
              onClick={() => onValue(label)}
            />
          ))}
        </div>
      )}

      {/* שדה פירוט - מוצג תמיד או רק אחרי תשובה מסוימת */}
      {showDetail && question.detail && (
        <div className="mt-4">
          <FieldLabel required={question.detail.required}>
            {question.detail.label}
            {!question.detail.required && (
              <span className="text-[#171c23] opacity-50 font-normal">
                {" "}
                (רשות)
              </span>
            )}
          </FieldLabel>
          <textarea
            value={answer.detail ?? ""}
            onChange={(e) => onDetail(e.target.value)}
            rows={3}
            disabled={disabled}
            className={`${FIELD_CLASS} resize-none leading-relaxed`}
          />
        </div>
      )}
    </div>
  );
}

// ── העמוד ───────────────────────────────────────────────────────────────────

export default function FirstOrderSurveyPage({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState(draftStore.step);
  const [answers, setAnswers] = useState<Record<number, Answer>>(
    draftStore.answers,
  );
  const [done, setDone] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  // שמירת הטיוטה בכל שינוי - כך שיציאה וחזרה ממשיכות מאותה נקודה
  useEffect(() => {
    draftStore.answers = answers;
    draftStore.step = step;
  }, [answers, step]);

  // מעבר בין שלבים מתחיל תמיד מראש הנושא
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const current = STEPS[step];

  const setValue = (index: number, value: string) =>
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...prev[index], value },
    }));

  const setDetail = (index: number, detail: string) =>
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...prev[index], detail },
    }));

  /** שאלת הסינון של התחנה, אם יש כזו בנושא הנוכחי */
  const gate = current.items.find(({ question }) => question.gate);
  const gateAnswer = gate ? answers[gate.index]?.value : undefined;
  /** סומן "לא ביצעתי" - שאר שאלות התחנה מעומעמות ואינן נדרשות */
  const stationSkipped = gateAnswer === "לא";

  /** אפשר להמשיך רק אחרי שנענו כל שאלות החובה שבנושא */
  const canContinue = stationSkipped
    ? true
    : current.items.every(({ question, index }) =>
        isAnswered(question, answers[index] ?? {}),
      );

  const last = step === STEPS.length - 1;

  const submit = () => {
    draftStore.answers = {};
    draftStore.step = 0;
    setDone(true);
  };

  const leave = () => {
    setExitOpen(false);
    onExit();
  };

  // ── מסך הסיום ──
  if (done) {
    return (
      <section className="bg-white px-4 sm:px-6 md:px-10 py-6 flex flex-col flex-1">
        <div className="flex-1 w-full max-w-[640px] mx-auto flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <IconCircle
              size={72}
              bg="rgba(105,198,0,0.12)"
              color="#69c600"
            >
              <Check size={34} />
            </IconCircle>
            <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
              מילאת את השאלון בהצלחה
              <span className="text-[#69c600]">.</span>
            </h3>
            <p className="text-[#171c23] text-[15px] opacity-60 max-w-[420px] leading-relaxed">
              תודה על המשוב. הוא יסייע לנו לשפר את השירות
              בלשכות הגיוס ואת חוויית הצו הראשון של המתגייסים
              הבאים.
            </p>
          </div>

          {/* כרטיסי מאמרים - כל שלב בתהליך עם הסבר קצר וקישור לקריאה */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[#171c23] text-[17px] text-right">
                השלבים הבאים בתהליך הגיוס
              </span>
              <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                כתבות קצרות שיסבירו מה מחכה לך בהמשך הדרך.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {NEXT_STEPS.map((step) => (
                <a
                  key={step.title}
                  href="https://www.mitgaisim.idf.il"
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] px-4 py-3 flex flex-col gap-1 transition-colors hover:border-[rgba(0,143,240,0.4)]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#171c23] text-[15px] group-hover:text-[#008ff0]">
                      {step.title}
                    </span>
                    <ChevronLeft
                      size={15}
                      className="shrink-0 text-[#171c23] opacity-35 transition-transform group-hover:-translate-x-0.5 group-hover:text-[#008ff0] group-hover:opacity-100"
                    />
                  </span>
                  <p className="text-[#171c23] text-[13px] opacity-60 leading-snug text-right">
                    {step.text}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={onGoHome}>חזרה לעמוד הבית</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      <FormTopBar
        title="סקר צו ראשון"
        counter={`שלב ${step + 1} מתוך ${STEPS.length} · ${current.section}`}
        progress={((step + 1) / STEPS.length) * 100}
        width={640}
        onExit={() => setExitOpen(true)}
      />

      <div className="flex-1 w-full max-w-[640px] mx-auto py-6">
        <div className="flex flex-col gap-6">
          <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-right">
            {current.section}
            <span className="text-[#69c600]">.</span>
          </h3>

          {/* כל שאלות הנושא, מופרדות בקו דק */}
          <div className="flex flex-col divide-y divide-[rgba(23,28,35,0.08)]">
            {current.items.map(({ question, index }, i) => (
              <div
                key={index}
                className={i === 0 ? "pb-6" : "py-6 last:pb-0"}
              >
                <QuestionBlock
                  question={question}
                  number={SPEC_NUMBERS[index]}
                  answer={answers[index] ?? {}}
                  disabled={stationSkipped && !question.gate}
                  onValue={(v) => setValue(index, v)}
                  onDetail={(v) => setDetail(index, v)}
                />
              </div>
            ))}
          </div>

          {stationSkipped ? (
            <span className="text-[#171c23] text-[13px] opacity-60 text-right">
              סימנת שלא ביצעת את התחנה - שאר שאלות הנושא אינן
              נדרשות, וניתן להמשיך לנושא הבא.
            </span>
          ) : (
            !canContinue && (
              <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                יש לענות על כל שאלות החובה בנושא זה כדי להמשיך.
                שאלות הערות פתוחות אינן חובה.
              </span>
            )
          )}
        </div>
      </div>

      {/* ניווט בין הנושאים */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[640px] mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((i) => Math.max(0, i - 1))}
            disabled={step === 0}
          >
            <ChevronRight size={16} className="shrink-0" />
            לשלב הקודם
          </Button>
          {last ? (
            <Button onClick={submit} disabled={!canContinue}>
              <Send size={15} className="shrink-0" />
              סיום ושליחה
            </Button>
          ) : (
            <Button
              onClick={() => setStep((i) => i + 1)}
              disabled={!canContinue}
            >
              המשך
              <ChevronLeft size={16} className="shrink-0" />
            </Button>
          )}
        </div>
      </div>

      {exitOpen && (
        <Dialog
          onClose={() => setExitOpen(false)}
          width={420}
          title="האם ברצונך לצאת מהסקר?"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setExitOpen(false)}
              >
                המשך מילוי הסקר
              </Button>
              <Button variant="primary" onClick={leave}>
                יציאה מהסקר
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <IconCircle size={40}>
              <ClipboardList size={18} />
            </IconCircle>
            <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
              התשובות שענית עד כה יישמרו כטיוטה, ובכניסה הבאה
              תוכל/י להמשיך מאותו שלב.
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}
