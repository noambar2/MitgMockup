import { useMemo, useState } from "react";
import {
  Search,
  Star,
  Archive,
  ArchiveRestore,
  Clock,
  ChevronDown,
  ArrowUpDown,
  Inbox,
} from "lucide-react";
import { SectionHeading } from "./TasksAppointmentsPage";

// ── Data ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  title: string;
  content: string;
  timeAgo: string;
  /** גבוה יותר = חדש יותר (לצורך מיון) */
  sortIndex: number;
}

const messages: Message[] = [
  {
    id: "zuzu",
    title: "הכירו את זוזו!",
    content: `מתגייסים יקרים, הכירו את ZUZU - אפליקציית התחב"ץ של צה"ל! עולים על אוטובוס ציבורי? נוסעים ברכבת? פשוט סורקים את ה-QR ונוסעים!
איך מתחילים? מתחברים ונוסעים עם ZUZU בקישור https://Zuzu.prat.idf.il בנוסף, בחוגר קיימים 100 שקל כגיבוי, במקרים של תקלות.
נתקלתם בבעיה? מוקד ZUZU עומד לרשותכם בטלפון 03-9574888 שלוחה 8.
בהצלחה וגיוס קל ונעים!`,
    timeAgo: "לפני 3 ימים",
    sortIndex: 5,
  },
  {
    id: "maah-lomda",
    title: 'לומדת יום המא"ה מחכה לך',
    content: `ישראלה שלום, זוהי תזכורת כי קיימת עבורך לומדת ההכנה ליום המא"ה באתר מתגייסים לקראת יום המא"ה. אנו ממליצים לתרגל באמצעות הלומדה על מנת להגיע מוכנים יותר ליום המא"ה. שים/י לב, קיימת לרשותך באתר מתגייסים לומדת יום המא"ה בעמוד הלומדות. הלומדה מכילה מאות שאלות וחומרים לתרגול. הליך גיוס מוצלח!`,
    timeAgo: "לפני שבוע",
    sortIndex: 4,
  },
  {
    id: "stars-voucher",
    title: 'שובר הכוכבים של צה"ל',
    content: `היי ישראלה,
שובר הכוכבים שלך פתוח לשימוש.
הפעלתו תתבצע דרך הקישור הבא: https://idf.mltp.co.il
למידע נוסף על שובר הכוכבים בכתבה: https://bit.ly/3qqQrey`,
    timeAgo: "לפני שבועיים",
    sortIndex: 3,
  },
  {
    id: "companion-approved",
    title: "הרשאת המלווה שלך אושרה",
    content: `היי ישראלה, ההרשאה עבור רונית כץ (עובדת סוציאלית) אושרה בהצלחה. מעתה המלווה תוכל לצפות במידע ובזימונים שלך באתר מתגייסים ולסייע לך בתהליך הגיוס.`,
    timeAgo: "לפני שלושה שבועות",
    sortIndex: 2,
  },
  {
    id: "welcome",
    title: "ברוכים הבאים לאתר מתגייסים",
    content: `היי ישראלה, ברוכה הבאה לאזור האישי באתר מתגייסים! כאן תוכלי לעקוב אחרי תהליך הגיוס שלך, לצפות בזימונים, למלא שאלונים ולקבל עדכונים חשובים. מומלץ להיכנס מדי פעם ולוודא שאין משימות שממתינות לך. בהצלחה!`,
    timeAgo: "לפני חודש",
    sortIndex: 1,
  },
];

// הפיכת קישורים בטקסט ללחיצים
function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-[#008ff0] hover:underline break-all"
            dir="ltr"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

// ── Filter chips ────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${
        active
          ? "bg-[#008ff0] text-white"
          : "bg-white text-[#171c23] opacity-70 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}

// ── Message card ────────────────────────────────────────────────────────────

function MessageCard({
  message,
  unread,
  favorite,
  archived,
  onToggleFavorite,
  onToggleArchive,
  onRead,
}: {
  message: Message;
  unread: boolean;
  favorite: boolean;
  archived: boolean;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) onRead();
  };

  return (
    <div className="bg-white rounded-[10px] p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={toggleExpand}
          className="flex items-center gap-2 min-w-0 text-right"
        >
          {unread && (
            <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0" />
          )}
          <h3
            className={`text-[#171c23] text-[16px] truncate ${
              unread ? "font-bold" : "font-semibold opacity-80"
            }`}
          >
            {message.title}
          </h3>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-[#171c23] text-[12px] opacity-50 whitespace-nowrap">
            <Clock size={11} className="shrink-0" />
            {message.timeAgo}
          </span>
          <button
            onClick={onToggleFavorite}
            aria-label={
              favorite ? "הסרה ממועדפים" : "הוספה למועדפים"
            }
            className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-100"
          >
            <Star
              size={17}
              className={
                favorite
                  ? "text-[#f5a623]"
                  : "text-[#171c23] opacity-40"
              }
              fill={favorite ? "#f5a623" : "none"}
            />
          </button>
          <button
            onClick={onToggleArchive}
            aria-label={
              archived ? "החזרה מהארכיון" : "העברה לארכיון"
            }
            className="w-7 h-7 flex items-center justify-center text-[#171c23] opacity-40 hover:opacity-100 transition-opacity"
          >
            {archived ? (
              <ArchiveRestore size={17} />
            ) : (
              <Archive size={17} />
            )}
          </button>
        </div>
      </div>

      <p
        className={`text-[#171c23] text-[14px] text-right leading-relaxed whitespace-pre-line ${
          expanded ? "" : "line-clamp-2 opacity-70"
        }`}
      >
        <Linkify text={message.content} />
      </p>

      <button
        onClick={toggleExpand}
        className="self-start flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
      >
        {expanded ? "הצגת פחות" : "לקריאת ההודעה המלאה"}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type ReadFilter = "all" | "unread" | "read";

export default function MessagesPage() {
  // "לומדת יום המא"ה" וה"זוזו" טרם נקראו
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(["stars-voucher", "companion-approved", "welcome"]),
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(["stars-voucher"]),
  );
  const [archivedIds, setArchivedIds] = useState<Set<string>>(
    () => new Set(["welcome"]),
  );

  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] =
    useState<ReadFilter>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [showArchive, setShowArchive] = useState(false);

  const toggleIn = (
    setter: React.Dispatch<
      React.SetStateAction<Set<string>>
    >,
    id: string,
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visibleMessages = useMemo(() => {
    let list = messages.filter(
      (m) => archivedIds.has(m.id) === showArchive,
    );
    if (onlyFavorites)
      list = list.filter((m) => favoriteIds.has(m.id));
    if (readFilter !== "all")
      list = list.filter(
        (m) =>
          readIds.has(m.id) === (readFilter === "read"),
      );
    if (query.trim()) {
      const q = query.trim();
      list = list.filter(
        (m) =>
          m.title.includes(q) || m.content.includes(q),
      );
    }
    return [...list].sort((a, b) =>
      newestFirst
        ? b.sortIndex - a.sortIndex
        : a.sortIndex - b.sortIndex,
    );
  }, [
    archivedIds,
    favoriteIds,
    readIds,
    showArchive,
    onlyFavorites,
    readFilter,
    newestFirst,
    query,
  ]);

  const unreadCount = messages.filter(
    (m) => !readIds.has(m.id) && !archivedIds.has(m.id),
  ).length;

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className="md:max-w-[760px] md:mx-auto">
        <SectionHeading
          title="הודעות"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} הודעות שטרם נקראו`
              : "כל ההודעות נקראו"
          }
        />

        {/* חיפוש וסינונים */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="bg-white rounded-full h-10 px-4 flex items-center gap-2">
            <Search
              size={15}
              className="text-[#171c23] opacity-40 shrink-0"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש בהודעות"
              className="flex-1 bg-transparent outline-none text-[14px] text-[#171c23] placeholder:opacity-40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* סינון נקראו/לא נקראו */}
            <FilterChip
              active={readFilter === "all"}
              onClick={() => setReadFilter("all")}
            >
              הכל
            </FilterChip>
            <FilterChip
              active={readFilter === "unread"}
              onClick={() => setReadFilter("unread")}
            >
              לא נקראו
            </FilterChip>
            <FilterChip
              active={readFilter === "read"}
              onClick={() => setReadFilter("read")}
            >
              נקראו
            </FilterChip>
            <div className="w-px h-5 bg-[rgba(23,28,35,0.1)] mx-1" />
            <FilterChip
              active={onlyFavorites}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Star
                size={13}
                className="shrink-0"
                fill={onlyFavorites ? "currentColor" : "none"}
              />
              מועדפים
            </FilterChip>
            <FilterChip
              onClick={() => setNewestFirst(!newestFirst)}
            >
              <ArrowUpDown size={13} className="shrink-0" />
              {newestFirst ? "מהחדש לישן" : "מהישן לחדש"}
            </FilterChip>
            <FilterChip
              active={showArchive}
              onClick={() => setShowArchive(!showArchive)}
            >
              <Archive size={13} className="shrink-0" />
              ארכיון
            </FilterChip>
          </div>
        </div>

        {/* רשימת הודעות */}
        {visibleMessages.length === 0 ? (
          <div className="bg-white rounded-[10px] p-10 flex flex-col items-center gap-3 text-center">
            <div className="bg-[rgba(0,143,240,0.08)] w-14 h-14 rounded-full flex items-center justify-center">
              <Inbox size={24} className="text-[#008ff0]" />
            </div>
            <p className="font-bold text-[#171c23] text-[16px]">
              {showArchive
                ? "הארכיון ריק"
                : "לא נמצאו הודעות"}
            </p>
            <p className="text-[#171c23] text-[14px] opacity-60">
              {query.trim()
                ? "נסו לשנות את החיפוש או הסינון"
                : "הודעות חדשות יופיעו כאן"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                unread={!readIds.has(message.id)}
                favorite={favoriteIds.has(message.id)}
                archived={archivedIds.has(message.id)}
                onToggleFavorite={() =>
                  toggleIn(setFavoriteIds, message.id)
                }
                onToggleArchive={() =>
                  toggleIn(setArchivedIds, message.id)
                }
                onRead={() =>
                  setReadIds(
                    (prev) => new Set([...prev, message.id]),
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
