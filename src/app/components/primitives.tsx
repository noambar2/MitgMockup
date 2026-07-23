import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, X } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";

/**
 * אבני הבניין המשותפות של המערכת.
 * כל וריאנט מוגדר כאן פעם אחת - אין מחלקות עיצוב משוכפלות במסכים.
 */

// ── Elevation ───────────────────────────────────────────────────────────────

export const ELEVATION = {
  /** זוהר כחול על אלמנט אינטראקטיבי בריחוף */
  hover: "0 0 20px 0 rgba(0, 143, 240, 0.25)",
  /** כל מה שצף מעל התוכן - מודל, בוטום-שיט, טולטיפ, תפריט */
  overlay: "0 12px 32px rgba(0,0,0,0.16)",
} as const;

// ── Button ──────────────────────────────────────────────────────────────────

/** צבע/טון הכפתור */
export type ButtonVariant =
  | "primary"
  | "success"
  | "tint"
  | "ghost"
  | "link"
  | "linkDanger";

const BUTTON_TONES: Record<ButtonVariant, string> = {
  primary: "bg-[#008ff0] text-white hover:bg-[#0080d6]",
  success: "bg-[rgba(105,198,0,0.12)] text-[#4e9400]",
  tint: "bg-[rgba(0,143,240,0.1)] text-[#008ff0] hover:bg-[rgba(0,143,240,0.18)]",
  ghost:
    "bg-[#f5f5f7] text-[#171c23] hover:bg-[rgba(23,28,35,0.08)]",
  link: "text-[#008ff0] hover:underline",
  linkDanger: "text-[#c43c3c] hover:underline",
};

/** גודל אחיד יחיד לכל הכפתורים המלאים במערכת */
const BUTTON_SIZE = "rounded-full px-5 py-1.5 text-[13px]";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: {
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isLink = variant === "link" || variant === "linkDanger";
  return (
    <button
      {...props}
      className={`flex items-center font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isLink ? "gap-1 text-[13px]" : `gap-1.5 ${BUTTON_SIZE}`
      } ${BUTTON_TONES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────

export type StatusVariant =
  | "success"
  | "error"
  | "warning"
  | "neutral";

const BADGE_VARIANTS: Record<
  StatusVariant,
  { chip: string; dot: string }
> = {
  success: {
    chip: "bg-[rgba(105,198,0,0.12)] text-[#4e9400]",
    dot: "bg-[#69c600]",
  },
  error: {
    chip: "bg-[rgba(196,60,60,0.08)] text-[#c43c3c]",
    dot: "bg-[#c43c3c]",
  },
  warning: {
    chip: "bg-[rgba(224,112,0,0.1)] text-[#e07000]",
    dot: "bg-[#e07000]",
  },
  neutral: {
    chip: "bg-[rgba(23,28,35,0.06)] text-[rgba(23,28,35,0.62)]",
    dot: "bg-[rgba(23,28,35,0.3)]",
  },
};

export function StatusBadge({
  variant,
  dot,
  icon,
  children,
}: {
  variant: StatusVariant;
  /** נקודה צבעונית לפני הטקסט */
  dot?: boolean;
  /** אייקון במקום הנקודה */
  icon?: ReactNode;
  children: ReactNode;
}) {
  const v = BADGE_VARIANTS[variant];
  return (
    <span
      className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${v.chip}`}
    >
      {icon}
      {dot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${v.dot}`}
        />
      )}
      {children}
    </span>
  );
}

// ── Layout ──────────────────────────────────────────────────────────────────

/** רוחב תוכן אחיד לעמודי המשנה (משימות, זימונים, הודעות, הגדרות) */
export const PAGE_CONTAINER = "md:max-w-[760px] md:mx-auto";

// ── Form fields ─────────────────────────────────────────────────────────────

/** מסגרת השדה - זהה בכל הטפסים במערכת */
export const FIELD_CLASS =
  "w-full bg-white border border-[rgba(23,28,35,0.12)] rounded-[10px] px-4 py-3 text-right text-[15px] text-[#171c23] placeholder:text-[rgba(23,28,35,0.4)] outline-none transition-colors focus:border-[#008ff0]";

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <p className="text-right font-semibold text-[#171c23] text-[16px] mb-2.5">
      {children}
      {required && <span className="text-[#c43c3c]"> *</span>}
    </p>
  );
}

export function TextField({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  dir,
  ...rest
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "dir"
>) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        {...rest}
        type={type}
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLASS}
      />
    </div>
  );
}

/** בורר בעיצוב המערכת (לא select מובנה) - עם רשימה נפתחת */
export function SelectField({
  label,
  required,
  value,
  placeholder,
  options,
  onChange,
}: {
  label?: string;
  required?: boolean;
  value: string | null;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {label && (
        <FieldLabel required={required}>{label}</FieldLabel>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full bg-white border rounded-[10px] px-4 py-3 flex items-center justify-between gap-2 text-right transition-colors ${
            open
              ? "border-[#008ff0]"
              : "border-[rgba(23,28,35,0.12)] hover:border-[rgba(23,28,35,0.25)]"
          }`}
        >
          <span
            className={`text-[15px] ${value ? "text-[#171c23]" : "text-[rgba(23,28,35,0.4)]"}`}
          >
            {value || placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-[#171c23] opacity-50 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute z-20 top-full mt-1.5 w-full bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] max-h-56 overflow-y-auto py-1"
              style={{ boxShadow: ELEVATION.overlay }}
            >
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`w-full text-right px-4 py-2.5 text-[15px] transition-colors hover:bg-[rgba(0,143,240,0.06)] ${
                    option === value
                      ? "text-[#008ff0] font-semibold"
                      : "text-[#171c23]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Icon circle ─────────────────────────────────────────────────────────────

export function IconCircle({
  children,
  size = 40,
  bg = "rgba(0,143,240,0.1)",
  color = "#008ff0",
  className = "",
}: {
  children: ReactNode;
  size?: number;
  bg?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color,
      }}
    >
      {children}
    </div>
  );
}

// ── Dialog (modal on desktop / bottom-sheet on mobile) ──────────────────────

const DialogCloseContext = createContext<() => void>(() => {});
/** סוגר את הדיאלוג עם האנימציה - זמין לכל צאצא */
export const useDialogClose = () => useContext(DialogCloseContext);

export function DialogHeader({
  title,
  subtitle,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** תוכן נוסף מתחת לכותרת (למשל שורות תאריך/מיקום) */
  children?: ReactNode;
}) {
  const close = useDialogClose();
  return (
    <div className="flex flex-col gap-2.5 px-5 py-4 border-b border-[rgba(23,28,35,0.08)] shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0">
          {title && (
            <span className="font-bold text-[#171c23] text-[18px]">
              {title}
            </span>
          )}
          {subtitle && (
            <span className="text-[#171c23] text-[13px] opacity-60 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        <button
          onClick={close}
          aria-label="סגירה"
          className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-60 hover:opacity-100 shrink-0 -mt-1"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function Dialog({
  onClose,
  width = 480,
  title,
  subtitle,
  header,
  footer,
  children,
  bodyClassName = "px-5 py-5",
}: {
  onClose: () => void;
  width?: number;
  /** כותרת סטנדרטית (עם כפתור סגירה) */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** כותרת מותאמת - מחליפה את הסטנדרטית */
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  const content = (
    // שרשרת flex-1/min-h-0 - כך הגוף נגלל והפוטר תמיד נעוץ למטה
    <div className="flex flex-col flex-1 min-h-0" dir="rtl">
      {header ?? ((title || subtitle) && (
        <DialogHeader title={title} subtitle={subtitle} />
      ))}
      <div
        className={`overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}
      >
        {children}
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(23,28,35,0.08)] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <DialogCloseContext.Provider value={close}>
      {isMobile ? (
        <div className="fixed inset-0 z-[400]" dir="rtl">
          <div
            className="absolute inset-0 bg-black/20 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            onClick={close}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out flex flex-col max-h-[92vh]"
            style={{
              transform: visible
                ? "translateY(0)"
                : "translateY(100%)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[rgba(23,28,35,0.15)]" />
            </div>
            {content}
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/20 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            onClick={close}
          />
          <div
            className="relative bg-white rounded-[10px] w-full max-h-[85vh] flex flex-col transition-all duration-300"
            style={{
              maxWidth: width,
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0) scale(1)"
                : "translateY(12px) scale(0.98)",
              boxShadow: ELEVATION.overlay,
            }}
          >
            {content}
          </div>
        </div>
      )}
    </DialogCloseContext.Provider>
  );
}
