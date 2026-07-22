import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eraser,
  ShieldCheck,
  ShieldOff,
  UserPlus,
} from "lucide-react";
import {
  Button,
  Dialog,
  StatusBadge,
  TextField,
  SelectField,
} from "./primitives";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  mailingAddress: string;
}

export interface Parent {
  id: string;
  relation: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  authorized: boolean;
}

export interface Companion {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string;
  authorized: boolean;
}

/** סוגי המלווים האפשריים */
export const COMPANION_TYPES = [
  "משפחה",
  "עובד/ת סוציאלי/ת",
  'קפ"צ',
  "עורך/ת דין",
  "ישיבה/מכינה",
  "מוסד לימודים",
  "בכירים ברשויות המקומיות",
  'עמותה עם זיקה לצה"ל',
  "מגשימים",
];

export const MAX_COMPANIONS = 2;

// ── Contact info edit ───────────────────────────────────────────────────────

export function ContactEditDialog({
  contact,
  onSave,
  onClose,
}: {
  contact: ContactInfo;
  onSave: (c: ContactInfo) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactInfo>(contact);
  const set = (k: keyof ContactInfo) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.phone.trim() !== "" && form.email.trim() !== "";

  return (
    <Dialog
      title="עריכת דרכים ליצירת קשר"
      subtitle="הפרטים ישמשו אותנו ליצירת קשר איתך לגבי הליך הגיוס"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSave(form);
              onClose();
            }}
          >
            שמירה
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            label="טלפון"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
            dir="ltr"
          />
          <TextField
            label="אימייל"
            value={form.email}
            onChange={set("email")}
            type="email"
            dir="ltr"
          />
        </div>
        <TextField
          label="כתובת"
          value={form.address}
          onChange={set("address")}
        />
        <TextField
          label="כתובת למשלוח דואר"
          value={form.mailingAddress}
          onChange={set("mailingAddress")}
        />
      </div>
    </Dialog>
  );
}

// ── Parent edit ─────────────────────────────────────────────────────────────

export function ParentEditDialog({
  parent,
  onSave,
  onClose,
}: {
  parent: Parent;
  onSave: (p: Parent) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Parent>(parent);
  const set = (k: keyof Parent) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.name.trim() !== "" && form.nationalId.trim() !== "";

  return (
    <Dialog
      title={`עריכת פרטי ${parent.relation}`}
      subtitle="עדכון פרטי ההורה המופיעים באזור האישי"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>ביטול</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSave(form);
              onClose();
            }}
          >
            שמירה
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            label="שם מלא"
            value={form.name}
            onChange={set("name")}
          />
          <TextField
            label="תעודת זהות"
            value={form.nationalId}
            onChange={set("nationalId")}
            dir="ltr"
          />
          <TextField
            label="טלפון"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
            dir="ltr"
          />
          <TextField
            label="אימייל"
            value={form.email}
            onChange={set("email")}
            type="email"
            dir="ltr"
          />
        </div>
        <TextField
          label="כתובת מגורים"
          value={form.address}
          onChange={set("address")}
        />
      </div>
    </Dialog>
  );
}

// ── Signature pad ───────────────────────────────────────────────────────────

function SignaturePad({
  signed,
  onSignedChange,
}: {
  signed: boolean;
  onSignedChange: (v: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#171c23";
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDown = (e: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!signed) onSignedChange(true);
  };

  const handleUp = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignedChange(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[#171c23] text-[13px] opacity-50">
          חתימה
        </span>
        <button
          onClick={clear}
          className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
        >
          <Eraser size={13} />
          ניקוי
        </button>
      </div>
      <div className="relative bg-[#f5f5f7] border border-[rgba(23,28,35,0.1)] rounded-[8px] overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          className="w-full h-[130px] block cursor-crosshair touch-none"
        />
        {!signed && (
          <span className="absolute inset-0 flex items-center justify-center text-[#171c23] text-[14px] opacity-35 pointer-events-none">
            חתמו כאן באמצעות העכבר או האצבע
          </span>
        )}
      </div>
    </div>
  );
}

// ── Companion create / edit wizard ──────────────────────────────────────────

const TERMS_TEXT = `אני מצהיר/ה ומאשר/ת בזאת כי:

1. אני מבקש/ת להעניק למלווה המפורט/ת לעיל הרשאת גישה לאזור האישי שלי באתר מתגייסים.
2. ההרשאה מאפשרת למלווה לצפות בפרטים האישיים שלי, בנתוני האיכות, בזימונים ובמשימות הפתוחות, וכן לסייע לי בהליך הגיוס מול מיטב.
3. ידוע לי כי המלווה לא יוכל לבצע פעולות בשמי הדורשות אימות אישי, לרבות אישור הגעה לזימון או חתימה על טפסים.
4. ההרשאה ניתנת מרצוני החופשי, ואני רשאי/ת לבטלה בכל עת דרך האזור האישי, ללא צורך בנימוק.
5. אני מאשר/ת כי הפרטים שמסרתי לגבי המלווה נכונים, וכי קיבלתי את הסכמת המלווה למסירתם.
6. ידוע לי כי מסירת פרטים כוזבים עלולה להוות עבירה על פי דין.

חתימתי מטה מהווה אישור לכל האמור לעיל.`;

export function CompanionWizard({
  companion,
  onSave,
  onClose,
}: {
  companion?: Companion;
  onSave: (c: Companion) => void;
  onClose: () => void;
}) {
  const isEdit = !!companion;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Companion>(
    companion ?? {
      id: `companion-${Date.now()}`,
      type: "",
      firstName: "",
      lastName: "",
      nationalId: "",
      phone: "",
      email: "",
      authorized: true,
    },
  );
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);

  const set = (k: keyof Companion) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const detailsValid =
    form.type !== "" &&
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.nationalId.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.email.trim() !== "";

  const stepTitles = [
    "פרטי המלווה",
    "תקנון וחתימה",
    "",
  ];

  // ── Step 3: success ──
  if (step === 3) {
    return (
      <Dialog
        title=""
        onClose={onClose}
        footer={
          <Button onClick={onClose}>סגירה</Button>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-[rgba(105,198,0,0.12)] flex items-center justify-center">
            <Check size={30} className="text-[#4e9400]" />
          </div>
          <p className="font-bold text-[#171c23] text-[20px]">
            {isEdit
              ? "פרטי המלווה עודכנו"
              : "המלווה נוסף/ה בהצלחה"}
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60 max-w-[320px] leading-relaxed">
            {form.firstName} {form.lastName} ({form.type})
            {isEdit
              ? " — הפרטים עודכנו באזור האישי שלך."
              : " נוסף/ה לרשימת המלווים שלך וההרשאה לאתר הופעלה."}
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={
        isEdit ? "עריכת פרטי מלווה" : "הוספת מלווה"
      }
      subtitle={`שלב ${step} מתוך 2 · ${stepTitles[step - 1]}`}
      width={step === 2 ? 560 : 480}
      onClose={onClose}
      footer={
        step === 1 ? (
          <>
            <Button variant="ghost" onClick={onClose}>ביטול</Button>
            <Button
              disabled={!detailsValid}
              onClick={() => setStep(2)}
            >
              הבא
              <ChevronLeft size={16} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronRight size={16} />
              חזרה
            </Button>
            <Button
              disabled={!agreed || !signed}
              onClick={() => {
                onSave(form);
                setStep(3);
              }}
            >
              סיום
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <SelectField
            label="סוג מלווה"
            value={form.type}
            onChange={set("type")}
            options={COMPANION_TYPES}
            placeholder="בחרו סוג מלווה"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="שם פרטי"
              value={form.firstName}
              onChange={set("firstName")}
            />
            <TextField
              label="שם משפחה"
              value={form.lastName}
              onChange={set("lastName")}
            />
            <TextField
              label="תעודת זהות"
              value={form.nationalId}
              onChange={set("nationalId")}
              dir="ltr"
            />
            <TextField
              label="פלאפון"
              value={form.phone}
              onChange={set("phone")}
              type="tel"
              dir="ltr"
            />
          </div>
          <TextField
            label="מייל"
            value={form.email}
            onChange={set("email")}
            type="email"
            dir="ltr"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* תקנון */}
          <div>
            <span className="text-[#171c23] text-[13px] opacity-50">
              תקנון הרשאת מלווה
            </span>
            <div className="mt-1.5 bg-[#f5f5f7] border border-[rgba(23,28,35,0.1)] rounded-[8px] p-4 max-h-[190px] overflow-y-auto">
              <p className="text-[#171c23] text-[14px] leading-relaxed whitespace-pre-line">
                {TERMS_TEXT}
              </p>
            </div>
          </div>

          {/* אישור קריאה */}
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-2.5 text-right"
          >
            <span
              className={`w-5 h-5 rounded-[8px] flex items-center justify-center shrink-0 border transition-colors mt-0.5 ${
                agreed
                  ? "bg-[#69c600] border-[#69c600]"
                  : "bg-white border-[rgba(23,28,35,0.25)]"
              }`}
            >
              {agreed && <Check size={13} className="text-white" />}
            </span>
            <span className="text-[#171c23] text-[14px] leading-relaxed">
              קראתי את התקנון ואני מאשר/ת את תנאיו
            </span>
          </button>

          {/* חתימה */}
          <SignaturePad
            signed={signed}
            onSignedChange={setSigned}
          />
        </div>
      )}
    </Dialog>
  );
}

// ── Site permissions block (bottom of each parent / companion) ──────────────

export function AuthPermissionsBlock({
  authorized,
  onToggle,
}: {
  authorized: boolean;
  onToggle: () => void;
}) {
  return (
    // בנוי כמו שדה: לייבל למעלה, ומתחתיו הצ'יפ עם כפתור הפעולה משמאלו
    <div className="flex flex-col items-start gap-1">
      <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
        הרשאות לאתר
      </span>
      <div className="flex items-center gap-2">
        <StatusBadge
          variant={authorized ? "success" : "neutral"}
          dot
        >
          {authorized ? "הרשאה מאושרת" : "הרשאה הוסרה"}
        </StatusBadge>
        <Button
          variant={authorized ? "linkDanger" : "link"}
          onClick={onToggle}
        >
          {authorized ? (
            <>
              <ShieldOff size={13} className="shrink-0" />
              הסרת הרשאה
            </>
          ) : (
            <>
              <ShieldCheck size={13} className="shrink-0" />
              מתן הרשאה
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── "Add companion" button ──────────────────────────────────────────────────

export function AddCompanionBtn({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      title={
        disabled ? `ניתן להוסיף עד ${MAX_COMPANIONS} מלווים` : undefined
      }
      className="!text-[13px] !px-4 !py-1.5"
    >
      <UserPlus size={14} className="shrink-0" />
      הוספת מלווה
    </Button>
  );
}
