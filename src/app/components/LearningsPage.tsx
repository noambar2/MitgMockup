import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  BookOpen,
  Play,
  Layers,
  FileText,
} from "lucide-react";
import {
  AdBanner,
  Button,
  StatusBadge,
  ProgressBar,
} from "./primitives";
import { Breadcrumbs } from "./TasksAppointmentsPage";
import { GLASS_CARD } from "./ui/utils";
import DaparTestRunner, {
  type AnswerState,
} from "./DaparTest";

// ── Data ────────────────────────────────────────────────────────────────────

type LearningStatus = "בתהליך" | "טרם התחיל" | "הושלם";

interface Learning {
  id: string;
  name: string;
  description: string;
  status: LearningStatus;
  /** כמה מבחנים יש בלומדה וכמה מהם הושלמו */
  tests: number;
  testsDone: number;
  /** אחוז ההשלמה של הלומדה */
  progress: number;
}

const pct = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100);

// ── לומדת דפ"ר ──────────────────────────────────────────────────────────────

const DAPAR_LANGUAGES = [
  { id: "he", label: "עברית | Hebrew" },
  { id: "en", label: "אנגלית | English" },
  { id: "ru", label: "רוסית | Russian" },
  { id: "ar", label: "ערבית | Arabic" },
];

const TESTS_PER_TOPIC = 4;
const QUESTIONS_PER_TEST = 12;
/** כמה תשובות נכונות בכל מבחן שהושלם - קבוע כדי שהמוקאפ יציב */
const CORRECT_BY_INDEX = [10, 8, 11, 9];
/** משכי מבחן קבועים (שניות) וניסיונות קודמים - נתוני מוקאפ יציבים */
const DURATION_BY_INDEX = [765, 892, 704, 838];
const PAST_ATTEMPTS: TestAttempt[][] = [
  [
    { date: "12 באוק׳ 2026", score: 85 },
    { date: "05 באוק׳ 2026", score: 62 },
    { date: "28 בספט׳ 2026", score: 74 },
  ],
  [
    { date: "09 באוק׳ 2026", score: 58 },
    { date: "30 בספט׳ 2026", score: 67 },
  ],
  [{ date: "02 באוק׳ 2026", score: 91 }],
  [],
];

export interface TestAttempt {
  date: string;
  score: number;
}

interface DaparTest {
  id: string;
  name: string;
  questions: number;
  /** כמה שאלות נענו עד כה */
  answered: number;
  correct: number;
  wrong: number;
  /** משך המבחן האחרון בשניות (למבחן שהושלם) */
  duration: number;
  /** ניסיונות קודמים - מהחדש לישן */
  attempts: TestAttempt[];
}

/** פורש את התשובות השגויות של מבחן שהושלם על פני השאלות, לתצוגת הסיכום */
function resultsFor(t: DaparTest): AnswerState[] {
  let left = t.wrong;
  return Array.from({ length: t.questions }, (_, i) => {
    if (left > 0 && i % 3 === 1) {
      left -= 1;
      return "wrong" as const;
    }
    return "correct" as const;
  }).map((v, i) =>
    // אם נשארו שגויות אחרי הפריסה, מסמנים אותן מהסוף
    left > 0 && i >= t.questions - left ? "wrong" : v,
  );
}

const testStatus = (t: DaparTest): LearningStatus =>
  t.answered === t.questions
    ? "הושלם"
    : t.answered > 0
      ? "בתהליך"
      : "טרם התחיל";

/**
 * בונה את מבחני הנושא: `completed` מבחנים שהושלמו,
 * ואחריהם מבחן שנמצא באמצע אם `inProgress` גדול מאפס.
 */
function buildTests(
  topicId: string,
  completed: number,
  inProgress: number,
): DaparTest[] {
  return Array.from({ length: TESTS_PER_TOPIC }, (_, i) => {
    const n = i + 1;
    const done = n <= completed;
    const current = n === completed + 1 && inProgress > 0;
    const correct = done
      ? CORRECT_BY_INDEX[i % CORRECT_BY_INDEX.length]
      : 0;
    return {
      id: `${topicId}-${n}`,
      name: `מבחן ${n}`,
      questions: QUESTIONS_PER_TEST,
      answered: done
        ? QUESTIONS_PER_TEST
        : current
          ? inProgress
          : 0,
      correct,
      wrong: done ? QUESTIONS_PER_TEST - correct : 0,
      duration:
        DURATION_BY_INDEX[i % DURATION_BY_INDEX.length],
      attempts: done
        ? PAST_ATTEMPTS[i % PAST_ATTEMPTS.length]
        : [],
    };
  });
}

interface DaparTopic {
  id: string;
  name: string;
  tests: DaparTest[];
}

const daparTopics: DaparTopic[] = [
  {
    id: "instructions",
    name: "הבנת הוראות",
    tests: buildTests("instructions", 0, 0),
  },
  {
    id: "shape",
    name: "חשיבה צורנית",
    tests: buildTests("shape", 2, 8),
  },
  {
    id: "verbal-analogies",
    name: "אנלוגיות מילוליות",
    tests: buildTests("verbal-analogies", 2, 0),
  },
  {
    id: "shape-analogies",
    name: "אנלוגיות צורניות",
    tests: buildTests("shape-analogies", 2, 5),
  },
  {
    id: "quantitative",
    name: "חשיבה כמותית",
    tests: buildTests("quantitative", 2, 0),
  },
  {
    id: "full",
    name: "מבחנים מלאים",
    tests: buildTests("full", 0, 0),
  },
];

const topicDone = (t: DaparTopic) =>
  t.tests.filter((x) => testStatus(x) === "הושלם").length;
const topicProgress = (t: DaparTopic) =>
  pct(topicDone(t), t.tests.length);

// נתוני לומדת הדפ"ר נגזרים מהנושאים - כך המספרים תמיד עקביים
const daparTests = daparTopics.reduce(
  (n, t) => n + t.tests.length,
  0,
);
const daparDone = daparTopics.reduce(
  (n, t) => n + topicDone(t),
  0,
);
const daparProgress = pct(daparDone, daparTests);

const learnings: Learning[] = [
  {
    id: "dapar",
    name: 'לומדת דפ"ר',
    description:
      'לומדה זו נועדה להכין אתכם/ן לקראת מבחן הדפ"ר בצו הראשון. מוזמנים/ות להיכנס ולהתחיל לתרגל, בהצלחה!',
    status: "בתהליך",
    tests: daparTests,
    testsDone: daparDone,
    progress: daparProgress,
  },
  {
    id: "hebrew",
    name: "לומדת עברית",
    description:
      "לומדה זו נועדה לסייע לכם/ן להתכונן למבחן העברית ולשפר את סימול העברית. מוזמנים/ות להיכנס ולהתחיל לתרגל, בהצלחה!",
    status: "טרם התחיל",
    tests: 8,
    testsDone: 0,
    progress: 0,
  },
  {
    id: "maah",
    name: 'לומדת הכנה ליום המא"ה',
    description:
      'לומדה זו נועדה להכין אתכם/ן לקראת יום המא"ה - מיון, איתור והתאמה. מוזמנים/ות להיכנס ולהכיר את המבדקים, בהצלחה!',
    status: "הושלם",
    tests: 6,
    testsDone: 6,
    progress: 100,
  },
];

/** אחוז ההשלמה הכללי - לפי יחס המבחנים שהושלמו בכל הלומדות */
const totalTests = learnings.reduce((sum, l) => sum + l.tests, 0);
const totalTestsDone = learnings.reduce(
  (sum, l) => sum + l.testsDone,
  0,
);
const overallProgress = pct(totalTestsDone, totalTests);

// ── Status badge ─────────────────────────────────────────────────────────────

function LearningStatusBadge({
  status,
}: {
  status: LearningStatus;
}) {
  // "בתהליך" הוא מצב מותג ולכן מקבל גוון מותג, השאר משתמשים בוריאנטים הרגילים
  if (status === "בתהליך")
    return (
      <span className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap bg-[rgba(0,143,240,0.1)] text-[#008ff0]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#008ff0]" />
        {status}
      </span>
    );
  return (
    <StatusBadge
      variant={status === "הושלם" ? "success" : "neutral"}
      dot
    >
      {status}
    </StatusBadge>
  );
}

// ── Page head (title + progress on one row in desktop) ───────────────────────

function LearningIcon({
  tone = "brand",
}: {
  tone?: "brand" | "success";
}) {
  return (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
        tone === "success"
          ? "bg-[rgba(105,198,0,0.12)]"
          : "bg-[rgba(0,143,240,0.1)]"
      }`}
    >
      <BookOpen
        size={22}
        className={
          tone === "success"
            ? "text-[#4e9400]"
            : "text-[#008ff0]"
        }
      />
    </div>
  );
}

/** לוח ההתקדמות - קומפקטי, בשורה אחת */
function ProgressPanel({
  meta,
  value,
}: {
  meta: ReactNode;
  value: number;
}) {
  return (
    <div
      className={`${GLASS_CARD} rounded-[10px] px-4 py-3 flex items-center gap-3.5 w-full`}
    >
      <span className="font-black text-[#008ff0] text-[26px] leading-none tracking-tight tabular-nums shrink-0">
        {value}%
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-right">
        {meta}
        <ProgressBar value={value} />
      </div>
    </div>
  );
}

/**
 * שורת הכותרת. בדסקטופ לוח ההתקדמות יוצא מזרימת המסמך (absolute) ויושב
 * בקצה שמאל, כך שהוא לא משפיע על המרווחים של הכותרת ושל מה שמתחתיה.
 */
function PageHead({
  icon,
  title,
  subtitle,
  panel,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  panel?: ReactNode;
}) {
  return (
    <div
      className={`relative mb-6 ${panel ? "md:min-h-[68px]" : ""}`}
    >
      <div
        className={`flex items-center gap-3 min-w-0 ${panel ? "md:min-h-[68px] md:pl-[380px]" : ""}`}
      >
        {icon}
        <div className="min-w-0 text-right">
          <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight">
            {title}
            <span className="text-[#69c600]">.</span>
          </h2>
          {subtitle && (
            <p className="text-[#171c23] text-[14px] opacity-50 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {panel && (
        <div className="mt-4 md:mt-0 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-[340px]">
          {panel}
        </div>
      )}
    </div>
  );
}

// ── כרטיס אחיד ──────────────────────────────────────────────────────────────

const CARD_CLASS =
  "group bg-white rounded-[10px] p-5 flex flex-col gap-3 text-right w-full transition-all duration-200 border border-transparent hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)] hover:border-[rgba(0,143,240,0.2)]";

/** קישור פעולה בתחתית הכרטיס - טקסט מותג עם חץ שזז בריחוף */
function CardAction({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold">
      {label}
      <ChevronLeft
        size={16}
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      />
    </span>
  );
}

/**
 * כרטיס אחיד ללומדה, לנושא ולמבחן - אותה אנטומיה בכל הרמות:
 * אייקון + כותרת + תג מצב, טקסט הסבר, בר התקדמות, וקישורי פעולה.
 * פעולה אחת הופכת את כל הכרטיס ללחיץ; שתיים ומעלה מוצגות כקישורים נפרדים.
 */
function EntityCard({
  icon,
  title,
  badge,
  description,
  stat,
  meta,
  percent,
  actions,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  description?: ReactNode;
  /** ערך מודגש (למשל ציון) - מוצג בלי העמעום של התיאור */
  stat?: ReactNode;
  /** הטקסט שמימין לאחוז, מעל בר ההתקדמות */
  meta?: ReactNode;
  percent?: number;
  actions: { label: string; onClick: () => void }[];
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-[rgba(0,143,240,0.1)] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="font-bold text-[#171c23] text-[18px] truncate">
            {title}
          </h3>
        </div>
        {badge}
      </div>

      {(description || stat) && (
        <div className="w-full flex items-start justify-between gap-3">
          {description && (
            <div className="text-[#171c23] text-[14px] leading-relaxed opacity-70 min-w-0">
              {description}
            </div>
          )}
          {stat && <div className="shrink-0">{stat}</div>}
        </div>
      )}

      {percent !== undefined && (
        <div className="w-full flex flex-col gap-1.5 mt-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#171c23] text-[13px] opacity-50">
              {meta}
            </span>
            <span className="font-bold text-[#008ff0] text-[13px] tabular-nums">
              {percent}%
            </span>
          </div>
          <ProgressBar value={percent} />
        </div>
      )}
    </>
  );

  // פעולה אחת - כל הכרטיס לחיץ
  if (actions.length === 1)
    return (
      <button
        onClick={actions[0].onClick}
        className={`${CARD_CLASS} cursor-pointer`}
      >
        {content}
        <CardAction label={actions[0].label} />
      </button>
    );

  return (
    <div className={CARD_CLASS}>
      {content}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="cursor-pointer"
          >
            <CardAction label={a.label} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Learning card ────────────────────────────────────────────────────────────

function LearningCard({
  learning,
  onClick,
}: {
  learning: Learning;
  onClick: () => void;
}) {
  return (
    <EntityCard
      icon={<BookOpen size={18} className="text-[#008ff0]" />}
      title={learning.name}
      badge={<LearningStatusBadge status={learning.status} />}
      description={learning.description}
      meta={`${learning.testsDone} מתוך ${learning.tests} מבחנים`}
      percent={learning.progress}
      actions={[
        {
          label:
            learning.status === "טרם התחיל"
              ? "להתחלת הלומדה"
              : learning.status === "הושלם"
                ? "לצפייה בלומדה"
                : "להמשך הלומדה",
          onClick,
        },
      ]}
    />
  );
}

// ── Intro (video) ────────────────────────────────────────────────────────────

/** מסך הפתיחה: סרטון הסבר וכפתור מעבר לרשימת הלומדות */
function LearningsIntro({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className="md:max-w-[760px] md:mx-auto">
        <div className="text-right mb-1">
          <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
            לומדות<span className="text-[#69c600]">.</span>
          </h2>
        </div>
        <p className="text-[#171c23] text-[14px] opacity-50 text-right mb-6">
          לפני שמתחילים - כדאי לצפות בסרטון הקצר שמסביר איך
          הלומדות עובדות ואיך להפיק מהן את המרב
        </p>

        <div className="bg-white rounded-[10px] p-5 flex flex-col gap-5">
          {/* נגן הסרטון */}
          <div
            className="relative w-full aspect-video rounded-[10px] overflow-hidden bg-[#122736]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 78% 22%, rgba(var(--brand-rgb, 0,143,240), 0.55), transparent 55%), radial-gradient(circle at 18% 82%, rgba(105,198,0,0.35), transparent 55%)",
            }}
          >
            <button
              type="button"
              aria-label="הפעלת סרטון ההסבר"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 group"
            >
              <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-[0_8px_32px_rgba(18,39,54,0.24)] transition-transform duration-200 group-hover:scale-105">
                <Play
                  size={26}
                  className="text-[#008ff0] mr-1"
                  fill="currentColor"
                />
              </span>
              <span className="text-white text-[15px] font-semibold">
                איך עובדות הלומדות · 2:14
              </span>
            </button>
          </div>

          <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
            הלומדות באתר מתגייסים נועדו לעזור לכם/ן להגיע מוכנים
            לצו הראשון וליום המא"ה. כל לומדה בנויה מיחידות תרגול
            וממבחנים קצרים, ואפשר לעצור ולחזור אליה בכל שלב -
            ההתקדמות נשמרת אוטומטית.
          </p>

          <div className="flex justify-start">
            <Button onClick={onContinue}>
              מעבר ללומדות
              <ChevronLeft size={16} />
            </Button>
          </div>
        </div>

        <AdBanner />
      </div>
    </section>
  );
}

// ── לומדת דפ"ר ──────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  onOpen,
}: {
  topic: DaparTopic;
  onOpen: () => void;
}) {
  const done = topicDone(topic);
  const total = topic.tests.length;
  return (
    <EntityCard
      icon={<Layers size={18} className="text-[#008ff0]" />}
      title={topic.name}
      badge={
        <LearningStatusBadge
          status={
            done === total
              ? "הושלם"
              : done > 0
                ? "בתהליך"
                : "טרם התחיל"
          }
        />
      }
      meta={`${done} מתוך ${total} מבחנים`}
      percent={topicProgress(topic)}
      actions={[
        {
          label:
            done === 0
              ? "להתחלת התרגול"
              : done === total
                ? "לצפייה במבחנים"
                : "להמשך התרגול",
          onClick: onOpen,
        },
      ]}
    />
  );
}

function DaparLearningPage({
  onBackToList,
  onOpenTopic,
}: {
  onBackToList: () => void;
  onOpenTopic: (id: string) => void;
}) {
  const [language, setLanguage] = useState(DAPAR_LANGUAGES[0].id);

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <Breadcrumbs
        items={[
          { label: "לומדות", onClick: onBackToList },
          { label: 'לומדת דפ"ר' },
        ]}
      />

      <PageHead
        icon={<LearningIcon tone="success" />}
        title='לומדת דפ"ר'
        panel={
          <ProgressPanel
            value={daparProgress}
            meta={
              <div className="flex items-center gap-2 min-w-0">
                <LearningStatusBadge status="בתהליך" />
                <p className="text-[#171c23] text-[13px] opacity-50 truncate">
                  {daparDone} מתוך {daparTests} מבחנים
                </p>
              </div>
            }
          />
        }
      />

      {/* בחירת שפה */}
      <p className="font-semibold text-[#171c23] text-[15px] text-right mb-2">
        שפת הלומדה
      </p>
      <div
        role="radiogroup"
        aria-label="שפת הלומדה"
        className="flex flex-wrap items-center gap-2 mb-6"
      >
        {DAPAR_LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            role="radio"
            aria-checked={language === lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              language === lang.id
                ? "bg-[#008ff0] text-white"
                : "bg-white text-[#171c23] opacity-70 hover:opacity-100"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <p className="font-semibold text-[#171c23] text-[15px] text-right mb-3">
        בחרו נושא לתרגול
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {daparTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onOpen={() => onOpenTopic(topic.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ── עמוד נושא ───────────────────────────────────────────────────────────────

function PendingTestCard({
  test,
  onOpen,
}: {
  test: DaparTest;
  onOpen: () => void;
}) {
  const status = testStatus(test);
  // ללא תיאור - כמות השאלות שנענו מוצגת ממילא מעל בר ההתקדמות
  return (
    <EntityCard
      icon={<FileText size={18} className="text-[#008ff0]" />}
      title={test.name}
      badge={<LearningStatusBadge status={status} />}
      meta={`${test.answered} מתוך ${test.questions} שאלות`}
      percent={pct(test.answered, test.questions)}
      actions={[
        {
          label:
            status === "בתהליך"
              ? "להמשך המבחן"
              : "להתחלת המבחן",
          onClick: onOpen,
        },
      ]}
    />
  );
}

/** מבחן שהושלם - תצוגה מצומצמת; הניסיון החוזר נמצא בתוך הסיכום */
function CompletedTestCard({
  test,
  onSummary,
}: {
  test: DaparTest;
  onSummary: () => void;
}) {
  return (
    <EntityCard
      icon={<FileText size={18} className="text-[#008ff0]" />}
      title={test.name}
      badge={<LearningStatusBadge status="הושלם" />}
      description={`ענית נכון על ${test.correct}/${test.questions} שאלות`}
      stat={
        <span className="flex flex-col items-end leading-none">
          <span className="text-[#171c23] text-[12px] opacity-50 whitespace-nowrap">
            ציון משוקלל
          </span>
          <span className="font-black text-[#008ff0] text-[26px] tracking-tight tabular-nums mt-1">
            {pct(test.correct, test.questions)}
          </span>
        </span>
      }
      actions={[
        { label: "סיכום השאלון", onClick: onSummary },
      ]}
    />
  );
}

function TopicPage({
  topic,
  onBackToList,
  onBackToDapar,
  onOpenTest,
}: {
  topic: DaparTopic;
  onBackToList: () => void;
  onBackToDapar: () => void;
  onOpenTest: (testId: string, mode: "run" | "summary") => void;
}) {
  const done = topic.tests.filter(
    (t) => testStatus(t) === "הושלם",
  );
  const pending = topic.tests.filter(
    (t) => testStatus(t) !== "הושלם",
  );

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      {/* הנתיב מראה שהנושא נמצא בתוך לומדת הדפ"ר, ולכן הכותרת היא שם הנושא */}
      <Breadcrumbs
        items={[
          { label: "לומדות", onClick: onBackToList },
          { label: 'לומדת דפ"ר', onClick: onBackToDapar },
          { label: topic.name },
        ]}
      />

      <PageHead
        icon={<LearningIcon tone="success" />}
        title={topic.name}
        panel={
          <ProgressPanel
            value={topicProgress(topic)}
            meta={
              <p className="text-[#171c23] text-[13px] opacity-50">
                {done.length} מתוך {topic.tests.length} מבחנים הושלמו
              </p>
            }
          />
        }
      />

      {pending.length > 0 && (
        <>
          <p className="font-semibold text-[#171c23] text-[15px] text-right mb-3">
            מבחנים שטרם הושלמו
            <span className="opacity-50 font-normal">
              {" "}
              ({pending.length})
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch mb-8">
            {pending.map((t) => (
              <PendingTestCard
                key={t.id}
                test={t}
                onOpen={() => onOpenTest(t.id, "run")}
              />
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <p className="font-semibold text-[#171c23] text-[15px] text-right mb-3">
            מבחנים שהושלמו
            <span className="opacity-50 font-normal">
              {" "}
              ({done.length})
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {done.map((t) => (
              <CompletedTestCard
                key={t.id}
                test={t}
                onSummary={() => onOpenTest(t.id, "summary")}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type View =
  | { kind: "intro" }
  | { kind: "list" }
  | { kind: "dapar" }
  | { kind: "topic"; id: string }
  | {
      kind: "test";
      topicId: string;
      testId: string;
      mode: "run" | "summary";
    };

export default function LearningsPage() {
  const [view, setView] = useState<View>({ kind: "intro" });

  if (view.kind === "intro")
    return (
      <LearningsIntro
        onContinue={() => setView({ kind: "list" })}
      />
    );

  if (view.kind === "dapar")
    return (
      <DaparLearningPage
        onBackToList={() => setView({ kind: "list" })}
        onOpenTopic={(id) => setView({ kind: "topic", id })}
      />
    );

  if (view.kind === "topic") {
    const topic = daparTopics.find((t) => t.id === view.id);
    if (topic)
      return (
        <TopicPage
          topic={topic}
          onBackToList={() => setView({ kind: "list" })}
          onBackToDapar={() => setView({ kind: "dapar" })}
          onOpenTest={(testId, mode) =>
            setView({
              kind: "test",
              topicId: topic.id,
              testId,
              mode,
            })
          }
        />
      );
  }

  if (view.kind === "test") {
    const topic = daparTopics.find((t) => t.id === view.topicId);
    const test = topic?.tests.find((t) => t.id === view.testId);
    if (topic && test)
      return (
        <DaparTestRunner
          key={`${test.id}-${view.mode}`}
          topicName={topic.name}
          testName={test.name}
          questionCount={test.questions}
          initialResults={
            view.mode === "summary" ? resultsFor(test) : undefined
          }
          initialDuration={test.duration}
          attempts={test.attempts}
          onExit={() => setView({ kind: "topic", id: topic.id })}
        />
      );
  }

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <PageHead
        title="לומדות"
        subtitle="כאן תוכלו למצוא את כל הלומדות שלכם, לתרגל ולעקוב אחר ההתקדמות"
        panel={
          <ProgressPanel
            value={overallProgress}
            meta={
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="font-bold text-[#171c23] text-[14px] shrink-0">
                  ההתקדמות שלי
                </h3>
                <p className="text-[#171c23] text-[13px] opacity-50 truncate">
                  {totalTestsDone} מתוך {totalTests} מבחנים
                </p>
              </div>
            }
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {learnings.map((learning) => (
          <LearningCard
            key={learning.id}
            learning={learning}
            onClick={() => {
              if (learning.id === "dapar")
                setView({ kind: "dapar" });
            }}
          />
        ))}
      </div>

      {/* רק בעמוד הלומדות הראשי - לא בתוך לומדה, נושא או מבחן */}
      <AdBanner />
    </section>
  );
}
