import { useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  CalendarPlus,
  Navigation,
  Check,
  CalendarDays,
  CalendarClock,
  X,
  Send,
  FileText,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./ui/calendar";
import { useIsMobile } from "./ui/use-mobile";

// ── Data ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  name: string;
  timeLeft: string;
}

const tasks: Task[] = [
  {
    id: "hobbies",
    name: "שאלון תחביבים",
    timeLeft: "נותרו 3 ימים למילוי",
  },
];

interface DocumentItem {
  id: string;
  name: string;
}

const documentsTask = {
  id: "documents",
  name: "השלמת מסמכים",
  description:
    "לא מצאנו מספר מסמכים המקושרים לשאלון רפואי שלך. אנא וודאו שכל המסמכים עודכנו במערכת. סמנו את המסמכים שכבר הועלו:",
  documents: [
    { id: "optometrist", name: "בדיקת אופטומטריסט עדכנית" },
    { id: "other-medical", name: "בדיקה רפואית אחרת" },
  ] as DocumentItem[],
};

export interface Appointment {
  id: string;
  name: string;
  day: string;
  date: string;
  time: string;
  location: string;
  /** מספר הפעמים שהזימון הוזז (עד 2) */
  rescheduleCount?: number;
  /** לזימונים קודמים בלבד */
  attended?: boolean;
}

export const upcomingAppointments: Appointment[] = [
  {
    id: "festival",
    name: 'פסטיבל מתגייסים - מועדון "יותר"',
    day: "יום שלישי",
    date: "28.07.2026",
    time: "17:00",
    location: "גני התערוכה, תל אביב",
    rescheduleCount: 0,
  },
  {
    id: "tzav-rishon",
    name: "צו ראשון - התייצבות בלשכת גיוס",
    day: "יום ראשון",
    date: "09.08.2026",
    time: "08:30",
    location: "לשכת גיוס באר שבע",
    rescheduleCount: 1,
  },
  {
    id: "maah",
    name: 'יום המא"ה - מיון, איתור והתאמה',
    day: "יום רביעי",
    date: "02.09.2026",
    time: "09:00",
    location: "לשכת גיוס תל השומר",
    rescheduleCount: 2,
  },
  {
    id: "medical",
    name: "בדיקות רפואיות משלימות",
    day: "יום שני",
    date: "21.09.2026",
    time: "10:15",
    location: "מרפאת לשכת גיוס באר שבע",
    rescheduleCount: 0,
  },
];

export const pastAppointments: Appointment[] = [
  {
    id: "interview",
    name: "ראיון אישי בלשכת גיוס",
    day: "יום חמישי",
    date: "14.05.2026",
    time: "11:00",
    location: "לשכת גיוס באר שבע",
    attended: true,
  },
  {
    id: "medical-a",
    name: "בדיקות רפואיות - שלב א'",
    day: "יום שני",
    date: "23.03.2026",
    time: "09:30",
    location: "מרפאת לשכת גיוס באר שבע",
    attended: true,
  },
  {
    id: "hebrew-test",
    name: "מבחן עברית",
    day: "יום רביעי",
    date: "11.02.2026",
    time: "13:00",
    location: "לשכת גיוס באר שבע",
    attended: false,
  },
];

const MAX_RESCHEDULES = 2;

// ── Section heading ──────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-right mb-5">
      <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
        {title}
        <span className="text-[#69c600]">.</span>
      </h2>
      {subtitle && (
        <p className="text-[#171c23] text-[14px] opacity-50 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-[10px] p-5 flex items-center justify-between gap-4 text-right w-full transition-all duration-200 cursor-pointer hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)] border border-transparent hover:border-[rgba(0,143,240,0.2)]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-[rgba(0,143,240,0.1)] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-[#008ff0]" />
        </div>
        <div className="flex flex-col items-start gap-1 min-w-0">
          <h3 className="font-bold text-[#171c23] text-[18px] truncate">
            {task.name}
          </h3>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#e07000]">
            <Clock size={13} className="shrink-0" />
            {task.timeLeft}
          </span>
        </div>
      </div>
      <span className="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold whitespace-nowrap shrink-0">
        למילוי המשימה
        <ChevronLeft
          size={16}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
      </span>
    </button>
  );
}

// ── Documents task card ──────────────────────────────────────────────────────

function DocumentsTaskCard() {
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<
    Record<string, boolean>
  >({});

  const total = documentsTask.documents.length;
  const uploadedCount = documentsTask.documents.filter(
    (doc) => uploaded[doc.id],
  ).length;
  const allUploaded = uploadedCount === total;

  const toggleDoc = (id: string) =>
    setUploaded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="bg-white rounded-[10px] transition-all duration-200 border border-transparent hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)] hover:border-[rgba(0,143,240,0.2)]">
      {/* Header row - toggles the checklist */}
      <button
        onClick={() => setOpen(!open)}
        className="group p-5 flex items-center justify-between gap-4 text-right w-full cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-[rgba(0,143,240,0.1)] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <FileText size={18} className="text-[#008ff0]" />
          </div>
          <div className="flex flex-col items-start gap-1 min-w-0">
            <h3 className="font-bold text-[#171c23] text-[18px] truncate">
              {documentsTask.name}
            </h3>
            {allUploaded ? (
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#4e9400]">
                <Check size={13} className="shrink-0" />
                כל המסמכים סומנו כהועלו
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#e07000]">
                <Clock size={13} className="shrink-0" />
                {total - uploadedCount} מתוך {total} מסמכים
                ממתינים להעלאה
              </span>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold whitespace-nowrap shrink-0">
          {open ? "סגירה" : "לפרטי המשימה"}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Expanded checklist */}
      {open && (
        <div className="px-5 pb-5 border-t border-[rgba(23,28,35,0.05)]">
          <p className="text-[#171c23] text-[14px] text-right leading-relaxed opacity-70 pt-4 mb-4">
            {documentsTask.description}
          </p>
          <div className="flex flex-col gap-2">
            {documentsTask.documents.map((doc) => {
              const isUploaded = !!uploaded[doc.id];
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`flex items-center justify-between gap-3 rounded-[8px] px-4 py-3 text-right transition-colors border ${
                    isUploaded
                      ? "bg-[rgba(105,198,0,0.08)] border-[rgba(105,198,0,0.25)]"
                      : "bg-[#f5f6fa] border-transparent hover:border-[rgba(0,143,240,0.2)]"
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <span
                      className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 border transition-colors ${
                        isUploaded
                          ? "bg-[#69c600] border-[#69c600]"
                          : "bg-white border-[rgba(23,28,35,0.25)]"
                      }`}
                    >
                      {isUploaded && (
                        <Check size={13} className="text-white" />
                      )}
                    </span>
                    <span
                      className={`text-[14px] font-semibold truncate ${
                        isUploaded
                          ? "text-[#4e9400]"
                          : "text-[#171c23]"
                      }`}
                    >
                      {doc.name}
                    </span>
                  </span>
                  <span
                    className={`text-[13px] font-semibold whitespace-nowrap shrink-0 ${
                      isUploaded
                        ? "text-[#4e9400]"
                        : "text-[#171c23] opacity-50"
                    }`}
                  >
                    {isUploaded ? "הקובץ הועלה" : "טרם הועלה"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-[rgba(23,28,35,0.05)]">
            <button className="flex items-center gap-1.5 bg-[#008ff0] text-white text-[14px] font-semibold px-6 py-2 rounded-full whitespace-nowrap transition-colors hover:bg-[#0080d6]">
              <Upload size={14} className="shrink-0" />
              השלמת חוסרים
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reschedule dialog / bottom sheet ─────────────────────────────────────────

function RescheduleDialog({
  appointment,
  rescheduleCount,
  onSubmit,
  onClose,
}: {
  appointment: Appointment;
  rescheduleCount: number;
  onSubmit: (range: DateRange) => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const maxedOut = rescheduleCount >= MAX_RESCHEDULES;

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return;
    onSubmit(range);
    setSubmitted(true);
  };

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d.M.yyyy")} - ${format(range.to, "d.M.yyyy")}`
      : null;

  const content = (
    <div className="flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(23,28,35,0.08)]">
        <div className="flex flex-col text-right">
          <span className="font-bold text-[#171c23] text-[18px]">
            הזזת זימון
          </span>
          <span className="text-[#171c23] text-[13px] opacity-60">
            {appointment.name}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-60 hover:opacity-100 shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      {submitted ? (
        /* Success state */
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <div className="bg-[rgba(105,198,0,0.12)] w-14 h-14 rounded-full flex items-center justify-center">
            <Check size={26} className="text-[#69c600]" />
          </div>
          <p className="font-bold text-[#171c23] text-[17px]">
            הבקשה נשלחה לאישור
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60 max-w-[300px]">
            ביקשת להזיז את הזימון לטווח {rangeLabel}. נעדכן אותך
            ברגע שהבקשה תאושר
          </p>
          <button
            onClick={handleClose}
            className="mt-2 bg-[#008ff0] text-white text-[14px] font-semibold px-7 py-2 rounded-full transition-colors hover:bg-[#0080d6]"
          >
            סגירה
          </button>
        </div>
      ) : (
        <div className="flex flex-col px-5 py-4 gap-3">
          {/* Reschedule count */}
          <div
            className={`flex items-center gap-2 text-[13px] font-semibold rounded-[8px] px-3 py-2 ${
              maxedOut
                ? "bg-[rgba(224,60,60,0.08)] text-[#c43c3c]"
                : "bg-[rgba(0,143,240,0.08)] text-[#008ff0]"
            }`}
          >
            <CalendarClock size={15} className="shrink-0" />
            {maxedOut
              ? `זימון זה הוזז ${MAX_RESCHEDULES} פעמים - לא ניתן להזיז אותו שוב`
              : `זימון זה הוזז ${rescheduleCount} מתוך ${MAX_RESCHEDULES} פעמים אפשריות`}
          </div>

          {!maxedOut && (
            <>
              <p className="text-[#171c23] text-[14px] text-right">
                סמנו את טווח התאריכים בו תוכלו להגיע, והבקשה
                תוגש לאישור
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  locale={he}
                  dir="rtl"
                  disabled={{ before: new Date() }}
                  classNames={{
                    nav_button_previous: "absolute right-1",
                    nav_button_next: "absolute left-1",
                    // רוחב זהה לתאי הימים (size-9) כדי שהכותרות יתיישרו מעל העמודות
                    head_cell:
                      "text-muted-foreground w-9 font-normal text-[0.8rem]",
                    // הרקע הבהיר של הטווח יושב על התא (cell) כפס רציף;
                    // בקצוות (בימין תא ההתחלה, בשמאל תא הסיום) הפס מתעגל סביב העיגול הכחול
                    cell: "relative p-0 text-center text-sm size-9 [&:has([aria-selected])]:bg-[rgba(0,143,240,0.12)] [&:has(.day-range-start)]:rounded-r-full [&:has(.day-range-end)]:rounded-l-full first:[&:has([aria-selected])]:rounded-r-full last:[&:has([aria-selected])]:rounded-l-full",
                    day: "inline-flex items-center justify-center size-9 p-0 font-normal rounded-full cursor-pointer transition-colors hover:bg-[rgba(0,143,240,0.08)] aria-selected:opacity-100",
                    day_selected:
                      "bg-[#008ff0] text-white rounded-full hover:bg-[#008ff0] hover:text-white focus:bg-[#008ff0] focus:text-white",
                    day_range_start:
                      "day-range-start bg-[#008ff0] text-white rounded-full",
                    day_range_end:
                      "day-range-end bg-[#008ff0] text-white rounded-full",
                    day_range_middle:
                      "aria-selected:bg-transparent aria-selected:text-[#171c23] rounded-none hover:aria-selected:bg-transparent",
                    day_today:
                      "border border-[#008ff0] text-[#008ff0]",
                  }}
                  components={{
                    // ב-RTL הספרייה מרנדרת את IconRight בכפתור "חודש קודם" (בימין)
                    // ואת IconLeft בכפתור "חודש הבא" (בשמאל) - החצים מצביעים החוצה
                    IconLeft: () => (
                      <ChevronLeft className="size-4" />
                    ),
                    IconRight: () => (
                      <ChevronRight className="size-4" />
                    ),
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[rgba(23,28,35,0.08)]">
                <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                  {rangeLabel
                    ? `טווח נבחר: ${rangeLabel}`
                    : "טרם נבחר טווח תאריכים"}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!range?.from || !range?.to}
                  className="flex items-center gap-1.5 bg-[#008ff0] text-white text-[14px] font-semibold px-6 py-2 rounded-full whitespace-nowrap transition-colors hover:bg-[#0080d6] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={14} className="shrink-0" />
                  הגשה לאישור
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    /* Bottom sheet */
    return (
      <div className="fixed inset-0 z-[400]" dir="rtl">
        <div
          className="absolute inset-0 bg-black/20 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          onClick={handleClose}
        />
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto"
          style={{
            transform: visible
              ? "translateY(0)"
              : "translateY(100%)",
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[rgba(23,28,35,0.15)]" />
          </div>
          {content}
          <div className="pb-6" />
        </div>
      </div>
    );
  }

  /* Desktop modal */
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="relative bg-white rounded-[14px] w-full max-w-[440px] max-h-[90vh] overflow-y-auto transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.98)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
        }}
      >
        {content}
      </div>
    </div>
  );
}

// ── Appointment card ─────────────────────────────────────────────────────────

export function AppointmentCard({
  appointment,
  past = false,
}: {
  appointment: Appointment;
  past?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleCount, setRescheduleCount] = useState(
    appointment.rescheduleCount ?? 0,
  );

  return (
    <div
      className={`bg-white rounded-[10px] p-5 flex flex-col gap-3 ${past ? "opacity-80" : ""}`}
    >
      {rescheduleOpen && (
        <RescheduleDialog
          appointment={appointment}
          rescheduleCount={rescheduleCount}
          onSubmit={() =>
            setRescheduleCount((count) =>
              Math.min(count + 1, MAX_RESCHEDULES),
            )
          }
          onClose={() => setRescheduleOpen(false)}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-[#171c23] text-[18px] text-right">
          {appointment.name}
        </h3>
        {past && (
          <span
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 ${
              appointment.attended
                ? "bg-[rgba(105,198,0,0.12)] text-[#4e9400]"
                : "bg-[rgba(224,60,60,0.08)] text-[#c43c3c]"
            }`}
          >
            {appointment.attended ? (
              <Check size={13} className="shrink-0" />
            ) : (
              <X size={13} className="shrink-0" />
            )}
            {appointment.attended ? "הגעת" : "לא הגעת"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
            <CalendarDays
              size={15}
              className="text-[#008ff0] shrink-0"
            />
            {appointment.day}, {appointment.date} |{" "}
            {appointment.time}
          </p>
          {!past && (
            <button className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold whitespace-nowrap shrink-0 opacity-80 hover:opacity-100 hover:underline">
              <CalendarPlus size={13} className="shrink-0" />
              הוספה ליומן
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
            <MapPin
              size={15}
              className="text-[#008ff0] shrink-0"
            />
            {appointment.location}
          </p>
          {!past && (
            <button className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold whitespace-nowrap shrink-0 opacity-80 hover:opacity-100 hover:underline">
              <Navigation size={13} className="shrink-0" />
              ניווט
            </button>
          )}
        </div>
      </div>

      {!past && (
        <div className="flex flex-wrap items-center justify-end gap-2 mt-auto pt-3 border-t border-[rgba(23,28,35,0.05)]">
          <button
            onClick={() => setRescheduleOpen(true)}
            className="flex items-center gap-1.5 bg-[rgba(0,143,240,0.1)] text-[#008ff0] text-[13px] font-semibold px-5 py-1.5 rounded-full whitespace-nowrap transition-colors hover:bg-[rgba(0,143,240,0.18)]"
          >
            <CalendarClock size={14} className="shrink-0" />
            הזזת זימון
          </button>
          <button
            onClick={() => setConfirmed(!confirmed)}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              confirmed
                ? "bg-[rgba(105,198,0,0.12)] text-[#4e9400]"
                : "bg-[#008ff0] text-white hover:bg-[#0080d6]"
            }`}
          >
            {confirmed && <Check size={14} className="shrink-0" />}
            {confirmed ? "הגעה אושרה" : "אישור הגעה"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TasksAppointmentsPage({
  onOpenTask,
  onViewAllAppointments,
}: {
  onOpenTask?: (id: string) => void;
  onViewAllAppointments?: () => void;
}) {
  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      {/* Tasks */}
      <SectionHeading title="משימות" />
      <div className="flex flex-col gap-4 mb-10 md:max-w-[560px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onOpenTask?.(task.id)}
          />
        ))}
        <DocumentsTaskCard />
      </div>

      {/* Upcoming appointments only, 3 nearest */}
      <SectionHeading title="זימונים" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {upcomingAppointments.slice(0, 3).map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onViewAllAppointments}
          className="group flex items-center gap-1.5 bg-[#008ff0] text-white text-[15px] font-semibold px-7 py-2.5 rounded-full whitespace-nowrap transition-colors hover:bg-[#0080d6]"
        >
          לצפייה בכל הזימונים
          <ChevronLeft
            size={17}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </button>
      </div>
    </section>
  );
}
