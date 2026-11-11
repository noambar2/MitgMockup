import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  /** מספר בפיקסלים, או מחרוזת CSS (למשל "70%") לתצוגה גמישה */
  size?: number | string;
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

function GridCell({
  spec,
  large,
}: {
  spec: FigureSpec | null;
  large?: boolean;
}) {
  return (
    <div className="aspect-square flex items-center justify-center border border-[rgba(23,28,35,0.25)]">
      {spec ? (
        <Figure spec={spec} size={large ? "80%" : 62} />
      ) : (
        <span
          className={`font-bold text-[#171c23] leading-none ${
            large ? "text-[clamp(30px,8vmin,64px)]" : "text-[30px]"
          }`}
        >
          ?
        </span>
      )}
    </div>
  );
}

function QuestionGrid({
  question,
  large,
}: {
  question: Question;
  large?: boolean;
}) {
  return (
    <div
      dir="ltr"
      className={`grid grid-cols-3 w-full mx-auto bg-white ${
        large ? "max-w-[min(88vw,78vh)]" : "max-w-[280px]"
      }`}
    >
      {question.grid.map((spec, i) => (
        <GridCell key={i} spec={spec} large={large} />
      ))}
    </div>
  );
}

/**
 * תצוגת מסך מלא של תמונת השאלה.
 * נסגרת בלחיצה על ה-X, על Esc או על הרקע.
 */
function ImageLightbox({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    // נועלים את גלילת הדף מאחורי התמונה
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="תמונת השאלה במסך מלא"
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-[rgba(18,23,30,0.85)] backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="סגירת התמונה"
        className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>
      {/* לחיצה על התמונה עצמה לא סוגרת - רק הרקע */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex justify-center"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** תמונת השאלה - לחיצה פותחת אותה במסך מלא */
function ZoomableQuestionGrid({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-native-enter
        aria-label="הגדלת התמונה למסך מלא"
        className="group relative block w-full max-w-[280px] mx-auto cursor-zoom-in rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008ff0] focus-visible:ring-offset-4"
      >
        <QuestionGrid question={question} />
      </button>
      {open && (
        <ImageLightbox onClose={() => setOpen(false)}>
          <QuestionGrid question={question} large />
        </ImageLightbox>
      )}
    </>
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

/** ארבע האפשרויות של שאלה, עם מצב הבדיקה */
function OptionsGrid({
  question,
  choice,
  revealed,
  onPick,
}: {
  question: Question;
  choice: number | null;
  revealed: boolean;
  onPick: (i: number) => void;
}) {
  return (
    <div dir="rtl" className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {question.options.map((spec, i) => (
        <OptionCard
          key={i}
          spec={spec}
          letter={OPTION_LETTERS[i]}
          selected={choice === i}
          state={
            !revealed
              ? "idle"
              : i === question.correct
                ? "correct"
                : choice === i
                  ? "wrong"
                  : "idle"
          }
          onClick={revealed ? undefined : () => onPick(i)}
        />
      ))}
    </div>
  );
}

/** מקשי הבחירה: האות בעברית, אותו מקש בפריסה אנגלית (T C D S), או 1-4 */
const OPTION_KEY_CODES = ["KeyT", "KeyC", "KeyD", "KeyS"];
function optionIndexFromKey(e: KeyboardEvent): number {
  const byLetter = OPTION_LETTERS.indexOf(e.key);
  if (byLetter >= 0) return byLetter;
  const byCode = OPTION_KEY_CODES.indexOf(e.code);
  if (byCode >= 0) return byCode;
  const digit = Number(e.key);
  return digit >= 1 && digit <= 4 ? digit - 1 : -1;
}

/** שאלת הדוגמה שבהוראות המבחן המתוזמן */
const SAMPLE_QUESTION = countStyleQuestion(1);

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
      <div
        data-test-keys
        className="flex-1 w-full max-w-[640px] mx-auto py-6"
      >
        {children}
      </div>
      {/* הכפתורים תמיד גלויים בתחתית המסך */}
      <div
        data-test-keys
        className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
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

/** טיימר לשאלה - ספירה לאחור עם פס התקדמות, אדום ב-10 השניות האחרונות */
function QuestionTimer({
  left,
  total,
  timedOut,
}: {
  left: number;
  total: number;
  timedOut: boolean;
}) {
  const urgent = left <= 10;
  const color = urgent ? "#c43c3c" : "#008ff0";
  return (
    <div
      className="shrink-0 flex flex-col items-stretch gap-1.5 min-w-[96px]"
      role="timer"
      aria-live={urgent ? "assertive" : "off"}
      aria-label={
        timedOut ? "הזמן נגמר" : `נותרו ${left} שניות`
      }
    >
      <span
        className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-bold tabular-nums transition-colors"
        style={{
          color,
          background: urgent
            ? "rgba(196,60,60,0.1)"
            : "rgba(0,143,240,0.1)",
        }}
      >
        <Timer size={15} className="shrink-0" />
        {timedOut ? "הזמן נגמר" : fmtDuration(left)}
      </span>
      <div className="h-1 w-full rounded-full bg-[rgba(23,28,35,0.08)] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${(left / total) * 100}%`,
            background: color,
          }}
        />
      </div>
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
      <p className="stat-number text-[#171c23] text-[28px] leading-none tracking-tight tabular-nums">
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
  secondsPerQuestion,
  onExit,
}: {
  topicName: string;
  testName: string;
  questionCount: number;
  initialResults?: AnswerState[];
  initialDuration?: number;
  attempts?: { date: string; score: number }[];
  /** מגבלת זמן לכל שאלה בשניות - בסיומה השאלה ננעלת ונבדקת */
  secondsPerQuestion?: number;
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

  /** הזמן שנותר בכל שאלה - נשמר כשעוברים בין שאלות */
  const [remaining, setRemaining] = useState<number[]>(() =>
    Array(questionCount).fill(secondsPerQuestion ?? 0),
  );
  const timerActive =
    !!secondsPerQuestion &&
    step === "question" &&
    !reviewing &&
    !checked[index];

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        const next = [...prev];
        next[index] = Math.max(0, next[index] - 1);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive, index]);


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
    setRemaining(
      Array(questionCount).fill(secondsPerQuestion ?? 0),
    );
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

  const timed = !!secondsPerQuestion;
  const isLast = index === questionCount - 1;

  /**
   * מבחן מתוזמן: נועלים את התשובה (בלי לחשוף אותה) ועוברים הלאה.
   * אין חזרה אחורה, והתשובות נחשפות רק בסיכום.
   */
  const advance = () => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    if (isLast) goSummary();
    else goNext();
  };

  // הזמן נגמר - עוברים לשאלה הבאה (שאלה ללא מענה נחשבת שגויה)
  useEffect(() => {
    if (timerActive && remaining[index] === 0) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, remaining, index]);

  /** שאלת הדוגמה בהוראות - שם בלבד אפשר לבדוק תשובה במבחן המתוזמן */
  const [sampleChoice, setSampleChoice] = useState<number | null>(
    null,
  );
  const [sampleChecked, setSampleChecked] = useState(false);

  /** פעולות המקלדת של המסך הנוכחי - מתעדכנות בכל רינדור */
  const keysRef = useRef<{
    select?: (i: number) => void;
    enter?: () => void;
  }>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // לא בזמן דיאלוג או תמונה במסך מלא
      if (document.querySelector('[aria-modal="true"]')) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]"))
        return;
      const keys = keysRef.current;

      if (e.key === "Enter") {
        // Enter על כפתור מחוץ לאזור המבחן (למשל X) - פעולה רגילה
        const inScope =
          !t ||
          t === document.body ||
          (!!t.closest("[data-test-keys]") &&
            !t.closest("[data-native-enter]"));
        if (!inScope || !keys.enter) return;
        e.preventDefault();
        keys.enter();
        return;
      }

      const i = optionIndexFromKey(e);
      if (i < 0 || !keys.select) return;
      e.preventDefault();
      keys.select(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  keysRef.current = {};

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
          {timed ? (
            <>
              <li>
                לכל שאלה {secondsPerQuestion} שניות. כשהזמן נגמר
                עוברים אוטומטית לשאלה הבאה, ושאלה שלא נענתה נחשבת
                שגויה.
              </li>
              <li>אי אפשר לדלג על שאלה או לחזור לשאלה קודמת.</li>
              <li>
                התשובות וההסברים מוצגים רק בסיום המבחן. לפני
                שמתחילים אפשר לתרגל על שאלת הדוגמה.
              </li>
            </>
          ) : (
            <>
              <li>
                אחרי בדיקת התשובה תוצג התשובה הנכונה יחד עם הסבר.
              </li>
              <li>
                אפשר לדלג בין השאלות ולחזור אליהן בעזרת הכפתורים
                שבתחתית המסך.
              </li>
              <li>
                המבחן אינו מוגבל בזמן וההתקדמות נשמרת אוטומטית.
              </li>
            </>
          )}
          <li>
            אפשר לבחור תשובה במקלדת (א-ד או 1-4) ולהמשיך עם Enter.
          </li>
        </ul>

        {timed && (
          <div className="flex flex-col gap-5 border-t border-[rgba(23,28,35,0.08)] pt-5 mt-2">
            <div className="text-right">
              <p className="font-semibold text-[#171c23] text-[16px]">
                שאלת דוגמה
              </p>
              <p className="text-[#171c23] text-[13px] opacity-50 mt-0.5">
                ללא הגבלת זמן - בחרו תשובה ובדקו אותה. לחיצה על
                התמונה מגדילה אותה למסך מלא
              </p>
            </div>
            <ZoomableQuestionGrid question={SAMPLE_QUESTION} />
            <OptionsGrid
              question={SAMPLE_QUESTION}
              choice={sampleChoice}
              revealed={sampleChecked}
              onPick={setSampleChoice}
            />
            {sampleChecked ? (
              <div className="flex flex-col gap-2 bg-[#f5f5f7] rounded-[10px] p-4">
                <p
                  className={`font-semibold text-[15px] text-right ${
                    sampleChoice === SAMPLE_QUESTION.correct
                      ? "text-[#4e9400]"
                      : "text-[#c43c3c]"
                  }`}
                >
                  {sampleChoice === SAMPLE_QUESTION.correct
                    ? "תשובה נכונה!"
                    : `התשובה הנכונה היא ${OPTION_LETTERS[SAMPLE_QUESTION.correct]}`}
                </p>
                <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
                  {SAMPLE_QUESTION.explanation}
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSampleChecked(true)}
                disabled={sampleChoice === null}
                className="self-center"
              >
                בדיקת התשובה
              </Button>
            )}
          </div>
        )}
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
    keysRef.current = timed
      ? {
          select: (i) => {
            if (!sampleChecked) setSampleChoice(i);
          },
          enter: () => {
            if (sampleChoice !== null && !sampleChecked)
              setSampleChecked(true);
            else beginTest();
          },
        }
      : { enter: beginTest };
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
        {/* מספר השאלה + ההוראה, מיושר לימין; הטיימר בצד שמאל */}
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <p className="font-semibold text-[#171c23] text-[16px]">
              {index + 1}. השלם את הצורה
            </p>
            <p className="text-[#171c23] text-[13px] opacity-50 mt-0.5">
              יש רק תשובה אחת נכונה
            </p>
          </div>
          {secondsPerQuestion && !reviewing && (
            <QuestionTimer
              left={remaining[index]}
              total={secondsPerQuestion}
              timedOut={remaining[index] === 0}
            />
          )}
        </div>

        <ZoomableQuestionGrid question={q} />

        <OptionsGrid
          question={q}
          choice={choice}
          revealed={revealed}
          onPick={setChoice}
        />

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
      keysRef.current = { enter: goNext };
    } else if (timed) {
      // מבחן מתוזמן: רק קדימה, ורק אחרי שנבחרה תשובה
      footer = (
        <>
          <span className="text-[#171c23] text-[14px] opacity-60 tabular-nums">
            שאלה {index + 1} מתוך {questionCount}
          </span>
          <Button onClick={advance} disabled={choice === null}>
            {isLast ? "לסיכום השאלון" : "לשאלה הבאה"}
            {!isLast && <ChevronLeft size={15} />}
          </Button>
        </>
      );
      keysRef.current = {
        select: setChoice,
        enter: () => {
          if (choice !== null) advance();
        },
      };
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
      // Enter מבצע את הפעולה הראשית: בדיקה, ואחריה מעבר לשאלה הבאה
      keysRef.current = {
        select: setChoice,
        enter: () => {
          if (!revealed && choice !== null) submit();
          else if (isLast) goSummary();
          else goNext();
        },
      };
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
