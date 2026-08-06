import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Star,
  Archive,
  ArchiveRestore,
  Clock,
  ChevronDown,
  ArrowUpDown,
  Inbox,
  Mail,
  MailOpen,
  CheckCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import {
  SectionHeading,
} from "./TasksAppointmentsPage";
import {
  AdBanner,
  Button,
  Dialog,
  PAGE_CONTAINER,
} from "./primitives";

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
  count,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  /** מספר ההודעות שהסינון הזה יניב */
  count?: number;
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
      {count !== undefined && (
        <span
          className={`text-[13px] font-bold ${active ? "opacity-75" : "opacity-45"}`}
        >
          {count}
        </span>
      )}
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
  onToggleRead,
}: {
  message: Message;
  unread: boolean;
  favorite: boolean;
  archived: boolean;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onRead: () => void;
  onToggleRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  /** האם הטקסט באמת נחתך - רק אז יש טעם בכפתור "לקריאת ההודעה המלאה" */
  const [clipped, setClipped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    // במצב פתוח אין קיצוץ למדוד - שומרים על הערך הקודם
    if (!el || expanded) return;
    const check = () =>
      setClipped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, message.content]);

  const toggleExpand = () => setExpanded(!expanded);

  /** פעולות שאינן "קריאה" - שלא יסמנו את ההודעה כנקראה */
  const withoutRead =
    (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };

  return (
    <div
      // כל לחיצה על הכרטיס (כולל קישור בתוך ההודעה) מסמנת אותה כנקראה
      onClick={() => unread && onRead()}
      className="bg-white rounded-[10px] p-5 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={toggleExpand}
          className="flex items-start sm:items-center gap-2 min-w-0 flex-1 text-right"
        >
          {unread && (
            <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0 mt-2 sm:mt-0" />
          )}
          {/* במובייל הכותרת נפרשת על שתי שורות והזמן יורד מתחתיה,
              כי בשורה אחת עם האייקונים לא נשאר לה מקום */}
          <span className="min-w-0 flex flex-col items-start gap-0.5">
            <h3
              className={`text-[#171c23] text-[16px] leading-snug sm:truncate sm:max-w-full ${
                unread ? "font-bold" : "font-semibold opacity-80"
              }`}
            >
              {message.title}
            </h3>
            <span className="sm:hidden flex items-center gap-1 text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
              <Clock size={11} className="shrink-0" />
              {message.timeAgo}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
            <Clock size={11} className="shrink-0" />
            {message.timeAgo}
          </span>
          {/* סימון ידני של נקרא/לא נקרא - ליד שאר פעולות הכרטיס */}
          <button
            onClick={withoutRead(onToggleRead)}
            aria-label={unread ? "סימון כנקרא" : "סימון כלא נקרא"}
            title={unread ? "סימון כנקרא" : "סימון כלא נקרא"}
            className={`w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-100 ${
              unread
                ? "text-[#008ff0] opacity-90"
                : "text-[#171c23] opacity-40"
            }`}
          >
            {unread ? (
              <MailOpen size={17} />
            ) : (
              <Mail size={17} />
            )}
          </button>
          <button
            onClick={withoutRead(onToggleFavorite)}
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
            onClick={withoutRead(onToggleArchive)}
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
        ref={textRef}
        className={`text-[#171c23] text-[14px] text-right leading-relaxed whitespace-pre-line ${
          // במובייל שתי שורות, בדסקטופ שלוש
          expanded ? "" : "line-clamp-2 sm:line-clamp-3 opacity-70"
        }`}
      >
        <Linkify text={message.content} />
      </p>

      {/* הכפתור מופיע רק כשההודעה באמת ארוכה מהמקום שיש לה */}
      {clipped && (
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
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type ReadFilter = "all" | "unread" | "read";

/** הודעות שכבר נקראו בטעינה ראשונה ("זוזו" ולומדת המא"ה טרם נקראו) */
export const INITIAL_READ_MESSAGE_IDS = [
  "stars-voucher",
  "companion-approved",
  "welcome",
];
export const INITIAL_ARCHIVED_MESSAGE_IDS = ["welcome"];

/** מספר ההודעות שלא נקראו ואינן בארכיון - מזין את הבאדג' בפעמון */
export function countUnreadMessages(
  readIds: Set<string>,
  archivedIds: Set<string>,
) {
  return messages.filter(
    (m) => !readIds.has(m.id) && !archivedIds.has(m.id),
  ).length;
}

export default function MessagesPage({
  readIds,
  setReadIds,
  archivedIds,
  setArchivedIds,
  onNavigateHome,
}: {
  readIds: Set<string>;
  setReadIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  archivedIds: Set<string>;
  setArchivedIds: React.Dispatch<
    React.SetStateAction<Set<string>>
  >;
  onNavigateHome?: () => void;
}) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(["stars-voucher"]),
  );

  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] =
    useState<ReadFilter>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

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

  /** ההודעות בתצוגה הנוכחית (תיבה/ארכיון) שתואמות את החיפוש - בסיס לספירות */
  const scopeList = useMemo(() => {
    const q = query.trim();
    return messages.filter(
      (m) =>
        archivedIds.has(m.id) === showArchive &&
        (q === "" ||
          m.title.includes(q) ||
          m.content.includes(q)),
    );
  }, [archivedIds, showArchive, query]);

  /** ספירות לצ'יפים - כל ספירה מתעלמת מהסינון שלה עצמה כדי שתהיה שימושית */
  const counts = useMemo(() => {
    const byFavorite = onlyFavorites
      ? scopeList.filter((m) => favoriteIds.has(m.id))
      : scopeList;
    const q = query.trim();
    return {
      all: byFavorite.length,
      unread: byFavorite.filter((m) => !readIds.has(m.id)).length,
      read: byFavorite.filter((m) => readIds.has(m.id)).length,
      favorites: scopeList.filter((m) => favoriteIds.has(m.id))
        .length,
      archived: messages.filter(
        (m) =>
          archivedIds.has(m.id) &&
          (q === "" ||
            m.title.includes(q) ||
            m.content.includes(q)),
      ).length,
    };
  }, [
    scopeList,
    onlyFavorites,
    favoriteIds,
    readIds,
    archivedIds,
    query,
  ]);

  /** כמה מההודעות המוצגות טרם נקראו - לכפתור "סימון הכל כנקרא" */
  const unreadVisible = visibleMessages.filter(
    (m) => !readIds.has(m.id),
  ).length;

  const markVisibleAsRead = () =>
    setReadIds(
      (prev) =>
        new Set([...prev, ...visibleMessages.map((m) => m.id)]),
    );

  const searching = query.trim() !== "";
  const filtersActive =
    searching || onlyFavorites || readFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setOnlyFavorites(false);
    setReadFilter("all");
  };

  /** הסינונים שנכנסים לחלון במובייל - מועדפים, מיון וארכיון */
  const extraFilters =
    (onlyFavorites ? 1 : 0) +
    (showArchive ? 1 : 0) +
    (newestFirst ? 0 : 1);

  const clearExtraFilters = () => {
    setOnlyFavorites(false);
    setShowArchive(false);
    setNewestFirst(true);
  };

  const extraChips = (
    <>
      <FilterChip
        active={onlyFavorites}
        onClick={() => setOnlyFavorites(!onlyFavorites)}
        count={counts.favorites}
      >
        <Star
          size={13}
          className="shrink-0"
          fill={onlyFavorites ? "currentColor" : "none"}
        />
        מועדפים
      </FilterChip>
      <FilterChip onClick={() => setNewestFirst(!newestFirst)}>
        <ArrowUpDown size={13} className="shrink-0" />
        {newestFirst ? "מהחדש לישן" : "מהישן לחדש"}
      </FilterChip>
      <FilterChip
        active={showArchive}
        onClick={() => setShowArchive(!showArchive)}
        count={counts.archived}
      >
        <Archive size={13} className="shrink-0" />
        ארכיון
      </FilterChip>
    </>
  );

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className={PAGE_CONTAINER}>
        <SectionHeading title="הודעות" />

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
            {searching && (
              <button
                onClick={() => setQuery("")}
                aria-label="ניקוי חיפוש"
                className="w-5 h-5 flex items-center justify-center rounded-full bg-[rgba(23,28,35,0.08)] text-[#171c23] opacity-60 hover:opacity-100 shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* סינון נקראו/לא נקראו */}
            <FilterChip
              active={readFilter === "all"}
              onClick={() => setReadFilter("all")}
              count={counts.all}
            >
              הכל
            </FilterChip>
            <FilterChip
              active={readFilter === "unread"}
              onClick={() => setReadFilter("unread")}
              count={counts.unread}
            >
              לא נקראו
            </FilterChip>
            <FilterChip
              active={readFilter === "read"}
              onClick={() => setReadFilter("read")}
              count={counts.read}
            >
              נקראו
            </FilterChip>
            {/* במובייל שאר הסינונים נכנסים לחלון "סינון", כמו במשימות */}
            {isMobile ? (
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 bg-white text-[#171c23] text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap transition-shadow hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)]"
              >
                <SlidersHorizontal size={14} className="shrink-0" />
                סינון
                {extraFilters > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center">
                    {extraFilters}
                  </span>
                )}
              </button>
            ) : (
              <>
                <div className="w-px h-5 bg-[rgba(23,28,35,0.1)] mx-1" />
                {extraChips}
              </>
            )}
          </div>
        </div>

        {/* חלון הסינון במובייל */}
        {filtersOpen && (
          <Dialog
            onClose={() => setFiltersOpen(false)}
            title="סינון הודעות"
            subtitle={`${visibleMessages.length} מתוך ${counts.all} הודעות מוצגות`}
            footer={
              <>
                <Button
                  variant="ghost"
                  onClick={clearExtraFilters}
                  disabled={extraFilters === 0}
                >
                  ניקוי
                </Button>
                <Button onClick={() => setFiltersOpen(false)}>
                  הצגת {visibleMessages.length} הודעות
                </Button>
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {extraChips}
            </div>
          </Dialog>
        )}

        {/* שורת תוצאות: כמה מוצגות + סימון הכל כנקרא */}
        {visibleMessages.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
            <p className="text-[#171c23] text-[13px] opacity-60">
              {searching ? (
                <>
                  נמצאו {visibleMessages.length} תוצאות עבור "
                  {query.trim()}"
                </>
              ) : (
                <>
                  מוצגות {visibleMessages.length} מתוך{" "}
                  {counts.all} הודעות
                  {showArchive ? " בארכיון" : ""}
                </>
              )}
            </p>
            {unreadVisible > 0 && (
              <button
                onClick={markVisibleAsRead}
                className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
              >
                <CheckCheck size={14} className="shrink-0" />
                סימון הכל כנקרא ({unreadVisible})
              </button>
            )}
          </div>
        )}

        {/* רשימת הודעות */}
        {visibleMessages.length === 0 ? (
          <div className="bg-white rounded-[10px] p-10 flex flex-col items-center gap-3 text-center">
            <div className="bg-[rgba(0,143,240,0.08)] w-14 h-14 rounded-full flex items-center justify-center">
              {searching ? (
                <Search size={24} className="text-[#008ff0]" />
              ) : (
                <Inbox size={24} className="text-[#008ff0]" />
              )}
            </div>
            <p className="font-bold text-[#171c23] text-[16px]">
              {searching
                ? `לא נמצאו תוצאות עבור "${query.trim()}"`
                : filtersActive
                  ? "אין הודעות שתואמות את הסינון"
                  : showArchive
                    ? "הארכיון ריק"
                    : "אין הודעות"}
            </p>
            <p className="text-[#171c23] text-[14px] opacity-60 max-w-[340px]">
              {searching
                ? "נסו מילת חיפוש אחרת, או נקו את החיפוש כדי לראות את כל ההודעות"
                : filtersActive
                  ? "נסו לשנות את הסינון כדי לראות הודעות נוספות"
                  : showArchive
                    ? "הודעות שתעבירו לארכיון יופיעו כאן"
                    : "הודעות חדשות יופיעו כאן"}
            </p>
            {filtersActive && (
              <Button onClick={clearFilters} className="mt-1">
                ניקוי חיפוש וסינון
              </Button>
            )}
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
                onToggleRead={() =>
                  setReadIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(message.id))
                      next.delete(message.id);
                    else next.add(message.id);
                    return next;
                  })
                }
              />
            ))}
          </div>
        )}

        <AdBanner />
      </div>
    </section>
  );
}
