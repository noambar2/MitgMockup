import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import AtudaQuestionnaireDetailed from "./AtudaQuestionnaireDetailed";
import AtudaQuestionnaireSimple from "./AtudaQuestionnaireSimple";
import AtudaQuestionnaireSheet from "./AtudaQuestionnaireSheet";

/**
 * שלוש גרסאות לשאלון העתודה, להשוואה:
 * אפשרות 1 - בחירה מתוך אשכולות ופאנל מגמה שנפתח בתוך הרשימה.
 * אפשרות 2 - טופס פשוט של דרופדאונים, שורה לכל עדיפות.
 * אפשרות 3 - רשימת עדיפויות, והבחירה בפאנל צדדי / בוטום שיט.
 */

const VARIANTS = [1, 2, 3] as const;
type Variant = (typeof VARIANTS)[number];

/**
 * המתג בין גרסאות העיצוב מוסתר לקראת ההשקה - השאלון נפתח באופציה 3.
 * החזרה שלו = החלפת הערך ל-true בלבד.
 */
const VARIANT_SWITCH_ENABLED = false;

function VariantSwitch({
  value,
  onChange,
}: {
  value: Variant;
  onChange: (v: Variant) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(23,28,35,0.06)] p-1 shrink-0">
      {VARIANTS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`rounded-full px-4 py-1.5 text-[13px] whitespace-nowrap transition-colors ${
            value === opt
              ? "bg-white text-[#008ff0] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-[rgba(23,28,35,0.62)] hover:text-[#171c23]"
          }`}
        >
          אופציה {opt}
        </button>
      ))}
    </div>
  );
}

export default function AtudaQuestionnairePage({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [variant, setVariant] = useState<Variant>(3);

  return (
    <div className="flex flex-col flex-1">
      {/* Breadcrumbs + מעבר בין גרסאות העיצוב */}
      <div className="bg-white px-4 sm:px-6 md:px-10 pt-6 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex items-center gap-1.5 text-[14px]">
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
            שאלון עתודה
          </span>
        </nav>
        {VARIANT_SWITCH_ENABLED && (
          <VariantSwitch value={variant} onChange={setVariant} />
        )}
      </div>

      {/* המפתח מאפס את מצב השאלון בכל החלפת גרסה */}
      {variant === 1 && (
        <AtudaQuestionnaireDetailed
          key="detailed"
          onExit={onExit}
          onGoHome={onGoHome}
        />
      )}
      {variant === 2 && (
        <AtudaQuestionnaireSimple
          key="simple"
          onExit={onExit}
          onGoHome={onGoHome}
        />
      )}
      {variant === 3 && (
        <AtudaQuestionnaireSheet
          key="sheet"
          onExit={onExit}
          onGoHome={onGoHome}
        />
      )}
    </div>
  );
}
