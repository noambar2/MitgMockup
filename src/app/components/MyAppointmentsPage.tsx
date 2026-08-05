import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AppointmentCard,
  SectionHeading,
  upcomingAppointments,
  pastAppointments,
  type Appointment,
} from "./TasksAppointmentsPage";
import { useIsMobile } from "./ui/use-mobile";
import { AdBanner, LayoutSwitch } from "./primitives";

/** גריד הזימונים - כרטיס אחד בשורה במובייל, שלושה בדסקטופ */
const APPOINTMENTS_GRID =
  "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch";

/** כמה זימונים מוצגים בכל אפשרות תצוגה */
const SHORT_LIST = 3;

/**
 * הזימון שבפוקוס נעצר במרחק הזה מקצה ימין (מוגדר ב-ps/scroll-ps
 * של הרצועה) - כך מציץ הזימון שלפניו מימין והבא משמאל.
 */

/**
 * קרוסלת זימונים אינסופית - הכרטיס שבפוקוס נעצר בצד ימין, לבן
 * ובגודל מלא, והשכנים משני צדדיו קטנים יותר ובעיצוב זכוכית.
 *
 * הלולאה עובדת בשכפול הרשימה שלוש פעמים: המשתמש/ת גולל/ת תמיד
 * בעותק האמצעי, וכשהגלילה חוצה אותו היא "מוחזרת" בקפיצה של רוחב
 * עותק שלם - התוכן זהה ולכן הקפיצה אינה נראית.
 */
const COPIES = 3;

function AppointmentsCarousel({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const track = useRef<HTMLDivElement>(null);
  /** מיקום הכרטיס שבפוקוס ברשימה המשוכפלת */
  const [focus, setFocus] = useState(0);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const count = appointments.length;
  const loop = Array.from({ length: COPIES }, () => appointments)
    .flat()
    .map((a, i) => ({ appointment: a, key: `${a.id}-${i}` }));

  /** רוחב כרטיס + מרווח - הצעד הבסיסי של הקרוסלה */
  const step = () => {
    const el = track.current;
    // offsetWidth ולא getBoundingClientRect - כדי להתעלם מה-scale
    const card = el?.querySelector<HTMLElement>("[data-card]");
    return card
      ? card.offsetWidth + 16
      : Math.round((el?.clientWidth ?? 0) * 0.8);
  };

  /** רוחב עותק אחד של הרשימה */
  const copyWidth = () => count * step();

  /**
   * הכרטיס שבפוקוס נגזר ממיקום הגלילה (ולא ממדידת מיקומים), כי
   * מיד אחרי קפיצת הלולאה המדידות עדיין משקפות את המצב הקודם.
   * ריפוד הרצועה שווה ל-scroll-padding, ולכן כרטיס i נעצר ב-i*step.
   */
  const sync = () => {
    const el = track.current;
    if (!el) return;
    // ב-RTL הגלילה שלילית, לכן עובדים על הערך המוחלט
    const pos = Math.abs(el.scrollLeft);
    const i = Math.round(pos / Math.max(step(), 1));
    setFocus(Math.max(0, Math.min(loop.length - 1, i)));
  };

  /** מחזיר את הגלילה לעותק האמצעי - רק אחרי שהתנועה נעצרה */
  const normalize = () => {
    const el = track.current;
    if (!el) return;
    const copy = copyWidth();
    const pos = Math.abs(el.scrollLeft);
    if (pos < copy)
      el.scrollTo({ left: -(pos + copy), behavior: "instant" });
    else if (pos >= 2 * copy)
      el.scrollTo({ left: -(pos - copy), behavior: "instant" });
    else return;
    // הקפיצה אינה מבטיחה אירוע scroll - מרעננים את הפוקוס ידנית
    sync();
  };

  const onScroll = () => {
    sync();
    clearTimeout(settle.current);
    settle.current = setTimeout(normalize, 140);
  };

  // התחלה מהעותק האמצעי, כדי שאפשר יהיה לגלול גם אחורה
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: -copyWidth(), behavior: "instant" });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [count]);

  /** i הוא מיקום ברשימה המשוכפלת - כך "הבא" אחרי האחרון הוא הראשון */
  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    // מעדכנים את הפוקוס מיד ולא ממתינים לאירועי הגלילה
    setFocus(i);
    el.scrollTo({ left: -i * step(), behavior: "smooth" });
    clearTimeout(settle.current);
    settle.current = setTimeout(normalize, 500);
  };

  const arrow =
    "w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008ff0] shadow-[0_8px_32px_rgba(18,39,54,0.16)] transition-shadow hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)]";

  return (
    <div className="relative">
      {/* חצים צפים - בדסקטופ בלבד, במובייל מחליקים באצבע.
          בלולאה אינסופית אין קצה, ולכן הם תמיד פעילים */}
      <button
        onClick={() => goTo(focus - 1)}
        aria-label="הזימון הקודם"
        className={`hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 ${arrow}`}
      >
        <ChevronRight size={20} />
      </button>
      <button
        onClick={() => goTo(focus + 1)}
        aria-label="הזימון הבא"
        className={`hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 ${arrow}`}
      >
        <ChevronLeft size={20} />
      </button>

      {/* הרצועה גולשת לרוחב המסך המלא (מבטלת את ריפוד העמוד),
          והכרטיס שבפוקוס נעצר במרחק PEEK מקצה ימין - כך מציץ
          הזימון שלפניו מימין והבא מציץ משמאל */}
      <div className="-mx-4 sm:-mx-6 md:-mx-10">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex items-stretch gap-4 overflow-x-auto snap-x snap-proximity py-2 ps-14 sm:ps-16 md:ps-20 pe-4 sm:pe-6 md:pe-10 scroll-ps-14 sm:scroll-ps-16 md:scroll-ps-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loop.map(({ appointment, key }, i) => {
            const focused = i === focus;
            return (
              <div
                key={key}
                data-card
                className={`relative snap-start shrink-0 flex w-[86%] sm:w-[380px] origin-center transition-all duration-300 ${
                  focused
                    ? "scale-100 opacity-100"
                    : "scale-[0.94] opacity-80"
                }`}
              >
                <AppointmentCard
                  appointment={appointment}
                  glass={!focused}
                />
                {/* כרטיס שאינו בפוקוס - לחיצה עליו מביאה אותו לפוקוס
                    במקום להפעיל את הכפתורים שבתוכו */}
                {!focused && (
                  <button
                    onClick={() => goTo(i)}
                    aria-label={`מעבר לזימון ${appointment.name}`}
                    className="absolute inset-0 z-10 cursor-pointer rounded-[10px]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* נקודות מיקום - אחת לכל זימון, בלי קשר לעותק שבו נמצאים */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {appointments.map((a, i) => {
          const active = focus % count === i;
          return (
            <button
              key={a.id}
              onClick={() => goTo(focus - (focus % count) + i)}
              aria-label={`מעבר לזימון ${i + 1}`}
              aria-current={active}
              className={`h-2 rounded-full transition-all duration-200 ${
                active
                  ? "w-6 bg-[#69c600]"
                  : "w-2 bg-[rgba(23,28,35,0.2)] hover:bg-[rgba(23,28,35,0.35)]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const isMobile = useIsMobile();
  const [layout, setLayout] = useState<1 | 2>(1);

  // אפשרות 1: שלושת הזימונים הקרובים. אפשרות 2: כל הזימונים
  const shown =
    layout === 1
      ? upcomingAppointments.slice(0, SHORT_LIST)
      : upcomingAppointments;

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-5">
        <SectionHeading title="זימונים עתידיים" className="mb-0" />
        <LayoutSwitch
          value={layout}
          onChange={setLayout}
          labels={[
            `${SHORT_LIST} זימונים`,
            `${upcomingAppointments.length} זימונים`,
          ]}
        />
      </div>

      {/* אפשרות 1 בדסקטופ - גריד; בכל שאר המקרים - קרוסלה */}
      {layout === 1 && !isMobile ? (
        <div className={APPOINTMENTS_GRID}>
          {shown.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      ) : (
        <AppointmentsCarousel key={layout} appointments={shown} />
      )}

      <div className="mt-10">
        <SectionHeading title="זימונים קודמים" />
        <div className={APPOINTMENTS_GRID}>
          {pastAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              past
            />
          ))}
        </div>
      </div>

      <AdBanner />
    </section>
  );
}
