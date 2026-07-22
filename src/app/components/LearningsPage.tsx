import { ChevronLeft, BookOpen } from "lucide-react";

// ── Data ────────────────────────────────────────────────────────────────────

type LearningStatus = "בתהליך" | "טרם התחיל" | "הושלם";

interface Learning {
  id: string;
  name: string;
  description: string;
  status: LearningStatus;
}

const learnings: Learning[] = [
  {
    id: "dapar",
    name: 'לומדת דפ"ר',
    description:
      'לומדה זו נועדה להכין אתכם/ן לקראת מבחן הדפ"ר בצו הראשון. מוזמנים/ות להיכנס ולהתחיל לתרגל, בהצלחה!',
    status: "בתהליך",
  },
  {
    id: "hebrew",
    name: "לומדת עברית",
    description:
      "לומדה זו נועדה לסייע לכם/ן להתכונן למבחן העברית ולשפר את סימול העברית. מוזמנים/ות להיכנס ולהתחיל לתרגל, בהצלחה!",
    status: "טרם התחיל",
  },
  {
    id: "maah",
    name: 'לומדת הכנה ליום המא"ה',
    description:
      'לומדה זו נועדה להכין אתכם/ן לקראת יום המא"ה - מיון, איתור והתאמה. מוזמנים/ות להיכנס ולהכיר את המבדקים, בהצלחה!',
    status: "הושלם",
  },
];

// ── Status badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<
  LearningStatus,
  { bg: string; text: string; dot: string }
> = {
  בתהליך: {
    bg: "rgba(0,143,240,0.1)",
    text: "#008ff0",
    dot: "#008ff0",
  },
  "טרם התחיל": {
    bg: "rgba(23,28,35,0.06)",
    text: "rgba(23,28,35,0.6)",
    dot: "rgba(23,28,35,0.4)",
  },
  הושלם: {
    bg: "rgba(105,198,0,0.12)",
    text: "#4e9400",
    dot: "#69c600",
  },
};

function StatusBadge({ status }: { status: LearningStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: s.dot }}
      />
      {status}
    </span>
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
    <button
      onClick={onClick}
      className="group bg-white rounded-[10px] p-5 flex flex-col gap-3 text-right w-full transition-all duration-200 cursor-pointer hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)] border border-transparent hover:border-[rgba(0,143,240,0.2)]"
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-[rgba(0,143,240,0.1)] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-[#008ff0]" />
          </div>
          <h3 className="font-bold text-[#171c23] text-[18px] truncate">
            {learning.name}
          </h3>
        </div>
        <StatusBadge status={learning.status} />
      </div>
      <p className="text-[#171c23] text-[14px] leading-relaxed opacity-70 w-full">
        {learning.description}
      </p>
      <div className="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold mt-auto">
        {learning.status === "טרם התחיל"
          ? "להתחלת הלומדה"
          : learning.status === "הושלם"
            ? "לצפייה בלומדה"
            : "להמשך הלומדה"}
        <ChevronLeft
          size={16}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LearningsPage({
  onOpenLearning,
}: {
  onOpenLearning?: (id: string) => void;
}) {
  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className="text-right mb-1">
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
          לומדות<span className="text-[#69c600]">.</span>
        </h2>
      </div>
      <p className="text-[#171c23] text-[14px] opacity-50 text-right mb-6">
        כאן תוכלו למצוא את כל הלומדות שלכם, לתרגל ולעקוב אחר
        ההתקדמות
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {learnings.map((learning) => (
          <LearningCard
            key={learning.id}
            learning={learning}
            onClick={() => onOpenLearning?.(learning.id)}
          />
        ))}
      </div>
    </section>
  );
}
