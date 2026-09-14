import { Check, ChevronLeft, GraduationCap, Info } from "lucide-react";
import { IconCircle } from "./primitives";
import { DECLARATIONS } from "./atudaData";

/** חלקים משותפים לגרסאות השאלון - מסך הפתיחה, ההצהרות, מסך הסיום וסרגל ההתקדמות */

export function ValidationMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 text-[#c43c3c] text-[13px] font-semibold text-right"
    >
      <Info size={14} className="shrink-0 mt-0.5" />
      {children}
    </p>
  );
}

export function StepHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-right">
        {title}
        <span className="text-[#69c600]">.</span>
      </h3>
      {children}
    </div>
  );
}

export function ProgressSteps({
  labels,
  current,
}: {
  labels: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const index = i + 1;
        return (
          <div
            key={label}
            className="flex-1 flex flex-col gap-1.5 min-w-0"
          >
            <div
              className={`h-[6px] rounded-full transition-colors ${
                index <= current
                  ? "bg-[#008ff0]"
                  : "bg-[rgba(23,28,35,0.08)]"
              }`}
            />
            <span
              className={`text-[12px] text-right truncate ${
                index === current
                  ? "text-[#008ff0] font-semibold"
                  : "text-[#171c23] opacity-50"
              }`}
            >
              {index}. {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function IntroScreen() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <IconCircle size={72} bg="rgba(0,143,240,0.1)">
          <GraduationCap size={34} />
        </IconCircle>
        <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
          ישראלה, ברוכה הבאה לשאלון העתודה
          <span className="text-[#69c600]">.</span>
        </h3>
      </div>

      <p className="text-[#171c23] text-[15px] leading-relaxed text-right">
        מטרת השאלון היא הבעת רצון להצטרף לתהליך המיון לעתודה
        ולבחירת תחום הלימוד ומוסד אקדמי בו תרצו להשתלב. עליכם
        לדרג עד ארבעה תחומי לימוד המעניינים אתכם, ובכל תחום לימוד
        לדרג עד שלושה מוסדות לימוד אקדמיים בהם הנכם מעוניינים
        ללמוד. בעדיפות הראשונה יש לציין את התחום בו תרצו להשתלב
        בעדיפות הגבוהה ביותר וכן הלאה.
      </p>

      <a
        href="https://www.mitgaisim.idf.il"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-[#008ff0] text-[14px] font-semibold hover:underline self-start"
      >
        למד עוד על מסלול העתודה האקדמית
        <ChevronLeft size={15} className="shrink-0" />
      </a>

    </div>
  );
}

export function DeclarationsBlock({
  agreed,
  onToggle,
}: {
  agreed: boolean[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="bg-[#f5f5f7] rounded-[10px] p-5 flex flex-col gap-3">
      <span className="font-semibold text-[#171c23] text-[15px] text-right">
        הצהרות
      </span>
      {DECLARATIONS.map((text, i) => (
        <button
          key={text}
          type="button"
          onClick={() => onToggle(i)}
          aria-pressed={agreed[i]}
          className="flex items-start gap-3 text-right"
        >
          <span
            className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              agreed[i]
                ? "bg-[#008ff0] border-[#008ff0]"
                : "bg-white border-[rgba(23,28,35,0.25)]"
            }`}
          >
            {agreed[i] && <Check size={13} className="text-white" />}
          </span>
          <span className="text-[#171c23] text-[14px] leading-relaxed">
            {text}
          </span>
        </button>
      ))}
    </div>
  );
}

export function SuccessScreen() {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <IconCircle size={72} bg="rgba(105,198,0,0.12)" color="#69c600">
        <Check size={34} />
      </IconCircle>
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
        העדפותיך נשלחו בהצלחה
        <span className="text-[#69c600]">.</span>
      </h3>
      <p className="text-[#171c23] text-[15px] opacity-60 max-w-[380px] leading-relaxed">
        הבחירות שלך נשמרו ויועברו לגורמי המיון של מערך העתודה.
        עדכון על המשך התהליך יישלח אליך להודעות באזור האישי.
      </p>
    </div>
  );
}
