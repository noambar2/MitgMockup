import {
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Eye,
  Timer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Button,
  Dialog,
  useDialogClose,
  ProgressBar,
  ProgressRing,
} from "./primitives";

/**
 * מבחן חשיבה צורנית - "השלם את הצורה".
 * השאלות נבנות מכללים (מילוי/סיבוב, מספר קווים/סגנון) כך שאפשר
 * לייצר מהן כמה שאלות שרוצים והתשובות והנימוק תמיד עקביים.
 */

// ── מפרט צורה ───────────────────────────────────────────────────────────────

type Fill = "empty" | "hatch" | "solid";
type StrokeStyle = "straight" | "wave" | "zigzag";

export type FigureSpec =
  | { kind: "rect"; fill: Fill; rotate: number }
  | {
      kind: "strokes";
      count: number;
      style: StrokeStyle;
      rotate: number;
    };

const OPTION_LETTERS = ["א", "ב", "ג", "ד"];

// ── ציור הצורה ──────────────────────────────────────────────────────────────

function Figure({
  spec,
  size = 62,
}: {
  spec: FigureSpec;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const hatchId = `h-${uid}`;
  // מרכז ה-viewBox - לא תלוי בגודל התצוגה
  const c = 31;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 62 62"
      className="block text-[#171c23]"
      aria-hidden
    >
      <defs>
        <pattern
          id={hatchId}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke="currentColor"
            strokeWidth="1.1"
          />
        </pattern>
      </defs>

      <g transform={`rotate(${spec.rotate} ${c} ${c})`}>
        {spec.kind === "rect" ? (
          <rect
            x="21"
            y="9"
            width="20"
            height="44"
            fill={
              spec.fill === "solid"
                ? "currentColor"
                : spec.fill === "hatch"
                  ? `url(#${hatchId})`
                  : "none"
            }
            stroke="currentColor"
            strokeWidth="1.2"
          />
        ) : (
          Array.from({ length: spec.count }, (_, i) => {
            // הקווים נפרשים סימטרית סביב המרכז
            const gap = 11;
            const x = 31 + (i - (spec.count - 1) / 2) * gap;
            if (spec.style === "straight")
              return (
                <line
                  key={i}
                  x1={x}
                  y1="12"
                  x2={x}
                  y2="50"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              );
            const d =
              spec.style === "wave"
                ? `M ${x} 12 q 6 6 0 12 q -6 6 0 12 q 6 6 0 14`
                : `M ${x} 12 l 6 8 l -6 8 l 6 8 l -6 8 l 6 6`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            );
          })
        )}
      </g>
    </svg>
  );
}

// ── בניית השאלות ────────────────────────────────────────────────────────────

export interface Question {
  /** 9 תאים; התא האחרון ריק וזה מה שצריך להשלים */
  grid: (FigureSpec | null)[];
  options: FigureSpec[];
  correct: number;
  explanation: string;
}

const FILL_ORDERS: Fill[][] = [
  ["empty", "hatch", "solid"],
  ["solid", "empty", "hatch"],
  ["hatch", "solid", "empty"],
  ["empty", "solid", "hatch"],
];
const ROT_SETS = [
  [0, 25, 90],
  [0, 45, 90],
  [0, -30, 60],
  [0, 60, 120],
];
const STYLE_SETS: StrokeStyle[][] = [
  ["straight", "wave", "zigzag"],
  ["wave", "zigzag", "straight"],
  ["zigzag", "straight", "wave"],
];
/** תמורות קבועות למיקום התשובה הנכונה - כדי שהמוקאפ יהיה יציב */
const PERMS = [
  [0, 1, 2, 3],
  [1, 0, 3, 2],
  [2, 3, 0, 1],
  [3, 2, 1, 0],
  [1, 2, 3, 0],
  [2, 0, 1, 3],
];

const FILL_NAME: Record<Fill, string> = {
  empty: "ריק",
  hatch: "מקווקו",
  solid: "מלא",
};
const STYLE_NAME: Record<StrokeStyle, string> = {
  straight: "קו ישר",
  wave: "קו גלי",
  zigzag: "קו שבור",
};

/** מסדר את ארבע האפשרויות לפי תמורה קבועה ומחזיר גם את מיקום הנכונה */
function arrange(
  candidates: FigureSpec[],
  permIndex: number,
): { options: FigureSpec[]; correct: number } {
  const perm = PERMS[permIndex % PERMS.length];
  const options: FigureSpec[] = [];
  perm.forEach((from, to) => {
    options[to] = candidates[from];
  });
  return { options, correct: perm.indexOf(0) };
}

function fillRotateQuestion(i: number): Question {
  const fills = FILL_ORDERS[i % FILL_ORDERS.length];
  const rots = ROT_SETS[i % ROT_SETS.length];
  const cell = (r: number, c: number): FigureSpec => ({
    kind: "rect",
    fill: fills[c],
    rotate: rots[r],
  });

  const grid: (FigureSpec | null)[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      grid.push(r === 2 && c === 2 ? null : cell(r, c));

  const answer = cell(2, 2);
  const otherFill = fills[(2 + 1) % 3];
  const otherRot = rots[(2 + 1) % 3];
  const { options, correct } = arrange(
    [
      answer,
      { kind: "rect", fill: otherFill, rotate: rots[2] },
      { kind: "rect", fill: fills[2], rotate: otherRot },
      { kind: "rect", fill: otherFill, rotate: otherRot },
    ],
    i,
  );

  return {
    grid,
    options,
    correct,
    explanation: `הטבלה בנויה כך שבכל שורה הצורה מסובבת בזווית קבועה, ובכל טור היא מקבלת מילוי אחר (${FILL_NAME[fills[0]]}, ${FILL_NAME[fills[1]]}, ${FILL_NAME[fills[2]]}). התא החסר נמצא בשורה שבה הצורה מסובבת ב-${rots[2]} מעלות ובטור שבו המילוי ${FILL_NAME[fills[2]]}, ולכן תשובה ${OPTION_LETTERS[correct]} מקיימת את שני התנאים.`,
  };
}

function countStyleQuestion(i: number): Question {
  const styles = STYLE_SETS[i % STYLE_SETS.length];
  const baseRot = [0, 0, 0][i % 3];
  const cell = (r: number, c: number): FigureSpec => ({
    kind: "strokes",
    count: c + 1,
    style: styles[r],
    rotate: baseRot,
  });

  const grid: (FigureSpec | null)[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      grid.push(r === 2 && c === 2 ? null : cell(r, c));

  const answer = cell(2, 2);
  const otherStyle = styles[(2 + 1) % 3];
  const { options, correct } = arrange(
    [
      answer,
      {
        kind: "strokes",
        count: 3,
        style: otherStyle,
        rotate: baseRot,
      },
      {
        kind: "strokes",
        count: 2,
        style: styles[2],
        rotate: baseRot,
      },
      {
        kind: "strokes",
        count: 1,
        style: otherStyle,
        rotate: baseRot,
      },
    ],
    i + 2,
  );

  return {
    grid,
    options,
    correct,
    explanation: `בכל שורה סוג הקו קבוע (${STYLE_NAME[styles[0]]}, ${STYLE_NAME[styles[1]]}, ${STYLE_NAME[styles[2]]}), ובכל טור מספר הקווים גדל באחד. התא החסר צריך להכיל שלושה קווים מסוג ${STYLE_NAME[styles[2]]}, ולכן תשובה ${OPTION_LETTERS[correct]} היא הנכונה.`,
  };
}

export function buildQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0
      ? fillRotateQuestion(Math.floor(i / 2))
      : countStyleQuestion(Math.floor(i / 2)),
  );
}

// ── תא בגריד ────────────────────────────────────────────────────────────────

function GridCell({ spec }: { spec: FigureSpec | null }) {
  return (
    <div className="aspect-square flex items-center justify-center border border-[rgba(23,28,35,0.25)]">
      {spec ? (
        <Figure spec={spec} />
      ) : (
        <span className="font-bold text-[#171c23] text-[30px] leading-none">
          ?
        </span>
      )}
    </div>
  );
}

function QuestionGrid({ question }: { question: Question }) {
  return (
    <div
      dir="ltr"
      className="grid grid-cols-3 w-full max-w-[280px] mx-auto"
    >
      {question.grid.map((spec, i) => (
        <GridCell key={i} spec={spec} />
      ))}
    </div>
  );
}

// ── כרטיס תשובה ─────────────────────────────────────────────────────────────

function OptionCard({
  spec,
  letter,
  selected,
  state,
  onClick,
}: {
  spec: FigureSpec;
  letter: string;
  selected: boolean;
  /** לאחר הבדיקה: הנכונה, הבחירה השגויה, או ניטרלי */
  state: "correct" | "wrong" | "idle";
  onClick?: () => void;
}) {
  const tone =
    state === "correct"
      ? "bg-[rgba(105,198,0,0.12)] border-[#4e9400]"
      : state === "wrong"
        ? "bg-[rgba(196,60,60,0.1)] border-[#c43c3c]"
        : selected
          ? "bg-[rgba(0,143,240,0.1)] border-[#008ff0]"
          : "bg-white border-[rgba(23,28,35,0.12)] hover:border-[rgba(0,143,240,0.35)]";

  const badgeTone =
    state === "correct"
      ? "bg-[#4e9400] text-white"
      : state === "wrong"
        ? "bg-[#c43c3c] text-white"
        : selected
          ? "bg-[#008ff0] text-white"
          : // אטום בגוון הבורדר של הכרטיס - לא שקוף
            "bg-[#e3e4e5] text-[#171c23]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={selected}
      className={`relative rounded-[10px] border p-4 flex flex-col items-center gap-2 transition-colors disabled:cursor-default ${tone}`}
    >
      <span
        className={`absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${badgeTone}`}
      >
        {letter}
      </span>
      <Figure spec={spec} size={56} />
      {state === "correct" && (
        <Check size={16} className="text-[#4e9400]" />
      )}
      {state === "wrong" && (
        <X size={16} className="text-[#c43c3c]" />
      )}
    </button>
  );
}

// ── רצועת מספרי השאלות ──────────────────────────────────────────────────────

export type AnswerState = "correct" | "wrong" | "unanswered";

export function QuestionStrip({
  states,
  current,
  onJump,
  size = "md",
  /** רצועה נגללת לצד במקום שבירה לשורות - לסרגל הניווט הצר */
  scroll,
}: {
  states: AnswerState[];
  current?: number;
  onJump?: (i: number) => void;
  size?: "sm" | "md";
  scroll?: boolean;
}) {
  const dim =
    size === "sm"
      ? "w-7 h-7 text-[12px]"
      : "w-9 h-9 text-[14px]";
  return (
    <div
      className={
        scroll
          ? "flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1"
          : `flex flex-wrap ${size === "sm" ? "gap-1.5" : "gap-2"}`
      }
    >
      {states.map((s, i) => {
        const isCurrent = i === current;
        const tone =
          s === "correct"
            ? "bg-[rgba(105,198,0,0.12)] text-[#4e9400] border-[#4e9400]"
            : s === "wrong"
              ? "bg-[rgba(196,60,60,0.1)] text-[#c43c3c] border-[#c43c3c]"
              : "bg-white text-[#171c23] border-[rgba(23,28,35,0.12)]";
        return (
          <button
            key={i}
            type="button"
            onClick={onJump ? () => onJump(i) : undefined}
            disabled={!onJump}
            aria-current={isCurrent ? "step" : undefined}
            className={`shrink-0 rounded-full border font-bold tabular-nums transition-colors disabled:cursor-default ${dim} ${tone} ${
              isCurrent
                ? "ring-2 ring-[#008ff0] ring-offset-2"
                : ""
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

/**
 * פירוט נכונות/שגויות - שני צ'יפים עם רקע מרומז.
 * `size` "sm" לכרטיס המבחן החיצוני, "md" לסיכום.
 */
export function ScoreChips({
  correct,
  wrong,
  size = "md",
}: {
  correct: number;
  wrong: number;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const text = size === "sm" ? "text-[12px]" : "text-[13px]";
  const icon = size === "sm" ? 13 : 15;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-full bg-[rgba(105,198,0,0.12)] text-[#4e9400] font-semibold ${pad} ${text}`}
      >
        <Check size={icon} className="shrink-0" />
        {correct} נכונות
      </span>
      <span
        className={`flex items-center gap-1.5 rounded-full bg-[rgba(196,60,60,0.1)] text-[#c43c3c] font-semibold ${pad} ${text}`}
      >
        <X size={icon} className="shrink-0" />
        {wrong} שגויות
      </span>
    </div>
  );
}

// ── מסך המבחן ───────────────────────────────────────────────────────────────

type Step = "instructions" | "question" | "summary";

/** גוף התוכן + פוטר דביק - אותה פריסה של שאלון התחביבים */
function TestShell({
  children,
  footer,
  footerTop,
}: {
  children: ReactNode;
  footer: ReactNode;
  /** תוכן נוסף מעל שורת הכפתורים (למשל ההסבר במובייל) */
  footerTop?: ReactNode;
}) {
  return (
    <>
      <div className="flex-1 w-full max-w-[640px] mx-auto py-6">
        {children}
      </div>
      {/* הכפתורים תמיד גלויים בתחתית המסך */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[640px] mx-auto flex flex-col gap-3">
          {footerTop}
          <div className="flex items-center justify-between gap-3">
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}

/** אישור יציאה מהמבחן - נפתח בלחיצה על ה-X */
function ExitConfirmDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      title="יציאה מהמבחן"
      footer={<ExitActions onConfirm={onConfirm} />}
    >
      <p className="text-[#171c23] text-[15px] leading-relaxed text-right">
        ההתקדמות שלכם/ן נשמרת ותוכלו/נה להמשיך מאותה נקודה
        מאוחר יותר. לצאת מהמבחן?
      </p>
    </Dialog>
  );
}

function ExitActions({ onConfirm }: { onConfirm: () => void }) {
  const close = useDialogClose();
  return (
    <div className="flex gap-3 w-full">
      <Button
        variant="ghost"
        onClick={close}
        className="flex-1 justify-center"
      >
        המשך במבחן
      </Button>
      <Button
        onClick={onConfirm}
        className="flex-1 justify-center"
      >
        יציאה
      </Button>
    </div>
  );
}

/** שניות -> mm:ss */
const fmtDuration = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

/** כרטיס נתון בסיכום - אייקון, כותרת, ערך ובר אופציונלי */
function StatCard({
  icon,
  label,
  value,
  caption,
  bar,
  barColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption?: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[#171c23] text-[14px] opacity-70">
          {label}
        </p>
        {icon}
      </div>
      <p className="font-black text-[#171c23] text-[28px] leading-none tracking-tight tabular-nums">
        {value}
      </p>
      {bar !== undefined ? (
        <ProgressBar value={bar} color={barColor} />
      ) : (
        caption && (
          <p className="text-[#171c23] text-[13px] opacity-50">
            {caption}
          </p>
        )
      )}
    </div>
  );
}

export default function DaparTestRunner({
  topicName,
  testName,
  questionCount,
  /** תוצאות מוכנות - למבחן שכבר הושלם, נכנסים ישירות לסיכום */
  initialResults,
  /** משך המבחן הקודם בשניות - למבחן שכבר הושלם */
  initialDuration,
  /** ניסיונות קודמים להצגה בסיכום */
  attempts = [],
  onExit,
}: {
  topicName: string;
  testName: string;
  questionCount: number;
  initialResults?: AnswerState[];
  initialDuration?: number;
  attempts?: { date: string; score: number }[];
  onExit: () => void;
}) {
  const [exitOpen, setExitOpen] = useState(false);
  /** חותמת התחלה למדידת משך המבחן, ומשך סופי בסיום */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | undefined>(
    initialDuration,
  );
  const questions = useMemo(
    () => buildQuestions(questionCount),
    [questionCount],
  );

  const [step, setStep] = useState<Step>(
    initialResults ? "summary" : "instructions",
  );
  const [index, setIndex] = useState(0);
  // ניווט מוגן - האינדקס לעולם לא חורג מטווח השאלות
  const goPrev = () =>
    setIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setIndex((i) => Math.min(questionCount - 1, i + 1));
  /** בתצוגת סקירה (מתוך הסיכום) התשובות חשופות ואפשר לנווט ברצועה */
  const [reviewing, setReviewing] = useState(false);
  /**
   * התשובה שנבחרה בכל שאלה. למבחן שהושלם מראש משחזרים בחירה:
   * בשאלה נכונה הבחירה היא התשובה הנכונה, בשגויה - אחת השגויות.
   */
  const [picked, setPicked] = useState<(number | null)[]>(() =>
    initialResults
      ? initialResults.map((s, i) =>
          s === "correct"
            ? questions[i].correct
            : (questions[i].correct + 1) % 4,
        )
      : Array(questionCount).fill(null),
  );
  /** אילו שאלות כבר נבדקו/הוגשו */
  const [checked, setChecked] = useState<boolean[]>(() =>
    Array(questionCount).fill(!!initialResults),
  );

  // דירוג סופי: כל מה שאינו התשובה הנכונה (כולל ללא מענה) נחשב שגוי לאחר בדיקה
  const graded: AnswerState[] = picked.map((p, i) =>
    p !== null && p === questions[i].correct
      ? "correct"
      : checked[i]
        ? "wrong"
        : "unanswered",
  );
  const correctCount = graded.filter(
    (s) => s === "correct",
  ).length;
  const wrongCount = graded.filter((s) => s === "wrong").length;

  const restart = () => {
    setPicked(Array(questionCount).fill(null));
    setChecked(Array(questionCount).fill(false));
    setReviewing(false);
    setIndex(0);
    setStartedAt(Date.now());
    setDuration(undefined);
    setStep("question");
  };

  const beginTest = () => {
    setStartedAt(Date.now());
    setStep("question");
  };

  /** פתיחת סקירת התשובות מהשאלה הראשונה */
  const reviewFromStart = () => {
    setIndex(0);
    setReviewing(true);
    setStep("question");
  };

  // מעבר לסיכום - כאן כל שאלה שלא נענתה הופכת לשגויה
  const goSummary = () => {
    setChecked(Array(questionCount).fill(true));
    setReviewing(false);
    if (startedAt)
      setDuration((Date.now() - startedAt) / 1000);
    setStep("summary");
  };

  let body: ReactNode;
  let footer: ReactNode;
  let footerTop: ReactNode;

  if (step === "instructions") {
    body = (
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-right">
          הוראות המבחן<span className="text-[#69c600]">.</span>
        </h3>
        <p className="text-[#171c23] text-[15px] leading-relaxed text-right">
          במבחן {questionCount} שאלות מסוג "השלם את הצורה". בכל
          שאלה מוצגת טבלה של 3×3 שבה חסרה הצורה בתא האחרון,
          ועליכם/ן לבחור מבין ארבע האפשרויות את הצורה שמשלימה את
          הרצף.
        </p>
        <ul className="text-[#171c23] text-[15px] leading-relaxed text-right list-disc pr-5 flex flex-col gap-1.5">
          <li>יש רק תשובה אחת נכונה לכל שאלה.</li>
          <li>אחרי בדיקת התשובה תוצג התשובה הנכונה יחד עם הסבר.</li>
          <li>
            אפשר לדלג בין השאלות ולחזור אליהן בעזרת הכפתורים
            שבתחתית המסך.
          </li>
          <li>המבחן אינו מוגבל בזמן וההתקדמות נשמרת אוטומטית.</li>
        </ul>
      </div>
    );
    footer = (
      <>
        <Button variant="outline" onClick={onExit}>
          חזרה לנושא
        </Button>
        <Button onClick={beginTest}>להתחלת המבחן</Button>
      </>
    );
  } else if (step === "summary") {
    const score = Math.round(
      (correctCount / questionCount) * 100,
    );
    body = (
      <div className="flex flex-col gap-4">
        {/* כרטיס ראשי: טבעת הציון ופעולות ההמשך */}
        <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] p-6 flex flex-col items-center gap-5">
          <div className="text-center flex flex-col gap-1">
            <p className="font-bold text-[#171c23] text-[16px]">
              {score >= 60
                ? "כל הכבוד על סיום המבחן!"
                : "סיימת את המבחן"}
            </p>
            <p className="text-[#171c23] text-[14px] opacity-70 leading-relaxed">
              {score >= 60
                ? "עברת את המבחן בהצלחה. המשיכו כך כדי להגיע לתוצאות גבוהות יותר."
                : "כדאי לעבור על ההסברים ולנסות שוב - כל ניסיון משפר את התוצאה."}
            </p>
          </div>
          <ProgressRing
            value={score}
            size={160}
            label="ציון משוקלל"
            valueClassName="text-[44px]"
            suffix=""
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={restart}>
              <RotateCcw size={15} className="shrink-0" />
              ניסיון חוזר
            </Button>
            <Button variant="ghost" onClick={reviewFromStart}>
              <Eye size={15} className="shrink-0" />
              צפה בשאלות
            </Button>
          </div>
        </div>

        {/* נתוני הביצוע */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="תשובות נכונות"
            value={String(correctCount)}
            icon={
              <CheckCircle2
                size={18}
                className="text-[#4e9400] shrink-0"
              />
            }
            bar={score}
            barColor="bg-[#4e9400]"
          />
          <StatCard
            label="תשובות שגויות"
            value={String(wrongCount)}
            icon={
              <XCircle
                size={18}
                className="text-[#c43c3c] shrink-0"
              />
            }
            bar={100 - score}
            barColor="bg-[#c43c3c]"
          />
          <StatCard
            label="זמן ביצוע"
            value={
              duration !== undefined
                ? fmtDuration(duration)
                : "—"
            }
            caption="דקות ושניות"
            icon={
              <Timer
                size={18}
                className="text-[#008ff0] shrink-0"
              />
            }
          />
        </div>

        {/* פירוט השאלות */}
        <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] p-5 flex flex-col gap-3">
          <p className="font-semibold text-[#171c23] text-[15px] text-right">
            פירוט השאלות
            <span className="font-normal opacity-50">
              {" "}
              · לחצו לצפייה בתשובה
            </span>
          </p>
          <QuestionStrip
            states={graded}
            onJump={(i) => {
              setIndex(i);
              setReviewing(true);
              setStep("question");
            }}
          />
        </div>

        {/* ביצועים קודמים */}
        {attempts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-[#171c23] text-[15px] text-right">
              ביצועים קודמים
            </p>
            <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#f5f5f7] text-[#171c23] text-[13px] font-semibold">
                <span>תאריך</span>
                <span>ציון</span>
              </div>
              {attempts.map((a) => (
                <div
                  key={a.date}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[rgba(23,28,35,0.05)] text-[14px]"
                >
                  <span className="text-[#171c23] opacity-70">
                    {a.date}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      a.score >= 60
                        ? "text-[#4e9400]"
                        : "text-[#c43c3c]"
                    }`}
                  >
                    {a.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    footer = (
      <>
        <Button variant="outline" onClick={onExit}>
          חזרה לנושא
        </Button>
        {/* <ScoreChips correct={correctCount} wrong={wrongCount} /> */}
      </>
    );
  } else {
    const q = questions[index];
    const revealed = checked[index];
    const choice = picked[index];

    const setChoice = (i: number) => {
      if (revealed) return;
      setPicked((prev) => {
        const next = [...prev];
        next[index] = i;
        return next;
      });
    };

    const submit = () =>
      setChecked((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });

    body = (
      <div className="flex flex-col gap-6">
        {/* מספר השאלה + ההוראה, מיושר לימין */}
        <div className="text-right">
          <p className="font-semibold text-[#171c23] text-[16px]">
            {index + 1}. השלם את הצורה
          </p>
          <p className="text-[#171c23] text-[13px] opacity-50 mt-0.5">
            יש רק תשובה אחת נכונה
          </p>
        </div>

        <QuestionGrid question={q} />

        <div
          dir="rtl"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {q.options.map((spec, i) => (
            <OptionCard
              key={i}
              spec={spec}
              letter={OPTION_LETTERS[i]}
              selected={choice === i}
              state={
                !revealed
                  ? "idle"
                  : i === q.correct
                    ? "correct"
                    : choice === i
                      ? "wrong"
                      : "idle"
              }
              onClick={revealed ? undefined : () => setChoice(i)}
            />
          ))}
        </div>

        {/* הסבר - בדסקטופ מתחת לתשובות (במובייל הוא בפוטר) */}
        {revealed && (
          <div className="hidden md:flex flex-col gap-2 border-t border-[rgba(23,28,35,0.08)] pt-5">
            <p className="font-semibold text-[#171c23] text-[16px] text-right">
              הסבר
            </p>
            <p className="text-[#171c23] text-[15px] leading-relaxed text-right">
              {q.explanation}
            </p>
          </div>
        )}
      </div>
    );

    // ההסבר במובייל - בתוך מיכל הכפתורים כדי שלא צריך לגלול
    if (revealed)
      footerTop = (
        <div className="md:hidden flex flex-col gap-1 max-h-[34vh] overflow-y-auto border-b border-[rgba(23,28,35,0.08)] pb-3">
          <p className="font-semibold text-[#171c23] text-[15px] text-right">
            הסבר
          </p>
          <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
            {q.explanation}
          </p>
        </div>
      );

    if (reviewing) {
      footer = (
        <>
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={index === 0}
          >
            <ChevronRight size={15} />
            הקודמת
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setReviewing(false);
              setStep("summary");
            }}
          >
            חזרה לסיכום
          </Button>
          <Button
            variant="outline"
            onClick={goNext}
            disabled={index === questionCount - 1}
          >
            הבאה
            <ChevronLeft size={15} />
          </Button>
        </>
      );
    } else {
      footer = (
        <>
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={index === 0}
          >
            <ChevronRight size={15} />
            לשאלה הקודמת
          </Button>

          {!revealed && choice !== null ? (
            <Button onClick={submit}>בדיקה</Button>
          ) : index === questionCount - 1 ? (
            <Button onClick={goSummary}>לסיכום השאלון</Button>
          ) : (
            <Button onClick={goNext}>
              {choice === null && !revealed ? "דילוג" : "לשאלה הבאה"}
              <ChevronLeft size={15} />
            </Button>
          )}
        </>
      );
    }
  }

  return (
    // ה-section נמתח עד תחתית הדף, כך שהפוטר הדביק תמיד בתחתית המסך
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      {/*
        סרגל עליון קבוע: כותרת ממורכזת וכפתור יציאה בצד שמאל.
        בסקירת התשובות מתווספת רצועת השאלות - בדסקטופ לצד הכותרת,
        ובמובייל בשורה שנייה נגללת לצד, כך שהניווט תמיד בהישג יד.
      */}
      <div className="sticky top-[64px] md:top-[98px] z-40 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 bg-white border-b border-[rgba(23,28,35,0.08)]">
        <div className="relative h-14 flex items-center justify-center gap-5">
          <p className="text-[#171c23] text-[15px] font-semibold text-center px-10 shrink-0">
            {topicName} · {testName}
          </p>
          {reviewing && (
            <div className="hidden md:block min-w-0">
              <QuestionStrip
                states={graded}
                current={index}
                onJump={(i) => setIndex(i)}
                size="sm"
                scroll
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            aria-label="יציאה מהמבחן"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#171c23] opacity-60 hover:opacity-100 hover:bg-[rgba(23,28,35,0.06)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {reviewing && (
          <div className="md:hidden pb-2 -mt-1">
            <QuestionStrip
              states={graded}
              current={index}
              onJump={(i) => setIndex(i)}
              size="sm"
              scroll
            />
          </div>
        )}
      </div>

      <TestShell footer={footer} footerTop={footerTop}>
        {body}
      </TestShell>

      {exitOpen && (
        <ExitConfirmDialog
          onClose={() => setExitOpen(false)}
          onConfirm={onExit}
        />
      )}
    </section>
  );
}
