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
} from "lucide-react";
import meitavLogoSvg from '../imports/meitavLogoSvg.svg';
import logoimg from '../imports/logoimg.png';
import LearningsPage from './components/LearningsPage';
import TasksAppointmentsPage from './components/TasksAppointmentsPage';
import MyAppointmentsPage from './components/MyAppointmentsPage';
import HobbiesQuestionnairePage from './components/HobbiesQuestionnairePage';

type Page =
  | "profile"
  | "learnings"
  | "tasks"
  | "appointments"
  | "hobbiesForm";

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
      className={`bg-[#008FF0] flex items-center justify-center rounded-full shrink-0 ${className ?? "w-9 h-9"}`}
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
    explanation: `תפקיד יום המא"ה הוא לבחון את יכולות המלש"בים והמלש"ביות במגוון מיומנויות על מנת להתאים שיבוץ מיטבי המשלב בין צרכי הצבא, יכולות הפרט ורצונותיו.`,
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
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-bold text-[#171c23] text-[16px]">
          {label}
        </span>
        {value > 0 && (
          <span className="font-bold text-[#008FF0] text-[20px]">
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  return (
    <div className="fixed inset-0 z-[400]" dir="rtl">
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out"
        style={{
          transform: visible
            ? "translateY(0)"
            : "translateY(100%)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[rgba(23,28,35,0.15)]" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(23,28,35,0.08)]">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[#171c23] text-[18px]">
              {label}
            </span>
            <span className="font-bold text-[#008FF0] text-[22px]">
              {value}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-60 hover:opacity-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5 pb-8">
          <p className="text-[#171c23] text-[15px] leading-relaxed text-right whitespace-pre-line">
            {info?.explanation}
          </p>
        </div>
      </div>
    </div>
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
          stroke="#F5F6FA"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 170 90 A 80 80 0 0 0 10 90"
          fill="none"
          stroke="#008FF0"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${arc}`}
        />
      </svg>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center leading-none pb-1">
        <span className="font-bold text-[#171c23] text-[30px] tracking-tight">
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
      className={`bg-white rounded-[10px] flex-1 min-w-0 p-5 flex flex-col items-center ${display === "number" ? "justify-between" : ""} gap-2 transition-all duration-200 select-none ${interactive ? "cursor-pointer" : ""}`}
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
      <p className="font-bold text-[#171c23] text-[18px] text-right w-full flex items-center gap-1.5">
        {label}
        <Info
          size={15}
          className="hidden md:inline-block shrink-0 opacity-40"
        />
      </p>
      {display === "number" ? (
        <p className="font-black text-[#008ff0] text-[60px] sm:text-[70px] leading-none tracking-tight">
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
      <p className="md:hidden text-[#171c23] text-[14px] text-right w-full opacity-70">
        לחצ/י למידע נוסף
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  interactive,
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-[10px] flex-1 min-w-0 p-5 flex flex-col items-center justify-between gap-2 ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <p className="font-bold text-[#171c23] text-[18px] text-right w-full">
        {label}
      </p>
      <p className="font-black text-[#008ff0] text-[60px] sm:text-[70px] leading-none tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-[#171c23] text-[14px] text-right w-full opacity-70">
          {subtitle}
        </p>
      )}
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

function EditIconBtn() {
  return (
    <div className="bg-[rgba(0,143,240,0.1)] w-8 h-8 rounded-full flex items-center justify-center shrink-0">
      <Pencil size={11} className="text-[#008ff0]" />
    </div>
  );
}

function RemoveAuthBtn() {
  return (
    <button className="bg-[rgba(0,143,240,0.1)] text-[#008ff0] text-[14px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">
      הסרת הרשאה
    </button>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function Header({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navTabs = [
    "פניות",
    "לומדות",
    "הודעות",
    "משימות וזימונים",
    "הזימונים שלי",
    "פרופיל אישי",
  ];
  const tabToPage: Record<string, Page> = {
    לומדות: "learnings",
    "פרופיל אישי": "profile",
    "משימות וזימונים": "tasks",
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
        className="text-white"
        style={{
          background:
            "linear-gradient(-11.751deg, rgb(36,83,119) 6%, rgb(19,131,208) 48%, rgb(0,143,240) 102%, rgb(93,184,245) 113%)",
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
            <LogOut
              size={17}
              className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="cursor-pointer opacity-80 hover:opacity-100"
            >
              <path
                d="M9 1C4.6 1 1 4.6 1 9s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 10.5a6 6 0 0 1-4.6-2.1C5.6 11.4 7.2 10.5 9 10.5s3.4.9 4.6 2.4A6 6 0 0 1 9 14.5z"
                fill="white"
              />
            </svg>
            <Bell
              size={17}
              className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            />
            <div className="w-px h-6 bg-white/20 mx-1" />
            <div className="bg-white/20 rounded-full px-4 h-8 flex items-center gap-2 w-[220px]">
              <Search size={15} />
              <span className="text-white/70 text-[14px]">
                חיפוש
              </span>
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
            <Bell size={17} />
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M9 1C4.6 1 1 4.6 1 9s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 10.5a6 6 0 0 1-4.6-2.1C5.6 11.4 7.2 10.5 9 10.5s3.4.9 4.6 2.4A6 6 0 0 1 9 14.5z"
                fill="white"
              />
            </svg>
            <LogOut size={17} />
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#122736]">
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
        )}
      </div>
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
  return (
    <div
      className="bg-white rounded-[10px] p-5 flex flex-col gap-4 transition-all duration-200"
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
      <div className="flex items-center justify-start gap-2">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          className="shrink-0"
        >
          <circle cx="14" cy="14" r="14" fill="#008FF0" />
          <path
            d="M8 14l4 4 8-8"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="font-bold text-[#171c23] text-[18px] flex items-center gap-1.5">
          יום המא"ה (מיון, איתור והתאמה)
          <Info
            size={15}
            className="hidden md:inline-block shrink-0 opacity-40"
          />
        </h3>
      </div>
      <p className="md:hidden text-[#171c23] text-[14px] text-right leading-relaxed">
        {`תפקיד יום המא"ה הוא לבחון את יכולות המלש"בים והמלש"ביות במגוון מיומנויות על מנת להתאים שיבוץ מיטבי.`}
      </p>
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        {qualityScores.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center min-w-[80px]"
          >
            <span className="text-[#2f305c] text-[12px] opacity-70 text-center leading-tight">
              {item.label}
            </span>
            <span className="font-semibold text-[#2f305c] text-[20px]">
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

      <div className="flex flex-col md:flex-row gap-4 items-start">

        <div className="flex flex-col gap-4 w-full md:flex-[2] md:min-w-0 md:self-stretch">
          {/* Row 1 */}
          <div className="flex gap-4 flex-1">
            <KpiCard
              label="ימים לגיוס"
              value={186}
              subtitle="תאריך גיוס משוער 01.01.2027"
            />
            <GaugeCard max={90} {...gaugeProps('דפ"ר', 30)} />
          </div>
          {/* Row 2 */}
          <div className="flex gap-4 flex-1">
            <GaugeCard max={8} {...gaugeProps("עברית", 8)} />
            <GaugeCard
              max={97}
              display="number"
              {...gaugeProps("פרופיל רפואי", 97)}
            />
          </div>
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
    </section>
  );
}

// ── Personal Detail Cards ─────────────────────────────────────────────────────

function PersonalInfoContent() {
  return (
    <div className="p-5 flex flex-col gap-6">
      <div>
        <SubSection title="פרטים אישיים" />
        <div className="flex items-center gap-2 mb-4">
          <ProfileAvatar className="w-9 h-9" />
          <InfoField label="שם מלא" value="ישראלה ישראלית" />
        </div>
        <div className="flex flex-wrap gap-5 justify-start mb-4">
          <InfoField label="מגדר" value="נקבה" />
          <InfoField label="סטטוס זוגי" value="נשוא/ה" />
          <InfoField label="תאריך לידה" value="01.01.1990" />
        </div>
        <div className="flex flex-wrap gap-5 justify-start mb-4">
          <InfoField label="ארץ לידה" value="-" />
          <InfoField label="אזרחות" value="ישראלית" />
          <InfoField label="רב קו" value="2564376487" />
        </div>
        <div>
          <InfoField
            label="כתובת"
            value="באר שבע, רחוב כלנית 32, דירה 5"
          />
        </div>
      </div>
      <div>
        <SubSection title="דרכים ליצירת קשר" />
        <div className="flex flex-wrap gap-5">
          <InfoField label="טלפון" value="0500000000" />
          <InfoField label="אימייל" value="israela@gmail.com" />
          <InfoField
            label="כתובת למשלוח דואר"
            value="באר שבע, רחוב כלנית 32, דירה 5"
          />
        </div>
      </div>
    </div>
  );
}

function EducationContent() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div>
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
      <div>
        <SubSection title="בגרויות" />
        <div className="flex flex-wrap gap-5 justify-start">
          <InfoField
            label="5 יחידות לימוד"
            value="תורת החשמל"
          />
          <InfoField label="5 יחידות לימוד" value="אמנות" />
          <InfoField label="5 יחידות לימוד" value="גיאוגרפיה" />
        </div>
      </div>
    </div>
  );
}

function ParentEntry({
  name,
  relation,
  id,
  email,
  phone,
  address,
}: {
  name: string;
  relation: string;
  id: string;
  email: string;
  phone: string;
  address: string;
}) {
  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-[rgba(23,28,35,0.05)] last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-[#171c23] text-[16px]">
          {name}
        </p>
        <EditIconBtn />
      </div>
      <div className="flex flex-wrap gap-5">
        <InfoField label="שם מלא" value={name} />
        <InfoField label="קרבה" value={relation} />
        <InfoField label="תעודת זהות" value={id} />
      </div>
      <div className="flex flex-wrap gap-5">
        <InfoField label="טלפון" value={phone} />
        <InfoField label="אימייל" value={email} />
        <InfoField label="כתובת מגורים" value={address} />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <RemoveAuthBtn />
        <InfoField label="סטטוס הרשאה" value="מאושרת" />
      </div>
    </div>
  );
}

function ParentsContent() {
  return (
    <div className="p-5 flex flex-col gap-4">
      <ParentEntry
        name="דני ישראלית"
        relation="אב"
        id="211716293"
        email="dani@gmail.com"
        phone="0500000000"
        address="באר שבע, רחוב כלנית 32, דירה 5"
      />
      <ParentEntry
        name="שירי ישראלית"
        relation="אם"
        id="211716293"
        email="shiri@gmail.com"
        phone="0500000000"
        address="באר שבע, רחוב כלנית 32, דירה 5"
      />
    </div>
  );
}

function CompanionEntry({
  role,
  name,
  id,
  email,
  phone,
}: {
  role: string;
  name: string;
  id: string;
  email: string;
  phone: string;
}) {
  return (
    <div className="flex flex-col gap-3 pb-5 border-b border-[rgba(23,28,35,0.05)] last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-[#171c23] text-[16px]">
          {role}
        </p>
        <EditIconBtn />
      </div>
      <div className="flex flex-wrap gap-5">
        <InfoField label="שם מלא" value={name} />
        <InfoField label="תעודת זהות" value={id} />
      </div>
      <div className="flex flex-wrap gap-5">
        <InfoField label="טלפון" value={phone} />
        <InfoField label="אימייל" value={email} />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <RemoveAuthBtn />
        <InfoField label="סטטוס הרשאה" value="מאושרת" />
      </div>
    </div>
  );
}

function CompanionsContent() {
  return (
    <div className="p-5">
      <CompanionEntry
        role="עובדת סוציאלית"
        name="רונית כץ"
        id="211716293"
        email="ronit@gmail.com"
        phone="0500000000"
      />
    </div>
  );
}

function CompanionsCardHeader() {
  return (
    <div className="h-[60px] flex items-center justify-between px-5 border-b border-[rgba(23,28,35,0.05)] shrink-0">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-[#171c23] text-[18px]">
          פרטי מלווים
        </h3>
        <p className="text-[#171c23] text-[13px] opacity-50 hidden sm:block">
          ניתן להוסיף עד שני מלווים
        </p>
      </div>
      <button className="bg-[#008ff0] text-white text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">
        הוספת מלווה
      </button>
    </div>
  );
}

// ── Personal Section ──────────────────────────────────────────────────────────

const personalSections = [
  {
    key: "personal",
    label: "מידע אישי",
    Content: PersonalInfoContent,
  },
  {
    key: "education",
    label: "השכלה",
    Content: EducationContent,
  },
  {
    key: "parents",
    label: "פרטי הורים",
    Content: ParentsContent,
  },
  {
    key: "companions",
    label: "פרטי מלווים",
    Content: CompanionsContent,
  },
];

function PersonalSection() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section className="px-4 sm:px-6 md:px-10 py-6 pb-12">
      <div className="text-right mb-6">
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
          פרטים אישיים<span className="text-[#69c600]">.</span>
        </h2>
      </div>

      {/* Desktop: 2-column grid */}
      <div className="hidden md:grid grid-cols-2 gap-5">
        <div className="bg-white rounded-[10px] flex flex-col">
          <CardHeader title="מידע אישי" />
          <PersonalInfoContent />
        </div>
        <div className="bg-white rounded-[10px] flex flex-col">
          <CardHeader title="השכלה" />
          <EducationContent />
        </div>
        <div className="bg-white rounded-[10px] flex flex-col">
          <CardHeader title="פרטי הורים" />
          <ParentsContent />
        </div>
        <div className="bg-white rounded-[10px] flex flex-col">
          <CompanionsCardHeader />
          <CompanionsContent />
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="md:hidden flex flex-col gap-3">
        {personalSections.map(({ key, label, Content }) => {
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
                <span className="font-bold text-[#171c23] text-[17px]">
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
                  {key === "companions" ? (
                    <>
                      {/* Mobile companions header: no title (already in accordion button) */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(23,28,35,0.05)]">
                        <p className="text-[#171c23] text-[13px] opacity-50">
                          ניתן להוסיף עד שני מלווים
                        </p>
                        <button className="bg-[#008ff0] text-white text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">
                          הוספת מלווה
                        </button>
                      </div>
                      <CompanionsContent />
                    </>
                  ) : (
                    <Content />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function getHeroGradientSvg(blueOffsetX: number, blobScale: number, blobOpacityScale: number) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <defs>
    <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <linearGradient id="line-fade-bottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="line-fade-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <g filter="url(#blob-blur)">
    <ellipse cx="380" cy="530" rx="${250 * blobScale}" ry="${200 * blobScale}" fill="#008FF0" opacity="${0.16 * blobOpacityScale}" />
    <ellipse cx="${1180 + blueOffsetX}" cy="340" rx="${340 * blobScale}" ry="${270 * blobScale}" fill="#008FF0" opacity="${0.18 * blobOpacityScale}" />
    <ellipse cx="600" cy="750" rx="${150 * blobScale}" ry="${120 * blobScale}" fill="#69c600" opacity="${0.2 * blobOpacityScale}" />
  </g>
  <g stroke-width="140" fill="none">
    <circle cx="130" cy="520" r="260" stroke="url(#line-fade-bottom)" />
    <circle cx="${1260 + blueOffsetX}" cy="380" r="260" stroke="url(#line-fade-top)" />
  </g>
</svg>`.trim();
}

function getHeroGradientBg(blueOffsetX: number, blobScale: number, blobOpacityScale: number) {
  return `url("data:image/svg+xml,${encodeURIComponent(getHeroGradientSvg(blueOffsetX, blobScale, blobOpacityScale))}")`;
}

export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState<Page>("profile");
  return (
    <div
      dir="rtl"
      lang="he"
      style={{
        fontFamily: "'Noto Sans Hebrew', sans-serif",
        backgroundColor: "#f5f5f7",
        backgroundImage: getHeroGradientBg(isMobile ? -200 : 0, isMobile ? 1 : 1.4, isMobile ? 1 : 0.7),
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
      className="min-h-screen"
    >
      {/* בתוך השאלון הטאב "משימות וזימונים" נשאר מסומן */}
      <Header
        activePage={page === "hobbiesForm" ? "tasks" : page}
        onNavigate={setPage}
      />
      <main>
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