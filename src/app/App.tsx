import { useState, useEffect, useRef } from "react";
import {
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  Pencil,
  Info,
  Settings,
  User,
} from "lucide-react";
import meitavLogoSvg from '../imports/meitavLogoSvg.svg';
import logoimg from '../imports/logoimg.png';
import LearningsPage from './components/LearningsPage';
import TasksAppointmentsPage from './components/TasksAppointmentsPage';
import MyAppointmentsPage from './components/MyAppointmentsPage';
import HobbiesQuestionnairePage from './components/HobbiesQuestionnairePage';
import SettingsPage from './components/SettingsPage';
import InquiriesPage from './components/InquiriesPage';
import MessagesPage, {
  INITIAL_READ_MESSAGE_IDS,
  INITIAL_ARCHIVED_MESSAGE_IDS,
  countUnreadMessages,
} from './components/MessagesPage';
import { GLASS_CARD } from './components/ui/utils';
import {
  THEMES,
  DEFAULT_THEME,
  accentFor,
  getTheme,
  heroGradientBg,
  themeVars,
} from './themes';
import {
  AdBanner,
  Button,
  LayoutSwitch,
  Dialog,
  DialogHeader,
  IconCircle,
  StatusBadge,
  useDialogClose,
} from './components/primitives';
import {
  ContactEditDialog,
  ParentEditDialog,
  CompanionWizard,
  AuthPermissionsBlock,
  AddCompanionBtn,
  MAX_COMPANIONS,
  type ContactInfo,
  type Parent,
  type Companion,
} from './components/PersonalDetailsForms';

type Page =
  | "profile"
  | "learnings"
  | "tasks"
  | "appointments"
  | "hobbiesForm"
  | "settings"
  | "messages"
  | "inquiries";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth < 768,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Inline assets ────────────────────────────────────────────────────────────

function MeitavLogo({ className }: { className?: string }) {
  // return <img src={meitavLogoSvg} alt="מיטב" className={className} />;
  return <img src={logoimg} alt="מיטב" className={className} />;
}

function ProfileAvatar({ className }: { className?: string }) {
  return (
    <div
      className={`bg-[#008ff0] flex items-center justify-center rounded-full shrink-0 ${className ?? "w-9 h-9"}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path
          d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"
          fill="white"
        />
      </svg>
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

const qualityScores = [
  { label: "טיפול באדם", value: 5 },
  { label: "שדה", value: 1 },
  { label: "הדרכה", value: 3 },
  { label: "מנהל וארגון", value: 5 },
  { label: "טכני - הפעלה", value: 3 },
  { label: "טכני - החזקה", value: 4 },
  { label: "קשב סלקטיבי", value: 1 },
  { label: "קשב מתמשך", value: 3 },
  { label: "עיבוד מידע", value: 4 },
  { label: "השקעה והתמדה", value: 5 },
  { label: "עבודת צוות", value: 2 },
  { label: "פיקוד", value: 2 },
  { label: "תפיסה מרחבית", value: 1 },
  { label: "בגרות ובשלות", value: 3 },
  { label: "התנהגות מסגרתית", value: 4 },
];

/** הסבר קצר לכל מיומנות ביום המא"ה - מוצג בריחוף על אייקון המידע */
const MAAH_SKILL_INFO: Record<string, string> = {
  "טיפול באדם":
    "היכולת ליצור קשר בין-אישי, להקשיב ולסייע לאחרים.",
  שדה: "התפקוד בתנאי שטח - התמצאות, סיבולת ועמידה במאמץ פיזי.",
  הדרכה: "היכולת להעביר ידע בבהירות ולהנחות קבוצה.",
  "מנהל וארגון":
    "סדר, תכנון וניהול של משאבים, זמן ומשימות.",
  "טכני - הפעלה":
    "היכולת ללמוד ולהפעיל מערכות וציוד טכני.",
  "טכני - החזקה":
    "אחזקה שוטפת, איתור תקלות ותיקון של ציוד.",
  "קשב סלקטיבי":
    "היכולת להתמקד בגירוי אחד מתוך רעש והסחות דעת.",
  "קשב מתמשך":
    "שמירה על ריכוז לאורך זמן במשימה חוזרת ומונוטונית.",
  "עיבוד מידע":
    "קליטה, ניתוח והסקת מסקנות ממידע חדש.",
  "השקעה והתמדה":
    "נכונות להשקיע מאמץ ולהתמיד גם במשימות ארוכות וקשות.",
  "עבודת צוות":
    "שיתוף פעולה, תרומה לקבוצה והתחשבות באחרים.",
  פיקוד:
    "היכולת להוביל, לקבל החלטות ולקחת אחריות על אחרים.",
  "תפיסה מרחבית":
    "הבנת יחסים בין עצמים במרחב, ניווט והתמצאות.",
  "בגרות ובשלות":
    "שיקול דעת, אחריות אישית והתמודדות עם מצבי לחץ.",
  "התנהגות מסגרתית":
    "עמידה בכללים, משמעת ונורמות של מסגרת מאורגנת.",
};

/** ששת הציונים המספריים. `interactive` = יש לו הסבר בטולטיפ/בוטום-שיט באופציה 1 */
const scoreCards: {
  label: string;
  value: number;
  max: number;
  interactive?: boolean;
}[] = [
  { label: 'דפ"ר', value: 30, max: 90, interactive: true },
  { label: "עברית", value: 8, max: 8, interactive: true },
  {
    label: "פרופיל רפואי",
    value: 97,
    max: 97,
    interactive: true,
  },
  { label: "קשיי הסתגלות", value: 2, max: 5, interactive: true },
  { label: "קשב מתמשך", value: 3, max: 5, interactive: true },
  { label: "התאמה לקצונה", value: 4, max: 5, interactive: true },
];

const MAAH_LABEL = 'יום המא"ה';
const DAPAR_LABEL = 'דפ"ר';

/** פירוט תת-המבחנים של הדפ"ר - מוצג כגרף עמודות בכל חלונות המידע הנוסף */
const DAPAR_MAX = 90;
const DAPAR_TICKS = [90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
const DAPAR_BREAKDOWN = [
  { label: "חשיבה כמותית", value: 40 },
  { label: "הוראות מילוליות", value: 30 },
  { label: "אנלוגיות צורניות", value: 20 },
  { label: "אנלוגיות מילוליות", value: 30 },
];

const GAUGE_INFO: Record<string, { explanation: string }> = {
  'דפ"ר': {
    explanation: `המבחנים הפסיכוטכניים בוחנים את יכולות החשיבה שלך על ידי מבחנים כמותיים, מילוליים וזכרוניים. במהלך המבדק הפסיכוטכני שנערך בלשכת הגיוס נקבע ציון הדפ"ר, שנע בין 10 (הציון הנמוך ביותר) ל-90 (הציון הגבוה ביותר) במרווחים של 10 נקודות.`,
  },
  עברית: {
    explanation: `סימול העברית הינו ציון המשקף את רמת העברית שלך. הציון נקבע על בסיס מבחן הדיבור שביצעת במהלך הראיון האישי. חלק מהמלש"בים יבצעו גם מבחן הבנת הנקרא על מנת לקבוע ציון זה.\n\nציון סימול העברית נע בין 5 (הציון הנמוך ביותר) ל-8 (הציון הגבוה ביותר).\nהסימול, יחד עם נתונים נוספים מהווה סף לקבלת זימון למיון ליחידות המובחרות והינה מרכיב ביציאה לקצונה ובשיבוץ למקצועות מסוימים בצבא.\nסימול העברית משמש אך ורק את המסגרת הצבאית ואינו רלוונטי לאחר השחרור מצה"ל.`,
  },
  "פרופיל רפואי": {
    explanation:
      "הפרופיל הרפואי מסמל את מצבך וכשירותך הרפואית למערכי הצבא השונים ויש לו השפעה על סוג שירותך ואופיו.",
  },
  'יום המא"ה': {
    explanation: `תפקיד יום המא"ה  (מיון, איתור והתאמה) הוא לבחון את יכולות המלש"בים והמלש"ביות במגוון מיומנויות על מנת להתאים שיבוץ מיטבי המשלב בין צרכי הצבא, יכולות הפרט ורצונותיו.`,
  },
  "קשיי הסתגלות": {
    explanation: `ציון קשיי ההסתגלות (קב"א חברתי) נקבע על בסיס הראיון האישי בלשכת הגיוס ומשקף את מידת ההתאמה הצפויה שלך למסגרת הצבאית ולחיי השירות.\n\nהציון נע בין 1 (הציון הנמוך ביותר) ל-5 (הציון הגבוה ביותר) ומשמש, יחד עם נתונים נוספים, בקביעת השיבוץ.`,
  },
  "קשב מתמשך": {
    explanation: `ציון הקשב המתמשך נמדד במהלך יום המא"ה ובוחן את היכולת שלך לשמור על ריכוז לאורך זמן במשימה חוזרת ומונוטונית.\n\nהציון נע בין 1 (הציון הנמוך ביותר) ל-5 (הציון הגבוה ביותר) ומהווה מרכיב בשיבוץ למקצועות הדורשים ערנות ממושכת.`,
  },
  "התאמה לקצונה": {
    explanation: `ציון ההתאמה לקצונה משקלל את נתוני האיכות, המיומנויות שנמדדו ביום המא"ה והראיון האישי, ומשקף את הפוטנציאל שלך להשתלב בהמשך בתפקידי פיקוד והכשרות קצונה.\n\nהציון נע בין 1 (הציון הנמוך ביותר) ל-5 (הציון הגבוה ביותר) ואינו סופי - הוא עשוי להתעדכן במהלך השירות.`,
  },
};

// ── Dapar chart ──────────────────────────────────────────────────────────────

/** גרף עמודות של תת-מבחני הדפ"ר. ציר Y: 0-90 במרווחים של 10 */
function DaparChart() {
  // העמודות "צומחות" בכניסה - נעים לעין ומדגיש את ההשוואה בין התת-מבחנים
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="w-full" dir="ltr">
      <div className="flex gap-2.5">
        {/* ציר Y */}
        <div className="flex flex-col justify-between h-[190px] shrink-0 text-[10px] text-[rgba(23,28,35,0.4)] tabular-nums text-left">
          {DAPAR_TICKS.map((t) => (
            <span key={t} className="leading-none">
              {t}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {/* אזור הציור */}
          <div className="relative h-[190px]">
            {DAPAR_TICKS.map((t, i) => (
              <div
                key={t}
                className={`absolute inset-x-0 border-t ${t === 0 ? "border-[rgba(23,28,35,0.12)]" : "border-[rgba(23,28,35,0.05)]"}`}
                style={{
                  top: `${(i / (DAPAR_TICKS.length - 1)) * 100}%`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-end" dir="rtl">
              {DAPAR_BREAKDOWN.map((b) => (
                <div
                  key={b.label}
                  className="flex-1 flex justify-center items-end h-full px-1.5"
                >
                  <div
                    className="relative w-full max-w-[30px] rounded-t-[6px] transition-[height] duration-700 ease-out"
                    style={{
                      height: grown
                        ? `${(b.value / DAPAR_MAX) * 100}%`
                        : 0,
                      background:
                        "linear-gradient(to top, var(--brand, #008ff0), rgba(var(--brand-rgb, 0,143,240), 0.5))",
                    }}
                  >
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 text-[11px] font-bold text-[#008ff0] tabular-nums">
                      {b.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* תוויות ציר X - מיושרות מתחת לעמודות */}
          <div className="flex pt-2.5" dir="rtl">
            {DAPAR_BREAKDOWN.map((b) => (
              <div
                key={b.label}
                className="flex-1 px-1 text-center text-[11px] leading-tight text-[rgba(23,28,35,0.62)]"
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip (desktop) ────────────────────────────────────────────────────────

function GaugeTooltip({
  x,
  y,
  label,
  value,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
}) {
  const info = GAUGE_INFO[label];
  if (!info) return null;

  // לדפ"ר הטולטיפ רחב יותר כדי להכיל את הגרף לצד הטקסט
  const hasChart = label === DAPAR_LABEL;
  const TOOLTIP_W = hasChart ? 620 : 300;
  const OFFSET = 18;
  const left =
    x + OFFSET + TOOLTIP_W > window.innerWidth
      ? x - TOOLTIP_W - OFFSET
      : x + OFFSET;
  const estimatedHeight = hasChart ? 280 : 160;
  const top =
    y + OFFSET + estimatedHeight > window.innerHeight
      ? y - estimatedHeight - OFFSET
      : y + OFFSET;

  return (
    <div
      dir="rtl"
      className="fixed z-[500] pointer-events-none bg-white rounded-[10px] p-4"
      style={{
        left,
        top,
        width: TOOLTIP_W,
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
      }}
    >
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-bold text-[#171c23] text-[16px]">
          {label}
        </span>
        {value > 0 && (
          <span className="font-bold text-[#008ff0] text-[20px]">
            {value}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <ScoreDetails label={label} />
      </div>
    </div>
  );
}

// ── Bottom Sheet (mobile) ────────────────────────────────────────────────────

function BottomSheet({
  label,
  value,
  onClose,
}: {
  label: string;
  value: number;
  onClose: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      header={
        <DialogHeader
          title={
            <span className="flex items-baseline gap-1.5">
              {label}
              <span className="font-bold text-[#008ff0] text-[24px]">
                {value}
              </span>
            </span>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <ScoreDetails label={label} />
      </div>
    </Dialog>
  );
}

// ── Primitives ───────────────────────────────────────────────────────────────

function SemiGauge({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const r = 80;
  const arc = Math.PI * r;
  const fill = (value / max) * arc;
  return (
    <div
      className="relative"
      style={{ width: 180, height: 96 }}
    >
      <svg
        width="180"
        height="90"
        viewBox="0 0 180 90"
        className="block overflow-visible w-[120px] md:w-[180px] mx-auto"
      >
        <path
          d="M 10 90 A 80 80 0 0 1 170 90"
          fill="none"
          stroke="var(--gauge-track, #f5f5f7)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 170 90 A 80 80 0 0 0 10 90"
          fill="none"
          stroke="var(--brand, #008ff0)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${arc}`}
        />
      </svg>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center leading-none pb-1">
        <span className="font-bold text-[#171c23] text-[28px] tracking-tight">
          {value}
        </span>
        <span className="text-[rgba(23,28,35,0.5)] text-[13px]">
          /{max}
        </span>
      </div>
    </div>
  );
}

interface GaugeCardProps {
  label: string;
  value: number;
  max: number;
  display?: "gauge" | "number";
  interactive?: boolean;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  hovered?: boolean;
}

function GaugeCard({
  label,
  value,
  max,
  display = "gauge",
  interactive,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  onClick,
  hovered,
}: GaugeCardProps) {
  return (
    <div
      className={`bg-white rounded-[10px] flex-1 min-w-0 p-3 sm:p-5 flex flex-col items-center gap-2 transition-all duration-200 select-none ${interactive ? "cursor-pointer" : ""}`}
      style={
        hovered
          ? {
              boxShadow: "0 0 20px 0 rgba(0, 143, 240, 0.25)",
              border: "1px solid rgba(0, 143, 240, 0.2)",
            }
          : undefined
      }
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-right w-full flex items-center gap-1.5">
        {label}
        {interactive && (
          <Info
            size={15}
            className="hidden md:inline-block shrink-0 opacity-40"
          />
        )}
      </p>
      {/* הערך ממורכז במרחב שנותר - הכרטיסים נמתחים לגובה כרטיס המא"ה */}
      <div className="flex-1 w-full flex items-center justify-center">
        {display === "number" ? (
          <p className="font-black text-[#008ff0] text-[44px] sm:text-[52px] leading-none tracking-tight">
            {value}
          </p>
        ) : (
          <SemiGauge value={value} max={max} />
        )}
      </div>
      {interactive ? (
        <p className="md:hidden text-[#171c23] text-[13px] sm:text-[14px] text-right w-full opacity-70">
          לחצ/י למידע נוסף
        </p>
      ) : (
        <p
          aria-hidden
          className="md:hidden invisible text-[13px] sm:text-[14px] w-full"
        >
          &nbsp;
        </p>
      )}
    </div>
  );
}


function KpiCard({
  label,
  value,
  subtitle,
  valueClassName,
  glass,
  interactive,
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  valueClassName?: string;
  glass?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`${glass ? GLASS_CARD : "bg-white"} rounded-[10px] flex-1 min-w-0 p-5 flex flex-col items-center justify-between gap-2 ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-right w-full">
        {label}
      </p>
      <p
        className={`font-black text-[#008ff0] leading-none tracking-tight ${valueClassName ?? "text-[44px] sm:text-[52px]"}`}
      >
        {value}
      </p>
      {subtitle ? (
        <p className="text-[#171c23] text-[14px] text-right w-full opacity-70">
          {subtitle}
        </p>
      ) : (
        <p
          aria-hidden
          className="invisible text-[14px] w-full"
        >
          &nbsp;
        </p>
      )}
    </div>
  );
}

// כרטיס משולב: ספירה לאחור לגיוס + תאריך משוער (לועזי ועברי) + שיבוץ חזוי
function EnlistmentCard({
  days,
  date,
  hebrewDate,
  assignment,
}: {
  days: number;
  date: string;
  hebrewDate: string;
  assignment: string;
}) {
  return (
    <div
      className={`${GLASS_CARD} rounded-[10px] col-span-2 md:col-span-3 min-w-0 flex flex-col md:flex-row md:items-stretch`}
    >
      {/* ימים לגיוס + תאריך משוער */}
      <div className="flex items-stretch min-w-0 md:flex-[2]">
        <div className="flex-1 min-w-0 px-3 py-3 sm:px-4 flex flex-col items-center justify-between gap-1">
          <p className="font-bold text-[#171c23] text-[14px] sm:text-[15px] text-center w-full">
            ימים לגיוס
          </p>
          <p className="font-black text-[#008ff0] text-[30px] sm:text-[34px] leading-none tracking-tight">
            {days}
          </p>
          <p
            aria-hidden
            className="invisible text-[12px] sm:text-[13px] w-full"
          >
            &nbsp;
          </p>
        </div>

        {/* קו מפריד עדין */}
        <div className="w-px bg-[rgba(23,28,35,0.08)] my-3 sm:my-4 shrink-0" />

        <div className="flex-1 min-w-0 px-3 py-3 sm:px-4 flex flex-col items-center justify-between gap-1">
          <p className="font-bold text-[#171c23] text-[14px] sm:text-[15px] text-center w-full">
            תאריך גיוס משוער
          </p>
          <p className="font-black text-[#008ff0] text-[24px] sm:text-[22px] leading-none tracking-tight whitespace-nowrap">
            {date}
          </p>
          <p className="text-[#171c23] text-[12px] sm:text-[13px] opacity-70 whitespace-nowrap">
            {hebrewDate}
          </p>
        </div>
      </div>

      {/* קו מפריד: אופקי במובייל, אנכי בדסקטופ */}
      <div className="h-px w-auto mx-4 md:h-auto md:w-px md:mx-0 md:my-4 bg-[rgba(23,28,35,0.08)] shrink-0" />

      {/* שיבוץ חזוי */}
      <div className="min-w-0 md:flex-[1] px-3 py-3 sm:px-4 flex flex-col items-center justify-between gap-1">
        <p className="font-bold text-[#171c23] text-[14px] sm:text-[15px] text-center w-full">
          שיבוץ חזוי
        </p>
        <p className="font-black text-[#008ff0] text-[24px] sm:text-[22px] leading-none tracking-tight text-center">
          {assignment}
        </p>
        <p
          aria-hidden
          className="invisible text-[12px] sm:text-[13px] w-full"
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-start min-w-[100px]">
      <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
        {label}
      </span>
      <span className="text-[#171c23] text-[15px] whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}


function SubSection({
  title,
  className = "mb-3",
}: {
  title: string;
  className?: string;
}) {
  return (
    <p
      className={`font-semibold text-[#171c23] text-[15px] ${className}`}
    >
      {title}
    </p>
  );
}

// ── Logout confirmation dialog ────────────────────────────────────────────────

function LogoutConfirmDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      width={380}
      bodyClassName="px-6 pt-6 pb-2"
      footer={<LogoutActions />}
    >
      <div className="flex flex-col items-center text-center">
        <IconCircle size={56} className="mb-4">
          <LogOut size={24} />
        </IconCircle>
        <h3 className="font-bold text-[#171c23] text-[20px] mb-1.5">
          התנתקות מהמערכת
        </h3>
        <p className="text-[#171c23] text-[14px] opacity-60">
          האם ברצונך להתנתק מהאזור האישי?
        </p>
      </div>
    </Dialog>
  );
}

function LogoutActions() {
  const close = useDialogClose();
  return (
    <div className="flex gap-3 w-full">
      <Button
        variant="ghost"
        onClick={close}
        className="flex-1 justify-center"
      >
        ביטול
      </Button>
      <Button onClick={close} className="flex-1 justify-center">
        התנתקות
      </Button>
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function Header({
  activePage,
  onNavigate,
  unreadCount,
  navGradient,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  /** מספר ההודעות שלא נקראו - לבאדג' על פריט "הודעות" בתפריט */
  unreadCount: number;
  /** גרדיאנט סרגל הניווט - מגיע מערכת הנושא */
  navGradient: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const navTabs = [
    "הודעות",
    "פניות",
    "לומדות",
    "משימות",
    "זימונים",
    "פרופיל אישי",
  ];
  const tabToPage: Record<string, Page> = {
    הודעות: "messages",
    פניות: "inquiries",
    לומדות: "learnings",
    "פרופיל אישי": "profile",
    "משימות": "tasks",
    "זימונים": "appointments",
  };
  /** באדג' ספירה על פריט תפריט - כרגע רק להודעות שלא נקראו */
  const tabCount = (tab: string) =>
    tab === "הודעות" && unreadCount > 0 ? unreadCount : 0;
  const isActiveTab = (tab: string) =>
    tabToPage[tab] === activePage;
  const handleTabClick = (tab: string) => {
    const page = tabToPage[tab];
    if (page) onNavigate(page);
  };

  const NavCount = ({ tab }: { tab: string }) => {
    const count = tabCount(tab);
    if (!count) return null;
    return (
      <span
        aria-label={`${count} הודעות שלא נקראו`}
        className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#c43c3c] text-white text-[11px] font-bold flex items-center justify-center leading-none shrink-0"
      >
        {count}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden md:flex bg-[#122736] items-center justify-between px-10 py-1.5">
        {/* Right: logo + main nav */}
        <div className="flex items-center gap-6 text-white text-[15px]">
          <MeitavLogo className="h-[32px] pb-2" />
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            תהליך הגיוס <ChevronDown size={14} />
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            תפקידים
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            טפסים
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            כתבות
          </span>
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            לשכות גיוס <ChevronDown size={14} />
          </span>
        </div>
        {/* Left: utility links */}
        <div className="flex items-center gap-6 text-white text-[15px]">
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            שאלות ותשובות
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            צור קשר
          </span>
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            עברית <ChevronDown size={14} />
          </span>
        </div>
      </div>

      <div
        className="text-white relative"
        style={{
          background:
            navGradient,
        }}
      >
        <div className="hidden md:flex items-center justify-between px-10 h-[54px]">
          <nav className="flex flex-row-reverse items-center gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`px-4 py-1 rounded text-[15px] whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActiveTab(tab)
                    ? "bg-white/10 font-semibold"
                    : "opacity-80 hover:opacity-100 hover:bg-white/5"
                }`}
              >
                {tab}
                <NavCount tab={tab} />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full px-4 h-8 flex items-center gap-2 w-[220px]">
              <Search size={15} />
              <span className="text-white/70 text-[14px]">
                חיפוש
              </span>
            </div>
            <button
              onClick={() => onNavigate("settings")}
              className={`flex items-center justify-center transition-opacity ${
                activePage === "settings"
                  ? "opacity-100"
                  : "opacity-80 hover:opacity-100"
              }`}
              aria-label="הגדרות"
            >
              <Settings size={17} />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            {/* בלוק משתמש: אייקון (בקצה שמאל), שם, התנתקות */}
            <div dir="rtl" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User size={17} />
              </div>
              <span className="text-[14px] font-semibold whitespace-nowrap">
                ישראלה ישראלית
              </span>
              <button
                aria-label="התנתקות"
                onClick={() => setLogoutOpen(true)}
                className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-between px-4 h-[64px] bg-[#122736]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center"
            >
              {mobileOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
            <MeitavLogo className="h-[32px] pb-2" />
          </div>
          <div className="flex items-center gap-4">
            <Search size={17} />
            <button
              onClick={() => onNavigate("settings")}
              className="flex items-center justify-center"
              aria-label="הגדרות"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden absolute top-full inset-x-0 z-50 border-t border-white/10 bg-[#122736] shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
            {/* בלוק משתמש: אייקון (בקצה שמאל), שם, התנתקות */}
            <div
              dir="rtl"
              className="flex items-center justify-between gap-2 w-full px-5 py-4 border-b border-white/10"
            >
              <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User size={19} />
              </div>
              <div className="text-[16px] font-semibold">
                ישראלה ישראלית
              </div>
              </div>
              <button
                className=" flex flex-row-reverse items-center gap-1.5 text-[14px] font-semibold opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => {
                  setMobileOpen(false);
                  setLogoutOpen(true);
                }}
              >
                <LogOut size={17} />
                התנתקות
              </button>
            </div>
            <div className="flex flex-col-reverse">
              {navTabs.map((tab) => (
                <button
                  key={tab}
                  className={`w-full text-right px-5 py-3.5 text-[16px] border-b border-white/5 flex items-center gap-2 ${
                    isActiveTab(tab)
                      ? "bg-white/10 font-semibold"
                      : ""
                  }`}
                  onClick={() => {
                    handleTabClick(tab);
                    setMobileOpen(false);
                  }}
                >
                  {tab}
                  <NavCount tab={tab} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {logoutOpen && (
        <LogoutConfirmDialog onClose={() => setLogoutOpen(false)} />
      )}
    </header>
  );
}

// ── Quality Section ───────────────────────────────────────────────────────────

function MaahCard() {
  // במובייל הכרטיס סגור כברירת מחדל ונפתח בלחיצה (כמו האקורדיון בפרטים אישיים)
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-[10px] p-5 flex flex-col gap-4 md:h-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full text-right md:pointer-events-none"
      >
        <h3 className="font-bold text-[#171c23] text-[18px] flex items-center gap-1.5">
          יום המא"ה
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {/* תג סטטוס "הושלם" - באותו סגנון של כרטיסיות הלומדות */}
          <StatusBadge variant="success" dot>
            הושלם
          </StatusBadge>
          <ChevronDown
            size={20}
            className={`md:hidden shrink-0 text-[#171c23] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {/* ההסבר הכללי מוצג תמיד בדסקטופ; במובייל הוא נפתח עם האקורדיון */}
      <p
        className={`${open ? "block" : "hidden"} md:block text-[#171c23] text-[14px] text-right leading-relaxed`}
      >
        {GAUGE_INFO[MAAH_LABEL].explanation}
      </p>
      <div
        className={`${open ? "grid" : "hidden"} md:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-x-3 gap-y-4 md:flex-1 md:content-evenly`}
      >
        {qualityScores.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center min-w-0"
          >
            {/* גובה קבוע ללייבל כדי שאייקוני המידע יישבו כולם על אותו קו */}
            <span className="min-h-[32px] flex items-center justify-center text-[#122736] text-[13px] text-center leading-tight opacity-70">
              {item.label}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-[#122736] text-[20px]">
                {item.value}
              </span>
              <MaahSkillInfo label={item.label} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * תוכן ההסבר של ציון - משותף לכל חלונות המידע הנוסף
 * (טולטיפ בדסקטופ, בוטום-שיט במובייל ופאנל הטאבים באופציה 2).
 */
function ScoreDetails({ label }: { label: string }) {
  const explanation = (
    <p className="text-[#171c23] text-[14px] leading-relaxed text-right whitespace-pre-line flex-1">
      {GAUGE_INFO[label]?.explanation}
    </p>
  );
  // לדפ"ר ולמא"ה מוצג תוכן נוסף - בדסקטופ משמאל לטקסט, במובייל מתחתיו
  const aside =
    label === DAPAR_LABEL ? (
      <div className="w-full md:w-[320px] shrink-0">
        <DaparChart />
      </div>
    ) : label === MAAH_LABEL ? (
      <div className="w-full md:w-[58%] shrink-0 grid grid-cols-3 md:grid-cols-5 gap-x-3 gap-y-4">
        {qualityScores.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center min-w-0"
          >
            {/* גובה קבוע ללייבל כדי שאייקוני המידע יישבו כולם על אותו קו */}
            <span className="min-h-[32px] flex items-center justify-center text-[#122736] text-[13px] text-center leading-tight opacity-70">
              {item.label}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-[#122736] text-[20px]">
                {item.value}
              </span>
              <MaahSkillInfo label={item.label} />
            </span>
          </div>
        ))}
      </div>
    ) : null;

  if (!aside) return explanation;

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
      {explanation}
      {aside}
    </div>
  );
}

/** אייקון מידע ליד מיומנות של יום המא"ה - ההסבר הקצר נפתח בריחוף */
function MaahSkillInfo({ label }: { label: string }) {
  const info = MAAH_SKILL_INFO[label];
  if (!info) return null;
  return (
    <span className="relative group inline-flex shrink-0">
      <Info
        size={12}
        className="opacity-40 group-hover:opacity-100 transition-opacity"
        aria-label={info}
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[180px] rounded-[8px] bg-[#122736] text-white text-[11px] font-normal leading-snug p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        {info}
      </span>
    </span>
  );
}

/** שם הציון + הערך שלו - לכותרת הפאנל/הבוטום-שיט */
function ScoreTitle({ label }: { label: string }) {
  const score = scoreCards.find((s) => s.label === label);
  return (
    <span className="flex items-baseline gap-1.5">
      {label}
      {score && (
        <span className="font-bold text-[#008ff0] text-[20px]">
          {score.value}
        </span>
      )}
    </span>
  );
}

/** תוכן הקוביה: שם הציון + הערך (או תג "הושלם" ליום המא"ה) */
function ScoreTileContent({ label }: { label: string }) {
  const score = scoreCards.find((s) => s.label === label);
  return (
    <>
      <span className="font-bold text-[#171c23] text-[14px] text-center leading-tight">
        {label}
      </span>
      {score ? (
        <span className="font-black text-[#008ff0] text-[32px] leading-none tracking-tight">
          {score.value}
        </span>
      ) : (
        <StatusBadge variant="success" dot>
          הושלם
        </StatusBadge>
      )}
    </>
  );
}

/**
 * אופציה 2: הציונים גלויים תמיד, בלי ללחוץ.
 * דסקטופ - צ'יפים קומפקטיים (שם + ציון) שנשברים לשורה נוספת כשמתווספים ציונים,
 *          וההסבר של הנבחר מוצג בכרטיס שמתחת.
 * מובייל  - רצועת קוביות נגללת לצד, ולחיצה פותחת בוטום-שיט.
 */
const SCORE_TABS = [...scoreCards.map((s) => s.label), MAAH_LABEL];

/**
 * רצועה נגללת אופקית עם סימון ברור שיש עוד תוכן:
 * דהייה בקצה שממנו אפשר להמשיך לגלול + קוביה חלקית שמציצה בקצה.
 */
function ScoreStrip({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      setEdges({ start: pos > 4, end: pos < max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // ב-RTL ההתחלה היא בימין והמשך הגלילה בשמאל
  const mask = `linear-gradient(to left, ${
    edges.start ? "transparent 0, #000 28px" : "#000 0"
  }, ${
    edges.end ? "#000 calc(100% - 28px), transparent 100%" : "#000 100%"
  })`;

  return (
    <div className="relative">
      <div
        ref={ref}
        aria-label="ציונים"
        className="flex gap-2 overflow-x-auto snap-x -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>
      {/* חץ עדין שמרמז לכיוון הגלילה */}
      {edges.end && (
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 -mr-1 flex items-center">
          <span className="w-6 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(18,39,54,0.16)] flex items-center justify-center">
            <ChevronLeft
              size={14}
              className="text-[#008ff0]"
            />
          </span>
        </div>
      )}
    </div>
  );
}

function ScoreTabs() {
  const isMobile = useIsMobile();
  const [active, setActive] = useState(SCORE_TABS[0]);
  const [sheet, setSheet] = useState<string | null>(null);

  if (isMobile) {
    return (
      <>
        {/* רצועה נגללת לצד - בולטת עד קצה המסך, עם דהייה בקצה שיש בו עוד תוכן */}
        <ScoreStrip>
          {SCORE_TABS.map((label) => (
            <button
              key={label}
              onClick={() => setSheet(label)}
              className="snap-start shrink-0 w-[112px] bg-white rounded-[10px] p-3 flex flex-col items-center justify-between gap-2"
            >
              <ScoreTileContent label={label} />
            </button>
          ))}
        </ScoreStrip>
        {sheet && (
          <Dialog
            onClose={() => setSheet(null)}
            header={
              <DialogHeader title={<ScoreTitle label={sheet} />} />
            }
          >
            <div className="flex flex-col gap-4">
              <ScoreDetails label={sheet} />
            </div>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* צ'יפים - אותה שפה של צ'יפי הסינון בהודעות/פניות */}
      <div
        role="tablist"
        aria-label="ציונים"
        className="flex flex-wrap items-center gap-2"
      >
        {SCORE_TABS.map((label) => {
          const score = scoreCards.find((s) => s.label === label);
          const isActive = label === active;
          return (
            <button
              key={label}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(label)}
              className={`flex items-center gap-2 text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap border backdrop-blur-lg text-[#171c23] transition-all ${
                isActive
                  ? "bg-white border-transparent shadow-[0_8px_32px_rgba(18,39,54,0.12)]"
                  : "bg-white/30 border-white/50 shadow-[0_8px_32px_rgba(18,39,54,0.12)] hover:bg-white hover:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]"
              }`}
            >
              {label}
              {score ? (
                <span className="font-black text-[16px] leading-none text-[#008ff0]">
                  {score.value}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[12px] text-[#4e9400]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4e9400]" />
                  הושלם
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="bg-white rounded-[10px] p-5 flex flex-col gap-4"
      >
        <h3 className="font-bold text-[#171c23] text-[18px] text-right">
          <ScoreTitle label={active} />
        </h3>
        <ScoreDetails label={active} />
      </div>
    </div>
  );
}

function QualitySection() {
  const isMobile = useIsMobile();
  const [layout, setLayout] = useState<1 | 2>(1);

  // Desktop tooltip: which card + cursor position
  const [hoveredCard, setHoveredCard] = useState<{
    label: string;
    value: number;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Mobile bottom sheet: which card
  const [sheetCard, setSheetCard] = useState<{
    label: string;
    value: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const gaugeProps = (label: string, value: number) => ({
    label,
    value,
    interactive: true,
    hovered: hoveredCard?.label === label,
    onMouseEnter: () => {
      if (!isMobile) setHoveredCard({ label, value });
    },
    onMouseLeave: () => setHoveredCard(null),
    onMouseMove: handleMouseMove,
    onClick: () => {
      if (isMobile) setSheetCard({ label, value });
    },
  });

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-4">
      {/* Desktop tooltip */}
      {!isMobile && hoveredCard && (
        <GaugeTooltip
          x={tooltipPos.x}
          y={tooltipPos.y}
          label={hoveredCard.label}
          value={hoveredCard.value}
        />
      )}

      {/* Mobile bottom sheet */}
      {sheetCard && (
        <BottomSheet
          label={sheetCard.label}
          value={sheetCard.value}
          onClose={() => setSheetCard(null)}
        />
      )}

      {/* כותרת העמוד */}
      <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight text-right mb-6">
        פרופיל אישי<span className="text-[#69c600]">.</span>
      </h2>

      <div className="flex flex-col gap-4">
        {/* נתוני גיוס - רוחב מלא */}
        <EnlistmentCard
          days={186}
          date="01.01.27"
          hebrewDate='כ"ב בטבת התשפ"ז'
          assignment="ע.ח מבצעים אוויר"
        />

        {/* כותרת נתוני האיכות + מתג הפריסה - יושבת ישירות מעל מה שהיא משנה */}
        <div className="pt-2">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight text-right">
              נתוני איכות<span className="text-[#69c600]">.</span>
            </h2>
            <LayoutSwitch value={layout} onChange={setLayout} />
          </div>
          <p className="text-[#171c23] text-[14px] opacity-50 text-right">
            שימו לב, נתונים אלו אינם בהכרח סופיים ועשויים להשתנות
            עד מועד הגיוס
            {layout === 1 && (
              <span className="md:hidden">
                {" · "}לחצ/י על ציון למידע נוסף
              </span>
            )}
          </p>
        </div>

        {layout === 2 ? (
          /* ציונים (2 שורות) + יום המא"ה בצד, באותו גובה */
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* הציונים תופסים שני שליש מהרוחב - 3 עמודות בשתי שורות */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:flex-[2] md:min-w-0">
              {scoreCards.map((s) => (
                <GaugeCard
                  key={s.label}
                  max={s.max}
                  display="number"
                  {...(s.interactive
                    ? gaugeProps(s.label, s.value)
                    : { label: s.label, value: s.value })}
                />
              ))}
            </div>
            {/* יום המא"ה - שליש מרוחב הקונטיינר */}
            <div className="w-full md:flex-1 md:min-w-0">
              <MaahCard />
            </div>
          </div>
        ) : (
          <ScoreTabs />
        )}
      </div>
    </section>
  );
}

// ── Personal Detail Cards ─────────────────────────────────────────────────────

function PersonalInfoContent({
  contact,
  onEditContact,
}: {
  contact: ContactInfo;
  onEditContact: () => void;
}) {
  return (
    <div className="p-5 flex flex-col gap-5">
      {/* גריד אחיד של 6 עמודות - השדות צמודים יותר, גולשים לשורה הבאה */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
        <InfoField label="שם מלא" value="ישראלה ישראלית" />
        <InfoField label="מגדר" value="נקבה" />
        <InfoField label="סטטוס זוגי" value="נשוא/ה" />
        <InfoField label="תאריך לידה" value="01.01.1990" />
        <InfoField label="ארץ לידה" value="-" />
        <InfoField label="אזרחות" value="ישראלית" />
        <InfoField label="רב קו" value="2564376487" />
      </div>
      <div className="pt-4 border-t border-[rgba(23,28,35,0.05)]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="font-semibold text-[#171c23] text-[15px]">
            דרכים ליצירת קשר
          </p>
          <button
            onClick={onEditContact}
            className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
          >
            <Pencil size={13} className="shrink-0" />
            עריכה
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
          <InfoField label="טלפון" value={contact.phone} />
          <InfoField label="אימייל" value={contact.email} />
          {/* כתובות ארוכות - תופסות 2 עמודות כדי שלא יתנגשו */}
          <div className="col-span-2">
            <InfoField label="כתובת" value={contact.address} />
          </div>
          <div className="col-span-2">
            <InfoField
              label="כתובת למשלוח דואר"
              value={contact.mailingAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** מוסדות הלימוד לפי שלב - מהאחרון לראשון */
const SCHOOLS = [
  {
    stage: "תיכון",
    name: `תיכוני לא מקצועי בחו"ל`,
    years: `התשמ"ט - התשנ"ט`,
  },
  {
    stage: "חטיבת ביניים",
    name: "חטיבת ביניים רמות",
    years: `התשמ"ו - התשמ"ח`,
  },
  {
    stage: "יסודי",
    name: "בית ספר יסודי הדקל",
    years: `התש"ם - התשמ"ה`,
  },
];

/** בגרויות - מקצוע, יחידות לימוד, וסימון מקצוע הרחבה (לא חובה) */
const BAGRUT: {
  subject: string;
  units: number;
  extension?: boolean;
}[] = [
  { subject: "אנגלית", units: 5 },
  { subject: "מתמטיקה", units: 4 },
  { subject: "לשון והבעה", units: 2 },
  { subject: "ספרות", units: 2 },
  { subject: `תנ"ך`, units: 2 },
  { subject: "היסטוריה", units: 2 },
  { subject: "אזרחות", units: 2 },
  { subject: "תורת החשמל", units: 5 },
  { subject: "אמנות", units: 5, extension: true },
  { subject: "גיאוגרפיה", units: 5 },
];

function EducationContent() {
  return (
    // בדסקטופ: מוסדות הלימוד ובגרויות זה לצד זה עם קו מפריד
    <div className="p-5 grid md:grid-cols-2 gap-5 md:gap-0">
      <div className="md:pl-5 md:border-l md:border-[rgba(23,28,35,0.08)] flex flex-col gap-4">
        {SCHOOLS.map(({ stage, name, years }) => (
          <div key={stage}>
            <SubSection title={stage} className="mb-1" />
            {/* רוחב קבוע לעמודת המוסד - שנות הלימוד מיושרות בין השלבים */}
            <div className="flex flex-wrap gap-x-5 gap-y-3 justify-start sm:grid sm:grid-cols-[220px_minmax(0,1fr)]">
              <InfoField label="שם המוסד" value={name} />
              <InfoField label="שנת לימודים" value={years} />
            </div>
          </div>
        ))}
      </div>
      {/* במובייל הבגרויות יורדות לטור נפרד - קו מפריד בין שני החלקים */}
      <div className="md:pr-5 pt-5 border-t border-[rgba(23,28,35,0.05)] md:pt-0 md:border-t-0">
        <SubSection title="בגרויות" />
        <div className="flex flex-wrap gap-2">
          {BAGRUT.map(({ subject, units, extension }) => (
            <div
              key={subject}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
                extension
                  ? "bg-[rgba(105,198,0,0.1)] border border-[rgba(105,198,0,0.45)]"
                  : "bg-white border border-[rgba(0,143,240,0.35)]"
              }`}
            >
              <span className="text-[#171c23] text-[14px] font-semibold whitespace-nowrap">
                {subject}
              </span>
              <span
                className={`text-[13px] font-bold whitespace-nowrap ${extension ? "text-[#4e9400]" : "text-[#008ff0]"}`}
              >
                · {units} יח"ל
              </span>
              {/* מקצוע הרחבה - נבדל מהמקצועות שהם חובה */}
              {extension && (
                <span className="text-[#4e9400] text-[11px] font-semibold whitespace-nowrap bg-[rgba(105,198,0,0.16)] rounded-full px-1.5 py-0.5">
                  הרחבה
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-[#171c23] text-[12px] opacity-50 mt-3">
          מקצועות בירוק הם מקצועות הרחבה, שאר המקצועות הם מקצועות
          חובה
        </p>
      </div>
    </div>
  );
}

// תג סטטוס הרשאה ירוק קומפקטי (במקום שדה לייבל/ערך)
/** כותרת רשומה: שם + תפקיד מימין, כפתור עריכה משמאל */
function EntryHeader({
  prefix,
  name,
  onEdit,
}: {
  prefix: string;
  name: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="font-semibold text-[#171c23] text-[16px] truncate min-w-0">
        <span className="opacity-50 font-normal text-[14px]">
          {prefix} ·{" "}
        </span>
        {name}
      </p>
      <button
        onClick={onEdit}
        className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline shrink-0"
      >
        <Pencil size={13} className="shrink-0" />
        עריכה
      </button>
    </div>
  );
}

function ParentEntry({
  parent,
  onEdit,
  onToggleAuth,
}: {
  parent: Parent;
  onEdit: () => void;
  onToggleAuth: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <EntryHeader
        prefix={parent.relation}
        name={parent.name}
        onEdit={onEdit}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
        <InfoField label="תעודת זהות" value={parent.nationalId} />
        <InfoField label="טלפון" value={parent.phone} />
        <InfoField label="אימייל" value={parent.email} />
        {/* כתובת ארוכה - תופסת 2 עמודות כדי שלא תתנגש */}
        <div className="col-span-2">
          <InfoField label="כתובת מגורים" value={parent.address} />
        </div>
      </div>
      <AuthPermissionsBlock
        authorized={parent.authorized}
        onToggle={onToggleAuth}
      />
    </div>
  );
}

function ParentsContent({
  parents,
  onEdit,
  onToggleAuth,
}: {
  parents: Parent[];
  onEdit: (p: Parent) => void;
  onToggleAuth: (id: string) => void;
}) {
  return (
    <div className="p-5 flex flex-col gap-5">
      {parents.map((parent, i) => (
        <div
          key={parent.id}
          className={
            i > 0
              ? "pt-5 border-t border-[rgba(23,28,35,0.05)]"
              : ""
          }
        >
          <ParentEntry
            parent={parent}
            onEdit={() => onEdit(parent)}
            onToggleAuth={() => onToggleAuth(parent.id)}
          />
        </div>
      ))}
    </div>
  );
}

function CompanionEntry({
  companion,
  onEdit,
  onToggleAuth,
}: {
  companion: Companion;
  onEdit: () => void;
  onToggleAuth: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <EntryHeader
        prefix={companion.type}
        name={`${companion.firstName} ${companion.lastName}`}
        onEdit={onEdit}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
        <InfoField
          label="תעודת זהות"
          value={companion.nationalId}
        />
        <InfoField label="טלפון" value={companion.phone} />
        <InfoField label="אימייל" value={companion.email} />
      </div>
      <AuthPermissionsBlock
        authorized={companion.authorized}
        onToggle={onToggleAuth}
      />
    </div>
  );
}

function CompanionsContent({
  companions,
  onEdit,
  onToggleAuth,
}: {
  companions: Companion[];
  onEdit: (c: Companion) => void;
  onToggleAuth: (id: string) => void;
}) {
  if (companions.length === 0) {
    return (
      <div className="p-5">
        <p className="text-[#171c23] text-[14px] opacity-60 text-center py-4">
          טרם הוספת מלווים. ניתן להוסיף עד {MAX_COMPANIONS} מלווים
          שיוכלו לסייע לך בהליך הגיוס.
        </p>
      </div>
    );
  }
  return (
    <div className="p-5 flex flex-col gap-5">
      {companions.map((companion, i) => (
        <div
          key={companion.id}
          className={
            i > 0
              ? "pt-5 border-t border-[rgba(23,28,35,0.05)]"
              : ""
          }
        >
          <CompanionEntry
            companion={companion}
            onEdit={() => onEdit(companion)}
            onToggleAuth={() => onToggleAuth(companion.id)}
          />
        </div>
      ))}
    </div>
  );
}


// ── Personal Section ──────────────────────────────────────────────────────────

const INITIAL_CONTACT: ContactInfo = {
  phone: "0500000000",
  email: "israela@gmail.com",
  address: "באר שבע, רחוב כלנית 32, דירה 5",
  mailingAddress: "באר שבע, רחוב כלנית 32, דירה 5",
};

const INITIAL_PARENTS: Parent[] = [
  {
    id: "father",
    relation: "אב",
    name: "דני ישראלית",
    nationalId: "211716293",
    phone: "0500000000",
    email: "dani@gmail.com",
    address: "באר שבע, רחוב כלנית 32, דירה 5",
    authorized: true,
  },
  {
    id: "mother",
    relation: "אם",
    name: "שירי ישראלית",
    nationalId: "211716293",
    phone: "0500000000",
    email: "shiri@gmail.com",
    address: "באר שבע, רחוב כלנית 32, דירה 5",
    authorized: true,
  },
];

const INITIAL_COMPANIONS: Companion[] = [
  {
    id: "ronit",
    type: "עובד/ת סוציאלי/ת",
    firstName: "רונית",
    lastName: "כץ",
    nationalId: "211716293",
    phone: "0500000000",
    email: "ronit@gmail.com",
    authorized: true,
  },
];

const personalSections = [
  { key: "personal", label: "מידע אישי" },
  { key: "education", label: "השכלה" },
  { key: "parents", label: "פרטי הורים" },
  { key: "companions", label: "פרטי מלווים" },
];

function PersonalSection() {
  // "מידע אישי" פתוח כברירת מחדל; פתיחת סעיף אחר סוגרת את הקודם
  const [openKey, setOpenKey] = useState<string | null>(
    "personal",
  );

  // ── נתונים ניתנים לעריכה ──
  const [contact, setContact] =
    useState<ContactInfo>(INITIAL_CONTACT);
  const [parents, setParents] =
    useState<Parent[]>(INITIAL_PARENTS);
  const [companions, setCompanions] = useState<Companion[]>(
    INITIAL_COMPANIONS,
  );

  // ── חלונות עריכה ──
  const [contactOpen, setContactOpen] = useState(false);
  const [editingParent, setEditingParent] =
    useState<Parent | null>(null);
  /** null = סגור, "new" = הוספה, אובייקט = עריכה */
  const [companionForm, setCompanionForm] = useState<
    Companion | "new" | null
  >(null);

  const saveParent = (updated: Parent) =>
    setParents((list) =>
      list.map((p) => (p.id === updated.id ? updated : p)),
    );
  const toggleParentAuth = (id: string) =>
    setParents((list) =>
      list.map((p) =>
        p.id === id ? { ...p, authorized: !p.authorized } : p,
      ),
    );

  const saveCompanion = (updated: Companion) =>
    setCompanions((list) =>
      list.some((c) => c.id === updated.id)
        ? list.map((c) => (c.id === updated.id ? updated : c))
        : [...list, updated],
    );
  const toggleCompanionAuth = (id: string) =>
    setCompanions((list) =>
      list.map((c) =>
        c.id === id ? { ...c, authorized: !c.authorized } : c,
      ),
    );

  const personalContent = (
    <PersonalInfoContent
      contact={contact}
      onEditContact={() => setContactOpen(true)}
    />
  );
  const parentsContent = (
    <ParentsContent
      parents={parents}
      onEdit={setEditingParent}
      onToggleAuth={toggleParentAuth}
    />
  );
  const companionsContent = (
    <CompanionsContent
      companions={companions}
      onEdit={setCompanionForm}
      onToggleAuth={toggleCompanionAuth}
    />
  );

  return (
    <section className="px-4 sm:px-6 md:px-10 py-6 pb-12">
      <div className="text-right mb-6">
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
          פרטים אישיים<span className="text-[#69c600]">.</span>
        </h2>
      </div>

      {/* אקורדיון בכל הרזולוציות - סעיף אחד פתוח בכל רגע */}
      <div className="flex flex-col gap-3 md:gap-5">
        {personalSections.map(({ key, label }) => {
          const isOpen = openKey === key;
          return (
            <div
              key={key}
              className="bg-white rounded-[10px] overflow-hidden"
            >
              {/* שורת הכותרת - תמיד גלויה */}
              <button
                onClick={() => setOpenKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="w-full h-[64px] md:h-[60px] flex items-center justify-between px-5"
              >
                <span className="font-bold text-[#171c23] text-[18px]">
                  {label}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-[#171c23] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {/* התוכן הפתוח - באותו כרטיס */}
              {isOpen && (
                <div className="border-t border-[rgba(23,28,35,0.05)]">
                  {key === "personal" && personalContent}
                  {key === "education" && <EducationContent />}
                  {key === "parents" && parentsContent}
                  {key === "companions" && (
                    <>
                      {/* שורת מלווים: ספירה + הוספה (הכותרת כבר בכפתור האקורדיון) */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(23,28,35,0.05)]">
                        <p className="text-[#171c23] text-[13px] opacity-50">
                          {companions.length} מתוך {MAX_COMPANIONS}{" "}
                          מלווים
                        </p>
                        <AddCompanionBtn
                          disabled={
                            companions.length >= MAX_COMPANIONS
                          }
                          onClick={() => setCompanionForm("new")}
                        />
                      </div>
                      {companionsContent}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── חלונות עריכה ── */}
      {contactOpen && (
        <ContactEditDialog
          contact={contact}
          onSave={setContact}
          onClose={() => setContactOpen(false)}
        />
      )}
      {editingParent && (
        <ParentEditDialog
          parent={editingParent}
          onSave={saveParent}
          onClose={() => setEditingParent(null)}
        />
      )}
      {companionForm && (
        <CompanionWizard
          companion={
            companionForm === "new" ? undefined : companionForm
          }
          onSave={saveCompanion}
          onClose={() => setCompanionForm(null)}
        />
      )}

      <AdBanner />
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState<Page>("profile");
  /** מאיפה נכנסים לעמוד הלומדות - מהתפריט (התחלה) או ישירות ללומדה */
  const [learningsEntry, setLearningsEntry] = useState<
    "intro" | "dapar"
  >("intro");
  // ערכת נושא - משנה צבע מותג, רקע וגרדיאנטים (הכותרת העליונה לא משתנה)
  const [themeId, setThemeId] = useState(DEFAULT_THEME.id);
  const theme = getTheme(themeId);
  // בערכה הצבעונית לכל עמוד גוון אקסנט משלו
  const accent = accentFor(theme, page);

  // מצב ההודעות מוחזק כאן כדי שהבאדג' בפעמון ישקף הודעות שלא נקראו
  const [messageReadIds, setMessageReadIds] = useState<Set<string>>(
    () => new Set(INITIAL_READ_MESSAGE_IDS),
  );
  const [messageArchivedIds, setMessageArchivedIds] = useState<
    Set<string>
  >(() => new Set(INITIAL_ARCHIVED_MESSAGE_IDS));
  const unreadMessages = countUnreadMessages(
    messageReadIds,
    messageArchivedIds,
  );

  return (
    <div
      dir="rtl"
      lang="he"
      // יעד ה-portal של החלונות - כאן יושבים משתני ערכת הנושא
      data-app-root
      style={{
        ...themeVars(theme, accent),
        fontFamily: "'Noto Sans Hebrew', sans-serif",
        backgroundColor: accent.pageBg ?? theme.pageBg,
        backgroundImage: heroGradientBg(
          theme,
          isMobile ? -200 : 0,
          isMobile ? 1 : 1.4,
          isMobile ? 1 : 0.7,
          accent,
        ),
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        transition: "background-color 300ms ease",
      }}
      className={`min-h-[100dvh] flex flex-col ${theme.dark ? "dark" : ""} ${theme.surface ? "navy-cards" : ""} ${theme.playful ? "playful" : ""}`}
    >
      {/* בתוך השאלון הטאב "משימות וזימונים" נשאר מסומן */}
      <Header
        activePage={page === "hobbiesForm" ? "tasks" : page}
        onNavigate={(next) => {
          // כניסה לעמוד הלומדות מהתפריט מתחילה תמיד מההתחלה
          if (next === "learnings") setLearningsEntry("intro");
          setPage(next);
        }}
        unreadCount={unreadMessages}
        navGradient={accent.navGradient}
      />
      <main className="flex-1 flex flex-col">
        {page === "learnings" ? (
          <LearningsPage
            key={learningsEntry}
            initialView={learningsEntry}
          />
        ) : page === "tasks" ? (
          <TasksAppointmentsPage
            onViewAllAppointments={() => setPage("appointments")}
            onOpenTask={() => setPage("hobbiesForm")}
            // כרטיס המשימה של הלומדה פותח את הלומדה עצמה
            onOpenLearning={() => {
              setLearningsEntry("dapar");
              setPage("learnings");
            }}
          />
        ) : page === "hobbiesForm" ? (
          <HobbiesQuestionnairePage
            onExit={() => setPage("tasks")}
          />
        ) : page === "appointments" ? (
          <MyAppointmentsPage />
        ) : page === "settings" ? (
          <SettingsPage
            onNavigateHome={() => setPage("profile")}
            themes={THEMES}
            themeId={themeId}
            onThemeChange={setThemeId}
          />
        ) : page === "messages" ? (
          <MessagesPage
            readIds={messageReadIds}
            setReadIds={setMessageReadIds}
            archivedIds={messageArchivedIds}
            setArchivedIds={setMessageArchivedIds}
            onNavigateHome={() => setPage("profile")}
          />
        ) : page === "inquiries" ? (
          <InquiriesPage
            onNavigateHome={() => setPage("profile")}
          />
        ) : (
          <>
            <QualitySection />
            <PersonalSection />
          </>
        )}
      </main>
    </div>
  );
}