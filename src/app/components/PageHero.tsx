import { createContext, useContext, type ReactNode } from "react";
import profileHero from "../../imports/classic-heroes/profile.webp";
import tasksHero from "../../imports/classic-heroes/tasks.png";
import learningsHero from "../../imports/classic-heroes/learnings.webp";
import appointmentsHero from "../../imports/classic-heroes/appointments.png";
import messagesHero from "../../imports/classic-heroes/messages.png";
import inquiriesHero from "../../imports/classic-heroes/inquiries.png";
import settingsHero from "../../imports/classic-heroes/settings.png";

/** האם האתר מוצג בגרסה הקלאסית (בדומה לאתר מתגייסים המקורי) */
export const ClassicVersionContext = createContext(false);
export const useClassicVersion = () =>
  useContext(ClassicVersionContext);

interface Hero {
  title: string;
  image: string;
  /** איזה חלק מהתמונה נשאר גלוי כשהיא נחתכת לגובה ה-hero */
  position: string;
}

// עמודים שלא מופיעים כאן (שאלונים וצ'אט) מוצגים בלי hero
const HEROES: Record<string, Hero> = {
  profile: {
    title: "שלום ישראלה",
    image: profileHero,
    // קו האופק עובר מאחורי הכרטיס, כך שהזכוכית מקבלת גם שמיים וגם אדמה
    position: "center 23%",
  },
  tasks: {
    title: "משימות",
    image: tasksHero,
    position: "center 45%",
  },
  learnings: {
    title: "לומדות",
    image: learningsHero,
    position: "center 40%",
  },
  appointments: {
    title: "זימונים",
    image: appointmentsHero,
    position: "center 30%",
  },
  messages: {
    title: "הודעות",
    image: messagesHero,
    position: "center 65%",
  },
  inquiries: {
    title: "פניות",
    image: inquiriesHero,
    position: "center 50%",
  },
  settings: {
    title: "הגדרות",
    image: settingsHero,
    position: "center 55%",
  },
};

export function PageHero({
  page,
  children,
}: {
  page: string;
  /** תוכן שיושב על התמונה מתחת לכותרת */
  children?: ReactNode;
}) {
  const hero = HEROES[page];
  if (!hero) return null;

  return (
    <section className="relative isolate min-h-[140px] md:min-h-[200px] flex flex-col justify-end overflow-hidden bg-[#122736]">
      <img
        src={hero.image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: hero.position }}
      />
      {/* שכבה כהה בגוון של האתר המקורי, מעט בהירה יותר */}
      <div className="hero-overlay absolute inset-0" />
      <div className="relative px-4 sm:px-6 md:px-10 pt-10 md:pt-6 pb-5 md:pb-6">
        {/* אותה טיפוגרפיה כמו כותרות העמודים, בלבן על התמונה */}
        <h1 className="font-bold text-white text-[28px] sm:text-[34px] tracking-tight text-right">
          {hero.title}
          <span className="text-[#69c600]">.</span>
        </h1>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </section>
  );
}
