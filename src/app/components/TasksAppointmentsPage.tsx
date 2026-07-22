import { Fragment, useState } from "react";
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
  Download,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./ui/calendar";
import {
  Button,
  Dialog,
  DialogHeader,
  IconCircle,
  StatusBadge,
  useDialogClose,
  PAGE_CONTAINER,
} from "./primitives";

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
  /** מידע מפורט על הזימון (יכול להיות ארוך) - מוצג בחלון פרטי הזימון */
  details?: string;
  /** האם קיים צו דיגיטלי להורדה */
  digitalOrder?: boolean;
  /** מספר הפעמים שהזימון הוזז (עד 2) */
  rescheduleCount?: number;
  /** לזימונים קודמים בלבד */
  attended?: boolean;
}

const TZAV_RISHON_DETAILS = `הינך מזומן/ת לצו ראשון. נא להביא עמך:
1. הצו שקיבלת בדואר.
2. תעודה מזהה (תעודת זהות, דרכון בתוקף, רישיון נהיגה).
3. יש להגיע ערוך/ה לשהייה של כ-5 שעות ולהצטייד עם אוכל ושתייה.
4. אם טופלת ע"י גורם מקצועי נפשי, יש להביא עמך חוות דעת מגורם מטפל (פסיכולוג, פסיכיאטר, עובד סוציאלי).
5. במידה ועברת אבחון דידקטי / פסיכודידקטי / נוירולוגי / ועדת אפיון זכאות, יש להביא עמך עותק מודפס שלהם.
6. יש להגיע לאחר ביצוע שאלונים ברשת - שאלון רפואי ושאלון אימות נתונים.

מסמכים רפואיים אשר יש להעביר למיטב דרך אתר מתגייסים טרם ההתייצבות ובנוסף להביא עמך לצו (במידה והנך מטופל/ת בלבד):
1. במידה וקיימת בעיה רפואית כרונית - חוות דעת מרופא מומחה המפרטת את פרטי המחלה, תופעותיה והתרופות אותן אתה נוטל.
2. הטופס הרפואי שקיבלת בצו כאשר הוא חתום על ידי רופא משפחה (לא ניתן להתחיל את הליכי המיון ללא מסמך זה מלא וחתום).
3. במידה ואינך מעוניין/ת בבדיקת אשכים ע"י רופא בלשכת הגיוס - יש להציג תוצאת בדיקת אשכים שבוצעה ע"י רופא משפחה.
4. תוצאות בדיקת שתן עדכנית מקופ"ח לצו הראשון (עדכנית עד 3 חודשים מיום הצו).
5. אם קיים קוצר ראיה (-4 ומעלה) ו/או קיים צילינדר מעל 2 - יש לצרף בדיקת רופא עיניים ובדיקת קרקעית העין (פונדוס).

מסמכים בתחום בריאות הנפש אשר יש להעביר טרם ההתייצבות ובנוסף להביא עמך לצו:
1. סיכום טיפול ממטפל - פסיכותרפיסט / פסיכולוג / עובד סוציאלי (במידה והינך מטופל/ת או טופלת בעבר).
2. חוות דעת תפקודית ממסגרת לימודית או ממקום עבודה.
3. במידה וטופלת / אושפזת / אובחנת או יש ברשותך מסמכים אודות אפיון ליווי וזכאות / אבחון הפרעה התפתחותית / אוטיזם / סיכום טיפול אחר רלוונטי - הנך מתבקש/ת להציגם.

מסמכים נוספים אשר יש להעביר טרם ההתייצבות או להביא עמך לצו:
1. מרשם לתרופות אבחנת קשב קבועות (במידה והינך נוטל/ת, לא מומלץ לקחת את התרופה בבוקר הצו, אלא להביא עמך ללשכת הגיוס וליטול אותה טרם ביצוע המבחן).

את כל המסמכים יש להעלות באתר מיטב עד 5 ימים טרם ההתייצבות בכתובת mitgaisim.idf.il. כמו כן, יש להביאם ביום ההתייצבות. בהצלחה!`;

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
    details: TZAV_RISHON_DETAILS,
    digitalOrder: true,
    rescheduleCount: 1,
  },
  {
    id: "maah",
    name: 'יום המא"ה - מיון, איתור והתאמה',
    day: "יום רביעי",
    date: "02.09.2026",
    time: "09:00",
    location: "לשכת גיוס תל השומר",
    details: `יום המא"ה (מיון, איתור והתאמה) נועד לבחון את יכולותיך במגוון מיומנויות לצורך התאמת שיבוץ מיטבי.

נא להביא עמך:
1. תעודה מזהה (תעודת זהות / דרכון בתוקף).
2. משקפיים / עדשות מגע במידה והנך משתמש/ת בהם.
3. אוכל ושתייה - היום אורך מספר שעות.

מומלץ להשלים את לומדת ההכנה ליום המא"ה באתר מתגייסים לפני ההגעה, כדי להגיע מוכן/ה יותר.`,
    rescheduleCount: 2,
  },
  {
    id: "medical",
    name: "בדיקות רפואיות משלימות",
    day: "יום שני",
    date: "21.09.2026",
    time: "10:15",
    location: "מרפאת לשכת גיוס באר שבע",
    details: `זימון לבדיקות רפואיות משלימות להשלמת הפרופיל הרפואי.

נא להביא עמך:
1. תעודה מזהה.
2. כל מסמך רפואי רלוונטי שטרם הועלה למערכת.
3. רשימת תרופות קבועות (במידה והנך נוטל/ת).`,
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

// ── Breadcrumbs ──────────────────────────────────────────────────────────────

export function Breadcrumbs({
  items,
}: {
  /** הפריט האחרון הוא העמוד הנוכחי (ללא onClick) */
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <nav className="flex items-center gap-1.5 text-[14px] mb-4">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && (
            <ChevronLeft
              size={14}
              className="text-[#171c23] opacity-40 shrink-0"
            />
          )}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="text-[#008ff0] font-semibold hover:underline underline-offset-4"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#171c23] opacity-70">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

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
                      : "bg-[#f5f5f7] border-transparent hover:border-[rgba(0,143,240,0.2)]"
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <span
                      className={`w-5 h-5 rounded-[8px] flex items-center justify-center shrink-0 border transition-colors ${
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
            <Button>
              <Upload size={14} className="shrink-0" />
              השלמת חוסרים
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reschedule dialog / bottom sheet ─────────────────────────────────────────

function RescheduleSuccess({
  rangeLabel,
}: {
  rangeLabel: string | null;
}) {
  const close = useDialogClose();
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <IconCircle
        size={56}
        bg="rgba(105,198,0,0.12)"
        color="#69c600"
      >
        <Check size={26} />
      </IconCircle>
      <p className="font-bold text-[#171c23] text-[18px]">
        הבקשה נשלחה לאישור
      </p>
      <p className="text-[#171c23] text-[14px] opacity-60 max-w-[300px]">
        ביקשת להזיז את הזימון לטווח {rangeLabel}. נעדכן אותך ברגע
        שהבקשה תאושר
      </p>
      <Button onClick={close} className="mt-2">
        סגירה
      </Button>
    </div>
  );
}

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
  const [range, setRange] = useState<DateRange | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const maxedOut = rescheduleCount >= MAX_RESCHEDULES;

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return;
    onSubmit(range);
    setSubmitted(true);
  };

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d.M.yyyy")} - ${format(range.to, "d.M.yyyy")}`
      : null;

  return (
    <Dialog
      onClose={onClose}
      width={440}
      title="הזזת זימון"
      subtitle={appointment.name}
      bodyClassName={submitted ? "px-5 py-10" : "px-5 py-4"}
      footer={
        !submitted && !maxedOut ? (
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-[#171c23] text-[13px] opacity-60 text-right">
              {rangeLabel
                ? `טווח נבחר: ${rangeLabel}`
                : "טרם נבחר טווח תאריכים"}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!range?.from || !range?.to}
            >
              <Send size={14} className="shrink-0" />
              הגשה לאישור
            </Button>
          </div>
        ) : undefined
      }
    >
      {submitted ? (
        <RescheduleSuccess rangeLabel={rangeLabel} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* מונה ההזזות */}
          <div
            className={`flex items-center gap-2 text-[13px] font-semibold rounded-[8px] px-3 py-2 ${
              maxedOut
                ? "bg-[rgba(196,60,60,0.08)] text-[#c43c3c]"
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
                סמנו את טווח התאריכים בו תוכלו להגיע, והבקשה תוגש
                לאישור
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
                    IconLeft: () => <ChevronLeft className="size-4" />,
                    IconRight: () => <ChevronRight className="size-4" />,
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}

function AppointmentDetailsDialog({
  appointment,
  past,
  confirmed,
  onConfirm,
  onClose,
  onReschedule,
}: {
  appointment: Appointment;
  past: boolean;
  confirmed: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onReschedule: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      width={560}
      bodyClassName="px-5 py-4"
      header={
        <DialogHeader title={appointment.name}>
          {/* תאריך + הוספה ליומן */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
              <CalendarDays
                size={15}
                className="text-[#008ff0] shrink-0"
              />
              {appointment.day}, {appointment.date} |{" "}
              {appointment.time}
            </span>
            {!past && (
              <Button variant="link">
                <CalendarPlus size={13} className="shrink-0" />
                הוספה ליומן
              </Button>
            )}
          </div>
          {/* מיקום + ניווט */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
              <MapPin
                size={15}
                className="text-[#008ff0] shrink-0"
              />
              {appointment.location}
            </span>
            {!past && (
              <Button variant="link">
                <Navigation size={13} className="shrink-0" />
                ניווט
              </Button>
            )}
          </div>
          {appointment.digitalOrder && (
            <div className="flex justify-center pt-1">
              <Button variant="link">
                <Download size={15} className="shrink-0" />
                הורדת צו דיגיטלי
              </Button>
            </div>
          )}
        </DialogHeader>
      }
      footer={
        !past ? (
          <DetailsFooter
            confirmed={confirmed}
            onConfirm={onConfirm}
            onReschedule={onReschedule}
          />
        ) : undefined
      }
    >
      <p className="text-[#171c23] text-[14px] text-right leading-relaxed whitespace-pre-line">
        {appointment.details}
      </p>
    </Dialog>
  );
}

/** פעולות הזימון - נפרד כדי שיוכל לסגור את החלון לפני פתיחת חלון ההזזה */
function DetailsFooter({
  confirmed,
  onConfirm,
  onReschedule,
}: {
  confirmed: boolean;
  onConfirm: () => void;
  onReschedule: () => void;
}) {
  const close = useDialogClose();
  return (
    <>
      <Button
        variant="tint"
        size="sm"
        onClick={() => {
          close();
          setTimeout(onReschedule, 280);
        }}
      >
        <CalendarClock size={14} className="shrink-0" />
        הזזת זימון
      </Button>
      <Button
        variant={confirmed ? "success" : "primary"}
        size="sm"
        onClick={onConfirm}
      >
        {confirmed && <Check size={15} className="shrink-0" />}
        {confirmed ? "הגעה אושרה" : "אישור הגעה"}
      </Button>
    </>
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleCount, setRescheduleCount] = useState(
    appointment.rescheduleCount ?? 0,
  );

  return (
    <div
      className={`bg-white rounded-[10px] p-5 flex flex-col gap-2 ${past ? "opacity-80" : ""}`}
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

      {detailsOpen && (
        <AppointmentDetailsDialog
          appointment={appointment}
          past={past}
          confirmed={confirmed}
          onConfirm={() => setConfirmed(!confirmed)}
          onClose={() => setDetailsOpen(false)}
          onReschedule={() => setRescheduleOpen(true)}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-[#171c23] text-[18px] text-right">
          {appointment.name}
        </h3>
        {past && (
          <StatusBadge
            variant={appointment.attended ? "success" : "error"}
            icon={
              appointment.attended ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <X size={13} className="shrink-0" />
              )
            }
          >
            {appointment.attended ? "הגעת" : "לא הגעת"}
          </StatusBadge>
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
            <Button variant="link" className="shrink-0">
              <CalendarPlus size={13} className="shrink-0" />
              הוספה ליומן
            </Button>
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
            <Button variant="link" className="shrink-0">
              <Navigation size={13} className="shrink-0" />
              ניווט
            </Button>
          )}
        </div>
      </div>

      {/* תצוגה מקדימה של מידע הזימון + כפתור לפרטים המלאים */}
      {appointment.details && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[#171c23] text-[13px] text-right leading-relaxed opacity-60 line-clamp-2">
            {appointment.details}
          </p>
          <Button
            variant="link"
            onClick={() => setDetailsOpen(true)}
            className="self-start"
          >
            <Info size={14} className="shrink-0" />
            פרטי הזימון המלאים
          </Button>
        </div>
      )}

        {appointment.digitalOrder && (
      <div className="flex items-center justify-center my-0 pt-2 border-t border-[rgba(23,28,35,0.05)]">
          <Button variant="link" className="shrink-0">
            <Download size={14} className="shrink-0" />
            הורדת צו דיגיטלי
          </Button>
        </div>
        )}
{/* card outside */}
      {!past && (
        <div className="flex flex-wrap items-center justify-end gap-2 mt-auto pt-3 border-t border-[rgba(23,28,35,0.05)]">
          {/* {appointment.digitalOrder && (
            <Button variant="tint" size="sm">
              <Download size={14} className="shrink-0" />
              הורדת צו דיגיטלי
            </Button>
          )} */}
          <Button
            onClick={() => setRescheduleOpen(true)}
            variant="tint"
            size="sm"
          >
            <CalendarClock size={14} className="shrink-0" />
            הזזת זימון
          </Button>
          <Button
            onClick={() => setConfirmed(!confirmed)}
            variant={confirmed ? "success" : "primary"}
            size="sm"
          >
            {confirmed && <Check size={14} className="shrink-0" />}
            {confirmed ? "הגעה אושרה" : "אישור הגעה"}
          </Button>
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
      <div className={PAGE_CONTAINER}>

      {/* Tasks */}
      <SectionHeading title="משימות" />
      <div className="flex flex-col gap-4 mb-10">
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
      {/* <SectionHeading title="זימונים" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {upcomingAppointments.slice(0, 3).map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={onViewAllAppointments}
          className="group"
        >
          לצפייה בכל הזימונים
          <ChevronLeft
            size={17}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </Button>
      </div> */}
    </div>
    </section>
  );
}
