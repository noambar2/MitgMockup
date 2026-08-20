import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Phone,
  Globe,
  Paperclip,
  Check,
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Inbox,
  FileText,
  RotateCcw,
  Send,
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
  AdBanner,
  FilterChip,
  LayoutSwitch,
} from "./primitives";
import { SectionHeading } from "./TasksAppointmentsPage";

// ── Data ────────────────────────────────────────────────────────────────────

type InquiryStatus = "received" | "inProgress" | "closed";
type Channel = "טלפוני" | "מקוון";

/** מסמך שצורף לפנייה - במנהלן אפשר לצפות בו בתוך האפליקציה בלבד */
interface InquiryFile {
  id: string;
  name: string;
  kind: "image" | "doc";
  /** כתובת זמנית בזיכרון הדפדפן לקובץ שצורף בפועל (blob:) */
  url?: string;
}

/** רשומה בהיסטוריית הטיפול - מוצגת למנהלן */
interface HistoryEntry {
  date: string;
  text: string;
  by: string;
}

interface Inquiry {
  id: string;
  number: string;
  subject: string;
  topic: string;
  openDate: string;
  closeDate?: string;
  status: InquiryStatus;
  channel: Channel;
  files: InquiryFile[];
  response?: string;
  /** הגורם המטפל בפנייה - מוצג בתצוגת מנהלן */
  handler?: string;
  /** היסטוריית הטיפול - מוצגת בתצוגת מנהלן */
  history: HistoryEntry[];
}

const INQUIRIES: Inquiry[] = [
  {
    id: "46656641",
    number: "46656641",
    subject: "דרכי תקשורת עם מיטב",
    topic: "כללי",
    openDate: "19.07.2026",
    closeDate: "19.07.2026",
    status: "closed",
    channel: "טלפוני",
    files: [],
    handler: "מדור שירות ומידע, מיטב",
    response:
      'מלש"ב יקר, ניתן ליצור קשר דרך אתר מתגייסים ברשת ודרך מרכז השירות הטלפוני במספר 1111. בהצלחה!',
    history: [
      {
        date: "19.07.2026",
        text: "הפנייה נפתחה בערוץ טלפוני",
        by: "מרכז השירות",
      },
      {
        date: "19.07.2026",
        text: "נשלח מענה סופי והפנייה נסגרה",
        by: "רס״ל א. כהן",
      },
    ],
  },
  {
    id: "46658120",
    number: "46658120",
    subject: "בקשה לשינוי מועד זימון רפואי",
    topic: "רפואי",
    openDate: "12.09.2026",
    status: "inProgress",
    channel: "מקוון",
    files: [
      {
        id: "f1",
        name: "אישור רופא משפחה.pdf",
        kind: "doc",
      },
      { id: "f2", name: "צילום תעודת זהות.jpg", kind: "image" },
    ],
    handler: "מדור רפואה, מיטב",
    history: [
      {
        date: "12.09.2026",
        text: 'הפנייה נפתחה על ידי המלש"ב',
        by: "אתר מתגייסים",
      },
      {
        date: "13.09.2026",
        text: "הפנייה נותבה למדור רפואה",
        by: "ניתוב אוטומטי",
      },
      {
        date: "14.09.2026",
        text: "התקבלו מסמכים רפואיים והועברו לבדיקה",
        by: "סמ״ר ל. אזולאי",
      },
    ],
  },
  {
    id: "46659003",
    number: "46659003",
    subject: "שאלה לגבי עתודה אקדמית",
    topic: "עתודה אקדמית",
    openDate: "21.09.2026",
    status: "received",
    channel: "מקוון",
    files: [],
    history: [
      {
        date: "21.09.2026",
        text: 'הפנייה נפתחה על ידי המלש"ב',
        by: "אתר מתגייסים",
      },
    ],
  },
];

/** הצוותים שאפשר להקצות אליהם פנייה שנפתחה מחדש */
const TEAMS = [
  "מדור שירות ומידע, מיטב",
  "מדור רפואה, מיטב",
  "מדור עתודות",
  "מדור בריאות הנפש",
  "לשכת גיוס באר שבע",
];

/**
 * רשימה בתוך כרטיס: כ-4 שורות במובייל וכ-6 בדסקטופ, ומעבר לזה גלילה
 * פנימית - כדי שפנייה עם עשרות מסמכים לא תמתח את הכרטיס.
 */
const LIST_SCROLL =
  "flex flex-col gap-2 w-full max-h-[200px] md:max-h-[280px] overflow-y-auto pe-1";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  received: "התקבלה",
  inProgress: "בטיפול",
  closed: "נסגרה",
};

/** תאריך היום בפורמט dd.mm.yyyy - כמו שאר התאריכים בעמוד */
const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

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

/**
 * תצוגת המנהלן (מתן מענה, פתיחה מחדש, ניהול מסמכים) מוכנה בקוד אך
 * מוסתרת לקראת ההשקה. החזרה שלה = החלפת הערך ל-true בלבד.
 */
const ADMIN_VIEW_ENABLED = false;

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

function InquiryCard({
  inquiry,
  admin = false,
  onRespond,
  onReopen,
  onAddFiles,
}: {
  inquiry: Inquiry;
  /** תצוגת מנהלן - מוסיפה גורם מטפל, היסטוריה ופעולות טיפול */
  admin?: boolean;
  onRespond?: (response: string, status: InquiryStatus) => void;
  onReopen?: (team: string) => void;
  onAddFiles?: (files: File[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [viewFile, setViewFile] = useState<InquiryFile | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
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
            {inquiry.files.length > 0
              ? `${inquiry.files.length} קבצים`
              : "לא צורפו קבצים"}
          </span>
        </div>
        {/* הגורם המטפל - מידע ניהולי, מוצג רק במנהלן */}
        {admin && (
          <InfoPair
            label="גורם מטפל"
            value={inquiry.handler ?? "טרם הוקצה"}
          />
        )}
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

          {/* ── תצוגת מנהלן: היסטוריה, מסמכים ופעולות טיפול ── */}
          {admin && (
            <>
              {/* בדסקטופ ההיסטוריה והמסמכים חולקים את השורה;
                  שתי הרשימות מוגבלות בגובה ונגללות בפנים */}
              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                {/* היסטוריית הטיפול */}
                <div className="flex flex-col items-start gap-2 min-w-0">
                  <span className="text-[#171c23] text-[13px] opacity-50">
                    היסטוריית טיפול
                  </span>
                  <ol className={LIST_SCROLL}>
                    {inquiry.history.map((h, i) => (
                      <li
                        key={`${h.date}-${i}`}
                        className="flex items-start gap-2.5 text-right"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0 mt-1.5" />
                        <span className="min-w-0">
                          <span className="block text-[#171c23] text-[14px]">
                            {h.text}
                          </span>
                          <span className="block text-[#171c23] text-[12px] opacity-50">
                            {h.date} · {h.by}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* מסמכי הפנייה - צפייה בתוך האפליקציה בלבד */}
                <div className="flex flex-col items-start gap-2 min-w-0">
                  <span className="text-[#171c23] text-[13px] opacity-50">
                    מסמכי הפנייה
                  </span>
                  {inquiry.files.length === 0 ? (
                    <span className="text-[#171c23] text-[14px] opacity-60">
                      לא צורפו מסמכים לפנייה
                    </span>
                  ) : (
                    <div className={LIST_SCROLL}>
                      {inquiry.files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 bg-[#f5f5f7] rounded-[8px] px-4 py-2.5"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {f.kind === "image" ? (
                              <ImageIcon
                                size={15}
                                className="text-[#008ff0] shrink-0"
                              />
                            ) : (
                              <FileText
                                size={15}
                                className="text-[#008ff0] shrink-0"
                              />
                            )}
                            <span className="text-[#171c23] text-[14px] truncate">
                              {f.name}
                            </span>
                          </span>
                          <Button
                            variant="link"
                            onClick={() => setViewFile(f)}
                            className="shrink-0"
                          >
                            <Eye size={14} className="shrink-0" />
                            צפייה
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* פעולות המנהלן */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {closed ? (
                  <Button onClick={() => setReopenOpen(true)}>
                    <RotateCcw size={14} className="shrink-0" />
                    פתיחת הפנייה מחדש
                  </Button>
                ) : (
                  <Button onClick={() => setRespondOpen(true)}>
                    <Send size={14} className="shrink-0" />
                    מתן מענה ועדכון סטטוס
                  </Button>
                )}
                <Button
                  variant="tint"
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip size={14} className="shrink-0" />
                  צירוף מסמך
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length) onAddFiles?.(picked);
                    e.target.value = "";
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {respondOpen && (
        <RespondDialog
          inquiry={inquiry}
          onClose={() => setRespondOpen(false)}
          onSubmit={(text, status) => {
            onRespond?.(text, status);
            setRespondOpen(false);
          }}
        />
      )}
      {reopenOpen && (
        <ReopenDialog
          inquiry={inquiry}
          onClose={() => setReopenOpen(false)}
          onSubmit={(team) => {
            onReopen?.(team);
            setReopenOpen(false);
          }}
        />
      )}
      {viewFile && (
        <FileViewerDialog
          file={viewFile}
          onClose={() => setViewFile(null)}
        />
      )}
    </div>
  );
}

// ── Admin dialogs ───────────────────────────────────────────────────────────

/** מתן מענה סופי ועדכון סטטוס הפנייה (כולל סגירתה) */
function RespondDialog({
  inquiry,
  onClose,
  onSubmit,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSubmit: (response: string, status: InquiryStatus) => void;
}) {
  const [text, setText] = useState(inquiry.response ?? "");
  const [status, setStatus] = useState<InquiryStatus>(
    inquiry.status === "received" ? "inProgress" : inquiry.status,
  );

  return (
    <Dialog
      title="מתן מענה לפנייה"
      subtitle={`${inquiry.subject} · פנייה ${inquiry.number}`}
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button
            disabled={text.trim() === ""}
            onClick={() => onSubmit(text.trim(), status)}
          >
            <Send size={14} className="shrink-0" />
            שליחת מענה
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel required>המענה למלש"ב</FieldLabel>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="פרטו את המענה שיוצג למלש״ב בפנייה"
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>
        <SelectField
          label="סטטוס הפנייה לאחר המענה"
          value={STATUS_LABELS[status]}
          placeholder="בחרו סטטוס"
          options={(
            ["received", "inProgress", "closed"] as InquiryStatus[]
          ).map((s) => STATUS_LABELS[s])}
          onChange={(label) =>
            setStatus(
              (
                Object.keys(STATUS_LABELS) as InquiryStatus[]
              ).find((s) => STATUS_LABELS[s] === label) ??
                "inProgress",
            )
          }
        />
      </div>
    </Dialog>
  );
}

/** פתיחה מחדש של פנייה שנסגרה והקצאתה לצוות מטפל */
function ReopenDialog({
  inquiry,
  onClose,
  onSubmit,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSubmit: (team: string) => void;
}) {
  const [team, setTeam] = useState(inquiry.handler ?? TEAMS[0]);

  return (
    <Dialog
      title="פתיחת הפנייה מחדש"
      subtitle={`${inquiry.subject} · פנייה ${inquiry.number}`}
      width={480}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={() => onSubmit(team)}>
            <RotateCcw size={14} className="shrink-0" />
            פתיחה מחדש
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[#171c23] text-[14px] leading-relaxed opacity-70 text-right">
          הפנייה תחזור לסטטוס "בטיפול" ותוקצה לצוות שייבחר. המענה
          הקודם יישמר בהיסטוריית הטיפול.
        </p>
        <SelectField
          label="הקצאה לצוות מטפל"
          value={team}
          placeholder="בחרו צוות"
          options={TEAMS}
          onChange={setTeam}
        />
      </div>
    </Dialog>
  );
}

/** צפייה במסמך בתוך האפליקציה - ללא הורדה ושמירה על המכשיר */
function FileViewerDialog({
  file,
  onClose,
}: {
  file: InquiryFile;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={file.name}
      subtitle="צפייה בלבד - לא ניתן להוריד או לשמור את הקובץ"
      width={560}
      onClose={onClose}
      footer={<Button onClick={onClose}>סגירה</Button>}
    >
      <div
        // חסימת תפריט ההקשר ובחירת הטקסט - הצפייה בתוך האפליקציה בלבד
        onContextMenu={(e) => e.preventDefault()}
        className="select-none bg-[#f5f5f7] rounded-[10px] overflow-hidden h-[320px] sm:h-[420px] flex items-center justify-center"
      >
        {file.url && file.kind === "image" ? (
          <img
            src={file.url}
            alt={file.name}
            draggable={false}
            className="max-h-full max-w-full object-contain pointer-events-none"
          />
        ) : file.url ? (
          // toolbar=0 מסתיר את סרגל ההורדה/הדפסה של מציג ה-PDF
          <iframe
            src={`${file.url}#toolbar=0&navpanes=0`}
            title={file.name}
            className="w-full h-full border-0"
          />
        ) : (
          // קובץ מהנתונים לדוגמה - אין קובץ אמיתי להציג
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
            <IconCircle size={64} bg="rgba(0,143,240,0.1)">
              {file.kind === "image" ? (
                <ImageIcon size={28} />
              ) : (
                <FileText size={28} />
              )}
            </IconCircle>
            <p className="font-semibold text-[#171c23] text-[15px]">
              {file.name}
            </p>
            <p className="flex items-center gap-1.5 text-[#171c23] text-[13px] opacity-60">
              <EyeOff size={14} className="shrink-0" />
              הקובץ מוצג בתוך האפליקציה בלבד
            </p>
          </div>
        )}
      </div>
    </Dialog>
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
  /** 1 = תצוגת מלש"ב (ברירת מחדל), 2 = תצוגת מנהלן */
  const [role, setRole] = useState<1 | 2>(1);
  // תצוגת המנהלן מוכנה אך מוסתרת עד להשקה - להחזרה: true
  const admin = ADMIN_VIEW_ENABLED && role === 2;
  /** הפניות מוחזקות במצב, כי במנהלן אפשר לעדכן אותן */
  const [inquiries, setInquiries] = useState<Inquiry[]>(INQUIRIES);

  /** עדכון פנייה בודדת + רישום שורה בהיסטוריית הטיפול */
  const updateInquiry = (
    id: string,
    change: Partial<Inquiry>,
    historyText: string,
  ) =>
    setInquiries((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              ...change,
              history: [
                ...q.history,
                {
                  date: today(),
                  text: historyText,
                  by: "מנהלן מיטב",
                },
              ],
            }
          : q,
      ),
    );

  const counts = useMemo(
    () => ({
      all: inquiries.length,
      open: inquiries.filter((q) => q.status !== "closed").length,
      closed: inquiries.filter((q) => q.status === "closed")
        .length,
    }),
    [inquiries],
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
    [filter, inquiries],
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

        {/* כותרת + מתג התצוגה + יצירת פנייה */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <SectionHeading title="פניות" className="mb-0" />
            {ADMIN_VIEW_ENABLED && (
              <LayoutSwitch
                value={role}
                onChange={setRole}
                labels={["לא מנהלן", "מנהלן"]}
              />
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <span className="text-[16px] leading-none">+</span>
            פנייה חדשה
          </Button>
        </div>

        {/* סינון */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {filters.map((f) => (
            <FilterChip
              key={f.key}
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
              count={f.count}
            >
              {f.label}
            </FilterChip>
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
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                admin={admin}
                onRespond={(response, status) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      response,
                      status,
                      closeDate:
                        status === "closed"
                          ? today()
                          : undefined,
                    },
                    status === "closed"
                      ? "נשלח מענה סופי והפנייה נסגרה"
                      : `נשלח מענה והסטטוס עודכן ל"${STATUS_LABELS[status]}"`,
                  )
                }
                onReopen={(team) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      status: "inProgress",
                      closeDate: undefined,
                      handler: team,
                    },
                    `הפנייה נפתחה מחדש והוקצתה ל${team}`,
                  )
                }
                onAddFiles={(picked) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      files: [
                        ...inquiry.files,
                        ...picked.map((f, i) => ({
                          id: `${Date.now()}-${i}`,
                          name: f.name,
                          kind: f.type.startsWith("image/")
                            ? ("image" as const)
                            : ("doc" as const),
                          // כתובת בזיכרון הדפדפן, כדי להציג את הקובץ עצמו
                          url: URL.createObjectURL(f),
                        })),
                      ],
                    },
                    picked.length === 1
                      ? `צורף מסמך: ${picked[0].name}`
                      : `צורפו ${picked.length} מסמכים`,
                  )
                }
              />
            ))}
          </div>
        )}

        <AdBanner />
      </div>

      {createOpen && (
        <CreateInquiryDialog onClose={() => setCreateOpen(false)} />
      )}
    </section>
  );
}
