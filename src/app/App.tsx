import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
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
  getTheme,
  heroGradientBg,
  themeVars,
} from './themes';
import {
  Button,
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
};

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

  const TOOLTIP_W = 300;
  const OFFSET = 18;
  const left =
    x + OFFSET + TOOLTIP_W > window.innerWidth
      ? x - TOOLTIP_W - OFFSET
      : x + OFFSET;
  const estimatedHeight = 160;
  const top =
    y + OFFSET + estimatedHeight > window.innerHeight
      ? y - estimatedHeight - OFFSET
      : y + OFFSET;

  return (
    <div
      dir="rtl"
      className="fixed z-[500] pointer-events-none bg-white rounded-[10px] p-4 w-[300px]"
      style={{
        left,
        top,
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
      <p className="text-[#171c23] text-[13px] leading-relaxed whitespace-pre-line">
        {info.explanation}
      </p>
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
  const info = GAUGE_INFO[label];
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
      <p className="text-[#171c23] text-[15px] leading-relaxed text-right whitespace-pre-line">
        {info?.explanation}
      </p>
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
      className={`bg-white rounded-[10px] flex-1 min-w-0 p-3 sm:p-5 flex flex-col items-center ${display === "number" ? "justify-between" : ""} gap-2 transition-all duration-200 select-none ${interactive ? "cursor-pointer" : ""}`}
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
      {display === "number" ? (
        <p className="font-black text-[#008ff0] text-[44px] sm:text-[52px] leading-none tracking-tight">
          {value}
        </p>
      ) : (
        <SemiGauge value={value} max={max} />
      )}
      {display === "number" && (
        <p
          aria-hidden
          className="hidden md:block invisible text-[14px] w-full"
        >
          &nbsp;
        </p>
      )}
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
        <div className="flex-1 min-w-0 p-3 sm:p-5 flex flex-col items-center justify-between gap-2">
          <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-center w-full">
            ימים לגיוס
          </p>
          <p className="font-black text-[#008ff0] text-[44px] sm:text-[52px] leading-none tracking-tight">
            {days}
          </p>
          <p
            aria-hidden
            className="invisible text-[13px] sm:text-[14px] w-full"
          >
            &nbsp;
          </p>
        </div>

        {/* קו מפריד עדין */}
        <div className="w-px bg-[rgba(23,28,35,0.08)] my-4 sm:my-6 shrink-0" />

        <div className="flex-1 min-w-0 p-3 sm:p-5 flex flex-col items-center justify-between gap-2">
          <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-center w-full">
            תאריך גיוס משוער
          </p>
          <p className="font-black text-[#008ff0] text-[34px] sm:text-[28px] leading-none tracking-tight whitespace-nowrap">
            {date}
          </p>
          <p className="text-[#171c23] text-[13px] sm:text-[15px] opacity-70 whitespace-nowrap">
            {hebrewDate}
          </p>
        </div>
      </div>

      {/* קו מפריד: אופקי במובייל, אנכי בדסקטופ */}
      <div className="h-px w-auto mx-4 md:h-auto md:w-px md:mx-0 md:my-6 bg-[rgba(23,28,35,0.08)] shrink-0" />

      {/* שיבוץ חזוי */}
      <div className="min-w-0 md:flex-[1] p-3 sm:p-5 flex flex-col items-center justify-between gap-2">
        <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-center w-full">
          שיבוץ חזוי
        </p>
        <p className="font-black text-[#008ff0] text-[34px] sm:text-[28px] leading-none tracking-tight text-center">
          {assignment}
        </p>
        <p
          aria-hidden
          className="invisible text-[13px] sm:text-[14px] w-full"
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

function CardHeader({ title }: { title: string }) {
  return (
    <div className="h-[60px] flex items-center justify-start px-5 border-b border-[rgba(23,28,35,0.05)] shrink-0">
      <h3 className="font-bold text-[#171c23] text-[18px]">
        {title}
      </h3>
    </div>
  );
}

function SubSection({ title }: { title: string }) {
  return (
    <p className="font-semibold text-[#171c23] text-[15px] mb-3">
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
  /** מספר ההודעות שלא נקראו - לבאדג' בפעמון */
  unreadCount: number;
  /** גרדיאנט סרגל הניווט - מגיע מערכת הנושא */
  navGradient: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // פעמון עם באדג' - מוביל ישירות לעמוד ההודעות
  const BellButton = ({ size = 17 }: { size?: number }) => (
    <button
      onClick={() => {
        setMobileOpen(false);
        onNavigate("messages");
      }}
      className={`relative flex items-center justify-center transition-opacity ${
        activePage === "messages"
          ? "opacity-100"
          : "opacity-80 hover:opacity-100"
      }`}
      aria-label="הודעות"
    >
      <Bell size={size} />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-[#c43c3c] text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount}
        </span>
      )}
    </button>
  );

  const navTabs = [
    "פניות",
    "לומדות",
    "משימות",
    "הזימונים שלי",
    "פרופיל אישי",
  ];
  const tabToPage: Record<string, Page> = {
    פניות: "inquiries",
    לומדות: "learnings",
    "פרופיל אישי": "profile",
    "משימות": "tasks",
    "הזימונים שלי": "appointments",
  };
  const isActiveTab = (tab: string) =>
    tabToPage[tab] === activePage;
  const handleTabClick = (tab: string) => {
    const page = tabToPage[tab];
    if (page) onNavigate(page);
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
                className={`px-4 py-1 rounded text-[15px] whitespace-nowrap transition-colors ${
                  isActiveTab(tab)
                    ? "bg-white/10 font-semibold"
                    : "opacity-80 hover:opacity-100 hover:bg-white/5"
                }`}
              >
                {tab}
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
            <BellButton />
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
            <BellButton />
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
                  className={`w-full text-right px-5 py-3.5 text-[16px] border-b border-white/5 block ${
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

function MaahCard({
  hovered,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
}: {
  hovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseMove?: (e: React.MouseEvent) => void;
}) {
  // במובייל הכרטיס סגור כברירת מחדל ונפתח בלחיצה (כמו האקורדיון בפרטים אישיים)
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-white rounded-[10px] p-5 flex flex-col gap-4 transition-all duration-200 md:h-full"
      style={
        hovered
          ? {
              boxShadow: "0 0 20px 0 rgba(0, 143, 240, 0.25)",
              border: "1px solid rgba(0, 143, 240, 0.2)",
            }
          : undefined
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full text-right md:pointer-events-none"
      >
        <h3 className="font-bold text-[#171c23] text-[18px] md:text-[16px] flex items-center gap-1.5">
          יום המא"ה
          <Info
            size={15}
            className="hidden md:inline-block shrink-0 opacity-40"
          />
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
      {/* טקסט ההסבר - רק במובייל (בדסקטופ יש אייקון מידע + טולטיפ בריחוף) */}
      <p
        className={`${open ? "block" : "hidden"} md:hidden text-[#171c23] text-[14px] text-right leading-relaxed`}
      >
        {`תפקיד יום המא"ה (מיון, איתור והתאמה) הוא לבחון את יכולות המלש"בים והמלש"ביות במגוון מיומנויות על מנת להתאים שיבוץ מיטבי.`}
      </p>
      <div
        className={`${open ? "grid" : "hidden"} md:grid grid-cols-3 gap-x-5 gap-y-4 md:flex-1 md:content-evenly`}
      >
        {qualityScores.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center min-w-[80px]"
          >
            <span className="text-[#122736] text-[13px] opacity-70 text-center leading-tight">
              {item.label}
            </span>
            <span className="font-semibold text-[#122736] text-[20px]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualitySection() {
  const isMobile = useIsMobile();

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

      <div className="text-right mb-1">
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
          נתוני איכות<span className="text-[#69c600]">.</span>
        </h2>
      </div>
      <p className="text-[#171c23] text-[14px] opacity-50 text-right mb-6">
        שימו לב, נתונים אלו אינם בהכרח סופיים ועשויים להשתנות עד
        מועד הגיוס
      </p>

      <div className="flex flex-col gap-4">
        {/* נתוני גיוס - רוחב מלא */}
        <EnlistmentCard
          days={186}
          date="01.01.27"
          hebrewDate='כ"ב בטבת התשפ"ז'
          assignment="ע.ח מבצעים אוויר"
        />

        {/* ציונים (2 שורות) + יום המא"ה בצד, באותו גובה */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:flex-[2] md:min-w-0">
            <GaugeCard
              max={90}
              display="number"
              {...gaugeProps('דפ"ר', 30)}
            />
            <GaugeCard
              max={8}
              display="number"
              {...gaugeProps("עברית", 8)}
            />
            <GaugeCard
              max={97}
              display="number"
              {...gaugeProps("פרופיל רפואי", 97)}
            />
            {/* ציונים ללא מידע נוסף (לא אינטראקטיביים) */}
            <GaugeCard
              max={5}
              display="number"
              label="קשיי הסתגלות"
              value={2}
            />
            <GaugeCard
              max={5}
              display="number"
              label="קשב מתמשך"
              value={3}
            />
            <GaugeCard
              max={5}
              display="number"
              label="התאמה לקצונה"
              value={4}
            />
          </div>
          <div className="w-full md:flex-[1] md:min-w-0">
            <MaahCard
              hovered={
                !isMobile && hoveredCard?.label === 'יום המא"ה'
              }
              onMouseEnter={() => {
                if (!isMobile)
                  setHoveredCard({
                    label: 'יום המא"ה',
                    value: 0,
                  });
              }}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={handleMouseMove}
            />
          </div>
        </div>
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

function EducationContent() {
  return (
    // בדסקטופ: תיכון ובגרויות זה לצד זה עם קו מפריד
    <div className="p-5 grid md:grid-cols-2 gap-5 md:gap-0">
      <div className="md:pl-5 md:border-l md:border-[rgba(23,28,35,0.08)]">
        <SubSection title="תיכון" />
        <div className="flex flex-wrap gap-5 justify-start">
          <InfoField
            label="שנת לימודים"
            value={`התשמ"ט - התשנ"ט`}
          />
          <InfoField
            label="שם המוסד"
            value={`תיכוני לא מקצועי בחו"ל`}
          />
        </div>
      </div>
      <div className="md:pr-5">
        <SubSection title="בגרויות" />
        <div className="flex flex-wrap gap-2">
          {[
            { subject: "תורת החשמל", units: 5 },
            { subject: "אמנות", units: 5 },
            { subject: "גיאוגרפיה", units: 5 },
          ].map(({ subject, units }) => (
            <div
              key={subject}
              className="flex items-center gap-1.5 bg-white border border-[rgba(0,143,240,0.35)] rounded-full px-3.5 py-1.5"
            >
              <span className="text-[#171c23] text-[14px] font-semibold whitespace-nowrap">
                {subject}
              </span>
              <span className="text-[#008ff0] text-[13px] font-bold whitespace-nowrap">
                · {units} יח"ל
              </span>
            </div>
          ))}
        </div>
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

function CompanionsCardHeader({
  count,
  onAdd,
}: {
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="h-[60px] flex items-center justify-between px-5 border-b border-[rgba(23,28,35,0.05)] shrink-0">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-[#171c23] text-[18px]">
          פרטי מלווים
        </h3>
        <p className="text-[#171c23] text-[13px] opacity-50 hidden sm:block">
          {count} מתוך {MAX_COMPANIONS} מלווים
        </p>
      </div>
      <AddCompanionBtn
        disabled={count >= MAX_COMPANIONS}
        onClick={onAdd}
      />
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
  const [openKey, setOpenKey] = useState<string | null>(null);

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

      {/* Desktop: כרטיסים ברוחב מלא בגובה טבעי - אין שטחים מתים,
          וכל כרטיס (למשל מלווים) יכול לגדול בחופשיות */}
      <div className="hidden md:flex flex-col gap-5">
        <div className="bg-white rounded-[10px]">
          <CardHeader title="מידע אישי" />
          {personalContent}
        </div>
        <div className="bg-white rounded-[10px]">
          <CardHeader title="השכלה" />
          <EducationContent />
        </div>
        <div className="bg-white rounded-[10px]">
          <CardHeader title="פרטי הורים" />
          {parentsContent}
        </div>
        <div className="bg-white rounded-[10px]">
          <CompanionsCardHeader
            count={companions.length}
            onAdd={() => setCompanionForm("new")}
          />
          {companionsContent}
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="md:hidden flex flex-col gap-3">
        {personalSections.map(({ key, label }) => {
          const isOpen = openKey === key;
          return (
            <div
              key={key}
              className="bg-white rounded-[10px] overflow-hidden"
            >
              {/* Header row — always visible */}
              <button
                onClick={() => setOpenKey(isOpen ? null : key)}
                className="w-full h-[64px] flex items-center justify-between px-5"
              >
                <span className="font-bold text-[#171c23] text-[18px]">
                  {label}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-[#171c23] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {/* Expanded content — same card */}
              {isOpen && (
                <div className="border-t border-[rgba(23,28,35,0.05)]">
                  {key === "personal" && personalContent}
                  {key === "education" && <EducationContent />}
                  {key === "parents" && parentsContent}
                  {key === "companions" && (
                    <>
                      {/* Mobile companions header: no title (already in accordion button) */}
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
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState<Page>("profile");
  // ערכת נושא - משנה צבע מותג, רקע וגרדיאנטים (הכותרת העליונה לא משתנה)
  const [themeId, setThemeId] = useState(DEFAULT_THEME.id);
  const theme = getTheme(themeId);

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
      style={{
        ...themeVars(theme),
        fontFamily: "'Noto Sans Hebrew', sans-serif",
        backgroundColor: theme.pageBg,
        backgroundImage: heroGradientBg(
          theme,
          isMobile ? -200 : 0,
          isMobile ? 1 : 1.4,
          isMobile ? 1 : 0.7,
        ),
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
      className={`min-h-[100dvh] flex flex-col ${theme.dark ? "dark" : ""}`}
    >
      {/* בתוך השאלון הטאב "משימות וזימונים" נשאר מסומן */}
      <Header
        activePage={page === "hobbiesForm" ? "tasks" : page}
        onNavigate={setPage}
        unreadCount={unreadMessages}
        navGradient={theme.navGradient}
      />
      <main className="flex-1 flex flex-col">
        {page === "learnings" ? (
          <LearningsPage />
        ) : page === "tasks" ? (
          <TasksAppointmentsPage
            onViewAllAppointments={() => setPage("appointments")}
            onOpenTask={() => setPage("hobbiesForm")}
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