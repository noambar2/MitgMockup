import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Check,
  Send,
} from "lucide-react";

// ── Options ─────────────────────────────────────────────────────────────────

const HOBBY_OPTIONS = [
  "צילום",
  "ספורט",
  "מוזיקה",
  "קריאה",
  "בישול",
  "גיימינג",
  "אחר",
];

const EXPERIENCE_OPTIONS = [
  "פחות משנה",
  "1-3",
  "3-5",
  "5 ומעלה",
];

const DOMAIN_OPTIONS = [
  "Office",
  "עיצוב גרפי",
  "תכנות",
  "עריכת וידאו",
  "רשתות חברתיות",
];

type YesNo = "כן" | "לא";

// ── Form primitives ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-right font-semibold text-[#171c23] text-[16px] mb-2.5">
      {children} <span className="text-[#e05252]">*</span>
    </p>
  );
}

function Select({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string | null;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-white border rounded-[10px] px-4 py-3 flex items-center justify-between gap-2 text-right transition-colors ${
          open
            ? "border-[#008ff0]"
            : "border-[rgba(23,28,35,0.12)] hover:border-[rgba(23,28,35,0.25)]"
        }`}
      >
        <span
          className={`text-[15px] ${value ? "text-[#171c23]" : "text-[rgba(23,28,35,0.4)]"}`}
        >
          {value ?? placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#171c23] opacity-50 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute z-20 top-full mt-1.5 w-full bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] max-h-56 overflow-y-auto py-1"
            style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full text-right px-4 py-2.5 text-[15px] transition-colors hover:bg-[rgba(0,143,240,0.06)] ${
                  option === value
                    ? "text-[#008ff0] font-semibold"
                    : "text-[#171c23]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function YesNoRadio({
  value,
  onChange,
}: {
  value: YesNo | null;
  onChange: (value: YesNo) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {(["כן", "לא"] as YesNo[]).map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
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
            <span className="text-[#171c23] text-[15px]">
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ControlScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div dir="ltr" className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        {[1, 2, 3, 4, 5].map((level) => {
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`flex-1 h-[52px] rounded-[10px] text-[18px] font-semibold border transition-colors ${
                selected
                  ? "bg-[rgba(0,143,240,0.06)] border-[#008ff0] text-[#008ff0]"
                  : "bg-white border-[rgba(23,28,35,0.12)] text-[#171c23] hover:bg-[rgba(0,143,240,0.06)]"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-[#171c23] opacity-60">
        <span>שליטה באופן נמוך</span>
        <span>שליטה באופן גבוה</span>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 bg-[#008ff0] text-white text-[15px] font-semibold px-8 py-2.5 rounded-full whitespace-nowrap transition-colors hover:bg-[#0080d6] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-transparent border border-[#008ff0] text-[#008ff0] text-[15px] font-semibold px-8 py-2.5 rounded-full whitespace-nowrap transition-colors hover:bg-[rgba(0,143,240,0.06)]"
    >
      {children}
    </button>
  );
}

// ── Steps content ────────────────────────────────────────────────────────────

const TOTAL_QUESTION_STEPS = 2;

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-[6px] rounded-full bg-[rgba(23,28,35,0.08)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#008ff0] transition-all duration-300"
          style={{
            width: `${(current / TOTAL_QUESTION_STEPS) * 100}%`,
          }}
        />
      </div>
      <span className="text-[13px] text-[#171c23] opacity-60 text-right">
        שלב {current} מתוך {TOTAL_QUESTION_STEPS}
      </span>
    </div>
  );
}

function IntroContent() {
  return (
    <div className="flex flex-col">
      <h3 className="font-bold text-[#122736] text-[22px] sm:text-[24px] tracking-tight text-right mb-4">
        שלום ישראלה! ברוכה הבאה לשאלון תחביבים
        <span className="text-[#69c600]">.</span>
      </h3>
      <div className="text-right text-[#171c23] text-[15px] leading-relaxed flex flex-col gap-3">
        <p>
          בשאלון זה הנך מתבקש/ת לתאר את עצמך ותחומים מסוימים
          בחייך. השאלון נועד לסייע לגורמי המיון והשיבוץ בצבא
          לכוון אותך לתפקידים שיתאימו, עד כמה שניתן, לכישוריך
          ולתחומי העניין שלך.
        </p>
        <p>
          השאלון הוא אישי וכולל פרטים הנוגעים לך בלבד. על כל
          הפרטים שתמסור/י חלה חובת סודיות והם ישמשו את גורמי
          המיון המקצועיים בצה"ל.
        </p>
        <p>
          לשאלות המופיעות בשאלון אין תשובות "נכונות" או "לא
          נכונות". חשוב למלא את השאלון בכנות, כיוון שהוא יסייע
          לצבא לשבץ אותך לתפקידים המתאימים לך.
        </p>
        <p>
          השאלות הן ברובן שאלות סגורות ("אמריקאיות") והן יופיעו
          באחד מהאופנים הבאים:
        </p>
        <ul className="list-disc pr-5 flex flex-col gap-1">
          <li>בחירת תשובה מתוך מספר אפשרויות</li>
          <li>בחירה מתוך רשימה</li>
        </ul>
        <p className="font-semibold">שימו לב:</p>
        <ul className="list-disc pr-5 flex flex-col gap-1">
          <li>
            בחלק מהשאלות ניתן להשיב תשובה אחת בלבד ובחלקן יותר
            מתשובה אחת
          </li>
          <li>בשאלות עם בחירה מרובה תופיע הנחיה מתאימה</li>
          <li>
            לעיתים תופיע האפשרות "אחר" ולצידה מקום להזנת טקסט
            חופשי
          </li>
        </ul>
        <p>
          ניתן לחזור למסך קודם לצורך תיקון תשובות, וכן להתקדם
          למסך הבא באמצעות כפתורי ניווט.
        </p>
        <p>
          אנו מודים לך על שיתוף הפעולה ומאחלים לך שירות צבאי
          מוצלח ופורה.
        </p>
      </div>
    </div>
  );
}

function SuccessContent() {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div className="bg-[rgba(105,198,0,0.12)] w-16 h-16 rounded-full flex items-center justify-center">
        <Check size={30} className="text-[#69c600]" />
      </div>
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
        השאלון הוגש בהצלחה
        <span className="text-[#69c600]">.</span>
      </h3>
      <p className="text-[#171c23] text-[15px] opacity-60 max-w-[340px]">
        תודה על שיתוף הפעולה! התשובות שלך נשמרו ויועברו לגורמי
        המיון והשיבוץ
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Step = "intro" | 1 | 2 | "success";

export default function HobbiesQuestionnairePage({
  onExit,
}: {
  onExit: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");

  // Step 1 answers
  const [hobby, setHobby] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(
    null,
  );
  const [wasCounselor, setWasCounselor] = useState<YesNo | null>(
    null,
  );
  const [counselorYears, setCounselorYears] = useState("");

  // Step 2 answers
  const [volunteered, setVolunteered] = useState<YesNo | null>(
    null,
  );
  const [domain, setDomain] = useState<string | null>(null);
  const [controlLevel, setControlLevel] = useState<number | null>(
    null,
  );

  const step1Valid =
    hobby !== null &&
    experience !== null &&
    wasCounselor !== null &&
    (wasCounselor === "לא" || counselorYears.trim() !== "");

  const step2Valid =
    volunteered !== null &&
    domain !== null &&
    controlLevel !== null;

  const showProgress = step === 1 || step === 2;

  return (
    // ה-section נמתח (flex-1) עד תחתית הדף, כך שכפתורי הניווט הדביקים תמיד בתחתית המסך
    <section className="bg-white px-4 sm:px-6 md:px-10 pt-6 flex flex-col flex-1">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[14px] mb-4">
        <button
          type="button"
          onClick={onExit}
          className="text-[#008ff0] font-semibold hover:underline underline-offset-4"
        >
          משימות
        </button>
        <ChevronLeft
          size={14}
          className="text-[#171c23] opacity-40 shrink-0"
        />
        <span className="text-[#171c23] opacity-70">
          שאלון תחביבים
        </span>
      </nav>

      {/* Sticky progress - נשאר צמוד להדר גם בגלילה */}
      {showProgress && (
        <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
          <div className="max-w-[640px] mx-auto">
            <ProgressSteps current={step as number} />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 w-full max-w-[640px] mx-auto py-6">
        {step === "intro" && <IntroContent />}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-[#122736] text-[22px] sm:text-[24px] tracking-tight text-right">
              פנאי ותחביבים
              <span className="text-[#69c600]">.</span>
            </h3>

            <div>
              <FieldLabel>
                מה את/ה אוהב/ת לעשות בשעות הפנאי?
              </FieldLabel>
              <Select
                value={hobby}
                placeholder="בחר/י תחביב"
                options={HOBBY_OPTIONS}
                onChange={(value) => {
                  setHobby(value);
                  setExperience(null);
                }}
              />
            </div>

            {hobby && (
              <div>
                <FieldLabel>
                  שנות ניסיון ב
                  {hobby === "אחר" ? "תחביב" : hobby}
                </FieldLabel>
                <Select
                  value={experience}
                  placeholder="בחר/י טווח שנים"
                  options={EXPERIENCE_OPTIONS}
                  onChange={setExperience}
                />
              </div>
            )}

            <div>
              <FieldLabel>
                האם היית מדריך/ה בתנועת נוער במשך שנה ומעלה?
              </FieldLabel>
              <YesNoRadio
                value={wasCounselor}
                onChange={(value) => {
                  setWasCounselor(value);
                  if (value === "לא") setCounselorYears("");
                }}
              />
            </div>

            {wasCounselor === "כן" && (
              <div>
                <FieldLabel>מספר שנים</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={counselorYears}
                  onChange={(e) =>
                    setCounselorYears(e.target.value)
                  }
                  placeholder="הזנ/י מספר שנים"
                  className="w-full bg-white border border-[rgba(23,28,35,0.12)] rounded-[10px] px-4 py-3 text-right text-[15px] text-[#171c23] placeholder:text-[rgba(23,28,35,0.4)] outline-none transition-colors focus:border-[#008ff0]"
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-[#122736] text-[22px] sm:text-[24px] tracking-tight text-right">
              פנאי ותחביבים
              <span className="text-[#69c600]">.</span>
            </h3>

            <div>
              <FieldLabel>
                האם התנדבת או מילאת תפקידים בקהילה?
              </FieldLabel>
              <YesNoRadio
                value={volunteered}
                onChange={setVolunteered}
              />
            </div>

            <div>
              <FieldLabel>
                בחר/י את התחומים בהם את/ה שולט/ת וציין/י רמת
                שליטה
              </FieldLabel>
              <Select
                value={domain}
                placeholder="בחר/י תחום"
                options={DOMAIN_OPTIONS}
                onChange={(value) => {
                  setDomain(value);
                  setControlLevel(null);
                }}
              />
            </div>

            {domain && (
              <div>
                <FieldLabel>{domain}</FieldLabel>
                <ControlScale
                  value={controlLevel}
                  onChange={setControlLevel}
                />
              </div>
            )}
          </div>
        )}

        {step === "success" && <SuccessContent />}
      </div>

      {/* Sticky footer - כפתורי הניווט תמיד גלויים בתחתית */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[640px] mx-auto flex items-center justify-between gap-3">
          {step === "intro" && (
            <>
              <SecondaryButton onClick={onExit}>
                חזרה למשימות
              </SecondaryButton>
              <PrimaryButton onClick={() => setStep(1)}>
                המשך
              </PrimaryButton>
            </>
          )}

          {step === 1 && (
            <>
              <SecondaryButton onClick={() => setStep("intro")}>
                חזרה
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setStep(2)}
                disabled={!step1Valid}
              >
                הבא
              </PrimaryButton>
            </>
          )}

          {step === 2 && (
            <>
              <SecondaryButton onClick={() => setStep(1)}>
                חזרה
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setStep("success")}
                disabled={!step2Valid}
              >
                <Send size={15} className="shrink-0" />
                הגשת השאלון
              </PrimaryButton>
            </>
          )}

          {step === "success" && (
            <div className="w-full flex justify-center">
              <PrimaryButton onClick={onExit}>
                חזרה למשימות
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
