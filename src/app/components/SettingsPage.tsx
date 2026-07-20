import { useState } from "react";
import { Check } from "lucide-react";
import { SectionHeading } from "./TasksAppointmentsPage";
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
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 cursor-pointer ${
        checked ? "bg-[#008ff0]" : "bg-[rgba(23,28,35,0.2)]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-all duration-200 ${
          checked ? "left-0.5" : "left-[22px]"
        }`}
      />
    </button>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // כל ההגדרות מאושרות כברירת מחדל
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        settingsGroups.flatMap((group) =>
          group.items.map((item) => [item.id, true]),
        ),
      ),
  );
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      {/* בדסקטופ העמודה ממורכזת - טופס צר בעמודה אחת נעים יותר לעין במרכז */}
      <div className="md:max-w-[640px] md:mx-auto">
        <SectionHeading title="הגדרות" />

        <div className="flex flex-col gap-5">
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
                    checked={!!enabled[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                </div>
              ))}
            </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-[#4e9400] text-[14px] font-semibold">
                <Check size={15} className="shrink-0" />
                ההגדרות נשמרו בהצלחה
              </span>
            )}
            <button
              onClick={handleSave}
              className="bg-[#008ff0] text-white text-[15px] font-semibold px-8 py-2.5 rounded-full whitespace-nowrap transition-colors hover:bg-[#0080d6]"
            >
              שמירה
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
