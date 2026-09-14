import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flag,
  ListChecks,
  LogOut,
  Send,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Dialog,
  FIELD_CLASS,
  IconCircle,
  ProgressBar,
} from "./primitives";

/**
 * סקר צו ראשון - 33 שאלות, שאלה אחת בכל מסך, מחולקות לתשעה נושאים.
 * היציאה מהסקר שומרת טיוטה כך שאפשר להמשיך מאותה נקודה.
 */

// ── תשובות מוכנות ───────────────────────────────────────────────────────────

const SCALE_LABELS: Record<number, string> = {
  0: "לא ביצעתי את התחנה",
  1: "במידה מועטה מאוד",
  2: "במידה מועטה",
  3: "במידה בינונית",
  4: "במידה רבה",
  5: "במידה רבה מאוד",
};

const SCALE_0_5 = [0, 1, 2, 3, 4, 5];
const SCALE_1_5 = [1, 2, 3, 4, 5];

const TEXT_HINT = "רשום הערתך/הארתך כאן.";

type QuestionType =
  | "scale0to5"
  | "scale1to5"
  | "yesNo"
  | "choice"
  | "text"
  | "slider";

interface Question {
  section: string;
  text: string;
  type: QuestionType;
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
  { section: SECTIONS.data, text: PROFESSIONAL, type: "scale0to5" },
  { section: SECTIONS.data, text: PERSONAL, type: "scale0to5" },
  {
    section: SECTIONS.data,
    text: "הערות/הארות כלליות לגבי תחנת אימות הנתונים.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── תחנת הריאיון האישי ──
  {
    section: SECTIONS.interview,
    text: PROFESSIONAL,
    type: "scale0to5",
  },
  { section: SECTIONS.interview, text: PERSONAL, type: "scale0to5" },
  {
    section: SECTIONS.interview,
    text: "הערות/הארות כלליות לגבי תחנת הריאיון האישי.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── תחנת המבחנים ──
  {
    section: SECTIONS.tests,
    text: "האם היו הפרעות בזמן הבחינה שגרמו לחוסר ריכוז?",
    type: "scale0to5",
  },
  { section: SECTIONS.tests, text: PERSONAL, type: "scale0to5" },
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
  { section: SECTIONS.medical, text: PROFESSIONAL, type: "scale0to5" },
  { section: SECTIONS.medical, text: PERSONAL, type: "scale0to5" },
  {
    section: SECTIONS.medical,
    text: "עד כמה היחס שניתן לך על ידי הרופא היה מקצועי ואדיב?",
    type: "scale0to5",
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

const TOTAL = QUESTIONS.length;

/** כרטיסי המאמרים במסך הסיום - השלבים הבאים בתהליך הגיוס */
const NEXT_STEPS: {
  title: string;
  text: string;
  icon: LucideIcon;
}[] = [
  {
    title: "הצו הראשון",
    text: "מה עובר עליך ביום הצו הראשון, אילו תחנות יש ואיך מתכוננים אליהן.",
    icon: ClipboardList,
  },
  {
    title: 'יום המא"ה',
    text: "יום המשימות והאתגרים שבודק התאמה לתפקידים לוחמים ומקצועיים.",
    icon: Target,
  },
  {
    title: "שאלון ההעדפות",
    text: "איך מדרגים תפקידים ומסלולים, ומה קורה עם הבחירות שלך אחר כך.",
    icon: ListChecks,
  },
  {
    title: "המיון המתקדם",
    text: "ימי המיון הייעודיים ליחידות ולתפקידים, ומה כדאי לדעת לפניהם.",
    icon: Users,
  },
  {
    title: "יום הגיוס",
    text: "מה לוקחים, מתי מגיעים ומה קורה מרגע ההגעה לבקו\"ם ועד השיבוץ.",
    icon: Flag,
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
const draftStore: { answers: Record<number, Answer>; index: number } = {
  answers: {},
  index: 0,
};

// ── פקדי מענה ───────────────────────────────────────────────────────────────

function OptionButton({
  label,
  badge,
  selected,
  onClick,
}: {
  label: string;
  badge?: number | string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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

/** סרגל דירוג 1-5 - חמש דרגות בשורה אחת, עם תווית הדרגה שנבחרה */
function RatingBar({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-1.5">
        {SCALE_1_5.map((n) => {
          const selected = value === String(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              aria-pressed={selected}
              aria-label={`${n} - ${SCALE_LABELS[n]}`}
              className={`flex-1 h-[52px] rounded-[10px] border text-[17px] font-bold transition-colors ${
                selected
                  ? "border-[#008ff0] bg-[rgba(0,143,240,0.06)] text-[#008ff0]"
                  : "border-[rgba(23,28,35,0.12)] bg-white text-[#171c23] hover:border-[rgba(0,143,240,0.35)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 text-[#171c23] text-[12px] opacity-55">
        <span>{SCALE_LABELS[1]}</span>
        <span>{SCALE_LABELS[5]}</span>
      </div>
      {value && (
        <span className="text-[#008ff0] text-[14px] font-semibold text-right">
          {SCALE_LABELS[Number(value)]}
        </span>
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
  const [index, setIndex] = useState(draftStore.index);
  const [answers, setAnswers] = useState<Record<number, Answer>>(
    draftStore.answers,
  );
  const [done, setDone] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  // שמירת הטיוטה בכל שינוי - כך שיציאה וחזרה ממשיכות מאותה נקודה
  useEffect(() => {
    draftStore.answers = answers;
    draftStore.index = index;
  }, [answers, index]);

  const question = QUESTIONS[index];
  const answer = answers[index] ?? {};

  const setValue = (value: string) =>
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...prev[index], value },
    }));

  const setDetail = (detail: string) =>
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...prev[index], detail },
    }));

  const showDetail =
    question.detail &&
    (question.detail.when === "always" ||
      answer.value === question.detail.when);

  /** טקסט חופשי אינו חובה; בחירה - כן, וכך גם פירוט שהוגדר כחובה */
  const canContinue =
    question.type === "text"
      ? true
      : Boolean(answer.value) &&
        (!showDetail ||
          !question.detail?.required ||
          Boolean(answer.detail?.trim()));

  const last = index === TOTAL - 1;

  const submit = () => {
    draftStore.answers = {};
    draftStore.index = 0;
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
        <div className="flex-1 w-full max-w-[760px] mx-auto flex flex-col gap-6">
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
              <span className="text-[#69c600]">!</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NEXT_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <a
                    key={step.title}
                    href="https://www.mitgaisim.idf.il"
                    target="_blank"
                    rel="noreferrer"
                    className="group bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-4 flex flex-col gap-2.5 transition-colors hover:border-[rgba(0,143,240,0.4)]"
                  >
                    <IconCircle size={36}>
                      <Icon size={17} />
                    </IconCircle>
                    <span className="font-bold text-[#171c23] text-[15px] text-right">
                      {step.title}
                    </span>
                    <p className="text-[#171c23] text-[13px] opacity-60 leading-relaxed text-right">
                      {step.text}
                    </p>
                    <span className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold mt-auto pt-1">
                      לכתבה המלאה
                      <ChevronLeft
                        size={14}
                        className="shrink-0 transition-transform group-hover:-translate-x-0.5"
                      />
                    </span>
                  </a>
                );
              })}
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
      {/* חיווי התקדמות + יציאה מהסקר */}
      <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
        <div className="max-w-[760px] mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-[#171c23] text-[14px]">
              סקר צו ראשון
            </span>
            <button
              type="button"
              onClick={() => setExitOpen(true)}
              className="flex items-center gap-1.5 text-[#171c23] text-[13px] font-semibold opacity-60 hover:opacity-100"
            >
              <LogOut size={14} className="shrink-0" />
              יציאה
            </button>
          </div>
          <ProgressBar value={((index + 1) / TOTAL) * 100} />
          <span className="text-[#171c23] text-[12px] opacity-55 text-right">
            שאלה {index + 1} מתוך {TOTAL}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[760px] mx-auto py-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[#008ff0] text-[13px] font-semibold text-right">
              {question.section}
            </span>
            <h3 className="font-bold text-[#122736] text-[22px] leading-snug text-right">
              {question.text}
            </h3>
          </div>

          {/* ── פקד המענה לפי סוג השאלה ── */}
          {question.type === "text" ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={answer.value ?? ""}
                onChange={(e) => setValue(e.target.value)}
                placeholder={question.hint}
                rows={5}
                className={`${FIELD_CLASS} resize-none leading-relaxed`}
              />
              <span className="text-[#171c23] text-[13px] opacity-55 text-right">
                שאלה זו אינה חובה - ניתן להמשיך גם בלי למלא.
              </span>
            </div>
          ) : question.type === "slider" ? (
            <RatingBar value={answer.value} onChange={setValue} />
          ) : (
            <div className="flex flex-col gap-2">
              {(question.type === "scale0to5"
                ? SCALE_0_5.map((n) => ({
                    label: SCALE_LABELS[n],
                    badge: n,
                  }))
                : question.type === "scale1to5"
                  ? SCALE_1_5.map((n) => ({
                      label: SCALE_LABELS[n],
                      badge: n,
                    }))
                  : (question.type === "yesNo"
                      ? ["כן", "לא"]
                      : (question.options ?? [])
                    ).map((o) => ({
                      label: o,
                      badge: undefined,
                    }))
              ).map((opt) => (
                <OptionButton
                  key={opt.label}
                  label={opt.label}
                  badge={opt.badge}
                  selected={
                    answer.value ===
                    (opt.badge !== undefined
                      ? String(opt.badge)
                      : opt.label)
                  }
                  onClick={() =>
                    setValue(
                      opt.badge !== undefined
                        ? String(opt.badge)
                        : opt.label,
                    )
                  }
                />
              ))}
            </div>
          )}

          {/* שדה פירוט - מוצג תמיד או רק אחרי תשובה מסוימת */}
          {showDetail && question.detail && (
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-[#171c23] text-[15px] text-right">
                {question.detail.label}
                {question.detail.required ? (
                  <span className="text-[#c43c3c]"> *</span>
                ) : (
                  <span className="text-[#171c23] opacity-50 font-normal">
                    {" "}
                    (רשות)
                  </span>
                )}
              </label>
              <textarea
                value={answer.detail ?? ""}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                className={`${FIELD_CLASS} resize-none leading-relaxed`}
              />
            </div>
          )}
        </div>
      </div>

      {/* ניווט בין השאלות */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronRight size={16} className="shrink-0" />
            לשאלה הקודמת
          </Button>
          {last ? (
            <Button onClick={submit} disabled={!canContinue}>
              <Send size={15} className="shrink-0" />
              סיום ושליחה
            </Button>
          ) : (
            <Button
              onClick={() => setIndex((i) => i + 1)}
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
              תוכל/י להמשיך מאותה שאלה.
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}
