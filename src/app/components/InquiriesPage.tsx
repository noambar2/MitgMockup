import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Phone,
  Globe,
  Paperclip,
  Check,
  Clock,
  Inbox,
  FileText,
  X,
} from "lucide-react";
import {
  Button,
  StatusBadge,
  Dialog,
  SelectField,
  FieldLabel,
  FIELD_CLASS,
  PAGE_CONTAINER,
  IconCircle,
} from "./primitives";
import { SectionHeading, Breadcrumbs } from "./TasksAppointmentsPage";

// ── Data ────────────────────────────────────────────────────────────────────

type InquiryStatus = "received" | "inProgress" | "closed";
type Channel = "טלפוני" | "מקוון";

interface Inquiry {
  id: string;
  number: string;
  subject: string;
  topic: string;
  openDate: string;
  closeDate?: string;
  status: InquiryStatus;
  channel: Channel;
  attachments: number;
  response?: string;
}

const inquiries: Inquiry[] = [
  {
    id: "46656641",
    number: "46656641",
    subject: "דרכי תקשורת עם מיטב",
    topic: "כללי",
    openDate: "19.07.2026",
    closeDate: "19.07.2026",
    status: "closed",
    channel: "טלפוני",
    attachments: 0,
    response:
      'מלש"ב יקר, ניתן ליצור קשר דרך אתר מתגייסים ברשת ודרך מרכז השירות הטלפוני במספר 1111. בהצלחה!',
  },
  {
    id: "46658120",
    number: "46658120",
    subject: "בקשה לשינוי מועד זימון רפואי",
    topic: "רפואי",
    openDate: "12.09.2026",
    status: "inProgress",
    channel: "מקוון",
    attachments: 2,
  },
  {
    id: "46659003",
    number: "46659003",
    subject: "שאלה לגבי עתודה אקדמית",
    topic: "עתודה אקדמית",
    openDate: "21.09.2026",
    status: "received",
    channel: "מקוון",
    attachments: 0,
  },
];

// ── Create form options ──────────────────────────────────────────────────────

const TOPICS: Record<string, string[]> = {
  "איתור ומיון": [
    "זימון למיון",
    "בקשה לדחיית מיון",
    "ערעור על תוצאות",
  ],
  "עתודה אקדמית": [
    "הרשמה לעתודה",
    "מסלולי לימוד",
    "מלגות ותנאים",
  ],
  "עתודה טכנולוגית": ["הרשמה", "תנאי קבלה"],
  רפואי: [
    "שאלון רפואי",
    "שאלון רפואי - הצהרת רופא ובדיקת ראייה",
    "בקשה לוועדה עליונה",
    "בקשה לליווי לזימון",
    "שינוי מועד זימון / שליחת מסמכים עבור ביטול זימון",
  ],
  "בריאות הנפש": [
    "מסמכים בתחום בריאות הנפש",
    "בקשה לוועדה",
  ],
  "תנאי שירות": ["מגורים", "שכר ותנאים", "חופשות"],
  "שירות ייחודי - מתנדבים/תקדימו": [
    "שירות לאומי-אזרחי",
    "התנדבות",
  ],
  כללי: [
    "דרכי תקשורת",
    "עדכון פרטים אישיים",
    "בקשה כללית",
  ],
  שאלונים: ["שאלון אימות נתונים", "שאלון תחביבים"],
};
const MAIN_TOPICS = Object.keys(TOPICS);

const MAX_FILES = 10;

// ── Inquiry card ─────────────────────────────────────────────────────────────

function InfoPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-start min-w-0">
      <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
        {label}
      </span>
      <span className="text-[#171c23] text-[15px] whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const [open, setOpen] = useState(false);
  const closed = inquiry.status === "closed";

  return (
    <div className="bg-white rounded-[10px] flex flex-col">
      {/* כותרת: נושא + תגית סטטוס */}
      <button
        onClick={() => setOpen(!open)}
        className="p-5 flex items-start justify-between gap-3 text-right w-full"
      >
        <div className="flex flex-col items-start gap-1 min-w-0">
          <h3 className="font-bold text-[#171c23] text-[18px] text-right">
            {inquiry.subject}
          </h3>
          <span className="text-[#171c23] text-[13px] opacity-50">
            {inquiry.topic}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {closed ? (
            <StatusBadge variant="success" dot>
              נסגרה
            </StatusBadge>
          ) : inquiry.status === "inProgress" ? (
            <StatusBadge
              variant="warning"
              icon={<Clock size={13} className="shrink-0" />}
            >
              בטיפול
            </StatusBadge>
          ) : (
            <StatusBadge
              variant="neutral"
              icon={<Inbox size={13} className="shrink-0" />}
            >
              התקבלה
            </StatusBadge>
          )}
          <ChevronDown
            size={20}
            className={`text-[#171c23] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* פרטים - תמיד גלויים */}
      <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-4">
        <InfoPair label="מספר פנייה" value={inquiry.number} />
        <InfoPair
          label="תאריך פתיחת פנייה"
          value={inquiry.openDate}
        />
        {closed && inquiry.closeDate && (
          <InfoPair label="נסגר בתאריך" value={inquiry.closeDate} />
        )}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
            קבצים מצורפים
          </span>
          <span className="flex items-center gap-1.5 text-[#171c23] text-[15px]">
            <Paperclip
              size={14}
              className="text-[#008ff0] shrink-0"
            />
            {inquiry.attachments > 0
              ? `${inquiry.attachments} קבצים`
              : "לא צורפו קבצים"}
          </span>
        </div>
      </div>

      {/* תוכן מורחב: מסלול סטטוס + ערוץ + תשובה */}
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-5 border-t border-[rgba(23,28,35,0.05)] pt-5">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[#171c23] text-[13px] opacity-50">
              ערוץ הפנייה
            </span>
            <span className="flex items-center gap-1.5 text-[#171c23] text-[15px] font-semibold">
              {inquiry.channel === "טלפוני" ? (
                <Phone size={15} className="text-[#008ff0] shrink-0" />
              ) : (
                <Globe size={15} className="text-[#008ff0] shrink-0" />
              )}
              {inquiry.channel}
            </span>
          </div>

          {inquiry.response ? (
            <div className="flex flex-col items-start gap-1">
              <span className="text-[#171c23] text-[13px] opacity-50">
                תשובה לפנייה
              </span>
              <p className="text-[#171c23] text-[15px] font-semibold text-right leading-relaxed">
                {inquiry.response}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#171c23] text-[14px] opacity-60 bg-[#f5f5f7] rounded-[8px] px-4 py-3">
              <Clock size={15} className="text-[#008ff0] shrink-0" />
              הפנייה בטיפול. נעדכן אותך כאן ברגע שתתקבל תשובה.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create inquiry dialog ────────────────────────────────────────────────────

function CreateInquiryDialog({ onClose }: { onClose: () => void }) {
  const [mainTopic, setMainTopic] = useState<string | null>(null);
  const [subTopic, setSubTopic] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subOptions = mainTopic ? TOPICS[mainTopic] : [];
  const valid =
    !!mainTopic && !!subTopic && text.trim() !== "";

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const names = Array.from(list).map((f) => f.name);
    setFiles((prev) =>
      [...prev, ...names].slice(0, MAX_FILES),
    );
  };

  if (submitted) {
    return (
      <Dialog onClose={onClose} footer={<Button onClick={onClose}>סגירה</Button>}>
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <IconCircle size={64} bg="rgba(105,198,0,0.12)" color="#69c600">
            <Check size={30} />
          </IconCircle>
          <p className="font-bold text-[#171c23] text-[20px]">
            הפנייה נשלחה בהצלחה
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60 max-w-[320px] leading-relaxed">
            קיבלנו את פנייתך בנושא {mainTopic} · {subTopic}. נעדכן
            אותך כאן ובמייל ברגע שתתקבל תשובה.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="יצירת פנייה"
      subtitle="בחרו נושא, פרטו את הבקשה, ובמידת הצורך צרפו קבצים"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button disabled={!valid} onClick={() => setSubmitted(true)}>
            שליחה
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <SelectField
          label="נושא ראשי"
          required
          value={mainTopic}
          placeholder="בחרו נושא"
          options={MAIN_TOPICS}
          onChange={(v) => {
            setMainTopic(v);
            setSubTopic(null);
          }}
        />
        <SelectField
          label="תת נושא"
          required
          value={subTopic}
          placeholder={
            mainTopic ? "בחרו תת נושא" : "יש לבחור נושא ראשי תחילה"
          }
          options={subOptions}
          onChange={setSubTopic}
        />

        <div>
          <FieldLabel required>תוכן הפנייה</FieldLabel>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) =>
                setText(e.target.value.slice(0, 400))
              }
              rows={4}
              placeholder="פרטו את פנייתכם..."
              className={`${FIELD_CLASS} resize-none`}
            />
            <span className="absolute bottom-2.5 left-3 text-[12px] text-[rgba(23,28,35,0.4)]">
              {text.length}/400
            </span>
          </div>
        </div>

        {/* העלאת קבצים */}
        <div>
          <FieldLabel>העלאת קבצים</FieldLabel>
          <p className="text-[#171c23] text-[13px] opacity-50 mb-2 leading-relaxed">
            ניתן לצרף עד {MAX_FILES} קבצים מסוג PDF / JPG, במשקל
            כולל של עד 5MB.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={files.length >= MAX_FILES}
            className="w-full flex items-center justify-center gap-2 bg-[#f5f5f7] border border-dashed border-[rgba(23,28,35,0.25)] rounded-[10px] px-4 py-4 text-[#171c23] text-[14px] opacity-70 hover:opacity-100 hover:border-[#008ff0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Paperclip size={16} className="shrink-0" />
            גררו את הקבצים או לחצו על מנת לבחור
          </button>

          {files.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {files.map((name, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex items-center justify-between gap-2 bg-[#f5f5f7] rounded-[8px] px-3 py-2"
                >
                  <span className="flex items-center gap-2 min-w-0 text-[#171c23] text-[14px]">
                    <FileText
                      size={15}
                      className="text-[#008ff0] shrink-0"
                    />
                    <span className="truncate">{name}</span>
                  </span>
                  <button
                    onClick={() =>
                      setFiles((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    aria-label="הסרת קובץ"
                    className="w-6 h-6 flex items-center justify-center text-[#171c23] opacity-50 hover:opacity-100 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <span className="text-[13px] text-[#171c23] opacity-50">
                {files.length} מתוך {MAX_FILES} קבצים
              </span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type InquiryFilter = "all" | "open" | "closed";

export default function InquiriesPage({
  onNavigateHome,
}: {
  onNavigateHome?: () => void;
}) {
  const [filter, setFilter] = useState<InquiryFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: inquiries.length,
      open: inquiries.filter((q) => q.status !== "closed").length,
      closed: inquiries.filter((q) => q.status === "closed")
        .length,
    }),
    [],
  );

  const visible = useMemo(
    () =>
      inquiries.filter((q) =>
        filter === "all"
          ? true
          : filter === "closed"
            ? q.status === "closed"
            : q.status !== "closed",
      ),
    [filter],
  );

  const filters: { key: InquiryFilter; label: string; count: number }[] =
    [
      { key: "all", label: "כל הפניות", count: counts.all },
      { key: "open", label: "פניות פתוחות", count: counts.open },
      {
        key: "closed",
        label: "פניות סגורות",
        count: counts.closed,
      },
    ];

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className={PAGE_CONTAINER}>
        <Breadcrumbs
          items={[
            { label: "אזור אישי", onClick: onNavigateHome },
            { label: "פניות" },
          ]}
        />

        {/* כותרת + יצירת פנייה */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <SectionHeading title="פניות" />
          <Button onClick={() => setCreateOpen(true)}>
            <span className="text-[16px] leading-none">+</span>
            פנייה חדשה
          </Button>
        </div>

        {/* סינון */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-[#008ff0] text-white"
                  : "bg-white text-[#171c23] opacity-70 hover:opacity-100"
              }`}
            >
              {f.label}
              <span
                className={`text-[13px] font-bold ${filter === f.key ? "opacity-75" : "opacity-45"}`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* רשימת פניות */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-[10px] p-10 flex flex-col items-center gap-3 text-center">
            <IconCircle size={56} bg="rgba(0,143,240,0.08)">
              <Inbox size={24} />
            </IconCircle>
            <p className="font-bold text-[#171c23] text-[16px]">
              אין פניות להצגה
            </p>
            <p className="text-[#171c23] text-[14px] opacity-60">
              פניות שתפתחו יופיעו כאן
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visible.map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateInquiryDialog onClose={() => setCreateOpen(false)} />
      )}
    </section>
  );
}
