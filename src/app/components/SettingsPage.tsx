import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Theme } from "../themes";
import {
  SectionHeading,
  Breadcrumbs,
} from "./TasksAppointmentsPage";
import {
  CONTROL_SIZE,
  ELEVATION,
  PAGE_CONTAINER,
} from "./primitives";
import { GLASS_CARD } from "./ui/utils";

// ── Data ────────────────────────────────────────────────────────────────────

interface SettingItem {
  id: string;
  label: string;
}

interface SettingsGroup {
  key: string;
  title: string;
  /** טקסט הסבר אופציונלי המוצג באפור בראש הכרטיס */
  description?: string;
  items: SettingItem[];
}

const settingsGroups: SettingsGroup[] = [
  {
    key: "notifications",
    title: "הודעות והתראות",
    items: [
      {
        id: "email",
        label:
          "אני מאשר/ת קבלת הודעות לתיבת הדואר האלקטרוני שלי",
      },
      {
        id: "digital-only",
        label:
          "אני מעוניין/ת ומאשר/ת כי צווים וזימונים עתידיים לרבות צווי גיוס יישלחו אליי רק באמצעות אתר ואפליקציית מתגייסים",
      },
      {
        id: "push",
        label:
          'אני מאשר/ת קבלת התראות ("הודעות פוש") מהאפליקציה',
      },
      {
        id: "sms",
        label: "אני מאשר/ת קבלת מסרונים (SMS) לנייד שלי",
      },
    ],
  },
  {
    key: "club",
    title: "מועדון יותר",
    description:
      'מועדון "יותר" - מועדון ההטבות לחיילים. הוקם ביוזמה מיוחדת של "יחד למען החייל", ששמה לעצמה את יעד התמיכה בחיילים בראש סדר העדיפויות. אליה נרתמו מאות בתי עסק בארץ, שמעניקים לחברי המועדון מגוון הטבות בתחומים שונים כמו תרבות, פנאי וצרכנות.',
    items: [
      {
        id: "club-marketing",
        label:
          'אני מאשר/ת קבלת חומר פרסומי ממועדון "יותר" למייל ולנייד האישי שלי',
      },
    ],
  },
];

// ── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({
  label,
  checked,
  onChange,
}: {
  /** שם המתג לקורא מסך */
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 cursor-pointer ${
        checked ? "bg-[#008ff0]" : "bg-[rgba(23,28,35,0.2)]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#ffffff] shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-all duration-200 ${
          checked ? "left-0.5" : "left-[22px]"
        }`}
      />
    </button>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

interface ThemePickerProps {
  themes: Theme[];
  themeId: string;
  onThemeChange: (id: string) => void;
}

/** העיגול שמציג את צבעי הערכה */
function themeSwatch(t: Theme) {
  if (t.accents) {
    // ערכה צבעונית - העיגול מציג את כל הגוונים
    const brands = Object.values(t.accents).map((a) => a.brand);
    return `conic-gradient(${brands.join(",")}, ${brands[0]})`;
  }
  // בערכה עם כרטיסים כהים חצי העיגול מראה את צבע הכרטיס
  return t.surface
    ? `linear-gradient(135deg, ${t.surface} 0 50%, ${t.brand} 50% 100%)`
    : t.navGradient;
}

function ThemeDot({ theme, size }: { theme: Theme; size: string }) {
  return (
    <span
      className={`${size} rounded-full shrink-0 border border-[rgba(23,28,35,0.08)]`}
      style={{ background: themeSwatch(theme) }}
    />
  );
}

/** דסקטופ - כל הערכות גלויות ברשת */
function ThemeGrid({
  themes,
  themeId,
  onThemeChange,
}: ThemePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="ערכת נושא"
      className="hidden sm:grid grid-cols-3 gap-3"
    >
      {themes.map((t) => {
        const active = t.id === themeId;
        return (
          <button
            key={t.id}
            role="radio"
            aria-checked={active}
            onClick={() => onThemeChange(t.id)}
            className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-colors ${
              active
                ? "border-[#008ff0] bg-[rgba(0,143,240,0.08)]"
                : "border-[rgba(23,28,35,0.12)] hover:border-[rgba(0,143,240,0.2)]"
            }`}
          >
            <ThemeDot theme={t} size="w-8 h-8" />
            <span className="text-[#171c23] text-[14px] font-semibold">
              {t.name}
            </span>
            {active && (
              <Check
                size={15}
                className="text-[#008ff0] shrink-0 mr-auto"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** מובייל - בהיר / כהה / צבעים, והערכות הצבעוניות בתפריט נפתח */
function ThemeSegments({
  themes,
  themeId,
  onThemeChange,
}: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const colorThemes = themes.filter(
    (t) => t.id !== "light" && t.id !== "dark",
  );
  const activeColor = colorThemes.find((t) => t.id === themeId);
  const segment = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1 ${CONTROL_SIZE} whitespace-nowrap transition-colors ${
      active
        ? "bg-white text-[#008ff0] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        : "text-[rgba(23,28,35,0.62)]"
    }`;

  return (
    <div ref={ref} className="sm:hidden relative">
      <div className="flex items-center gap-1 rounded-full bg-[rgba(23,28,35,0.06)] p-1">
        {[
          { id: "light", label: "בהיר" },
          { id: "dark", label: "כהה" },
        ].map(({ id, label }) => (
          <button
            key={id}
            aria-pressed={themeId === id}
            onClick={() => {
              onThemeChange(id);
              setOpen(false);
            }}
            className={segment(themeId === id)}
          >
            {label}
          </button>
        ))}
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen(!open)}
          className={segment(!!activeColor)}
        >
          {activeColor && (
            <ThemeDot theme={activeColor} size="w-3 h-3" />
          )}
          {activeColor?.name ?? "צבעים"}
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-2 w-44 bg-white rounded-[10px] p-1 z-30"
          style={{ boxShadow: ELEVATION.overlay }}
        >
          {colorThemes.map((t) => (
            <button
              key={t.id}
              role="menuitemradio"
              aria-checked={t.id === themeId}
              onClick={() => {
                onThemeChange(t.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-right"
            >
              <ThemeDot theme={t} size="w-5 h-5" />
              <span className="text-[#171c23] text-[14px] font-semibold">
                {t.name}
              </span>
              {t.id === themeId && (
                <Check
                  size={15}
                  className="text-[#008ff0] shrink-0 mr-auto"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage({
  onNavigateHome,
  themes,
  themeId,
  onThemeChange,
  classicVersion,
  onClassicVersionChange,
}: {
  onNavigateHome?: () => void;
  themes: Theme[];
  themeId: string;
  onThemeChange: (id: string) => void;
  classicVersion: boolean;
  onClassicVersionChange: (next: boolean) => void;
}) {
  // כל ההגדרות מאושרות כברירת מחדל
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        settingsGroups.flatMap((group) =>
          group.items.map((item) => [item.id, true]),
        ),
      ),
  );

  const toggle = (id: string) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      {/* בדסקטופ העמודה ממורכזת - טופס צר בעמודה אחת נעים יותר לעין במרכז */}
      <div className={PAGE_CONTAINER}>
        <Breadcrumbs
          items={[
            { label: "אזור אישי", onClick: onNavigateHome },
            { label: "הגדרות" },
          ]}
        />
        <SectionHeading title="הגדרות" heroTitle />

        <div className="flex flex-col gap-5">
          {/* relative z-20 - התפריט הנפתח צריך לעבור מעל הכרטיסים שמתחת */}
          <div className={`${GLASS_CARD} rounded-[10px] relative z-20`}>
            <div className="h-[60px] flex items-center justify-start px-5 border-b border-[rgba(23,28,35,0.05)]">
              <h3 className="font-bold text-[#171c23] text-[18px]">
                תצוגה
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[#171c23] text-[15px] text-right leading-relaxed">
                  גרסה עם תמונות
                </p>
                <Toggle
                  label="גרסה עם תמונות"
                  checked={classicVersion}
                  onChange={() =>
                    onClassicVersionChange(!classicVersion)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[#171c23] text-[15px] text-right leading-relaxed">
                  ערכת נושא
                </p>
                <ThemeGrid
                  themes={themes}
                  themeId={themeId}
                  onThemeChange={onThemeChange}
                />
                <ThemeSegments
                  themes={themes}
                  themeId={themeId}
                  onThemeChange={onThemeChange}
                />
              </div>
            </div>
          </div>
          {settingsGroups.map((group) => (
            <div
              key={group.key}
              className={`${GLASS_CARD} rounded-[10px]`}
            >
            <div className="h-[60px] flex items-center justify-start px-5 border-b border-[rgba(23,28,35,0.05)]">
              <h3 className="font-bold text-[#171c23] text-[18px]">
                {group.title}
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {group.description && (
                <p className="text-[#171c23] text-[14px] text-right leading-relaxed opacity-60">
                  {group.description}
                </p>
              )}
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4"
                >
                  <p className="text-[#171c23] text-[15px] text-right leading-relaxed">
                    {item.label}
                  </p>
                  <Toggle
                    label={item.label}
                    checked={!!enabled[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                </div>
              ))}
            </div>
            </div>
          ))}

          <p className="text-[#171c23] text-[13px] opacity-60 text-right">
            השינויים נשמרים אוטומטית
          </p>
        </div>
      </div>
    </section>
  );
}
