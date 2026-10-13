import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Clock,
  Eye,
  FileCheck,
  Landmark,
  LogOut,
  MapPin,
  MessageCircle,
  Paperclip,
  PenLine,
  Send,
  ShieldCheck,
  Signature,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Button, Dialog, IconCircle, ProgressBar } from "./primitives";
import { GLASS_CARD } from "./ui/utils";

/**
 * אימות נתונים בצ'אט - במקום טופס "תחנת אימות נתונים" של יום הגיוס,
 * העוזר החכם מציג למלש"ב את מה שרשום עליו, מבקש אישור או תיקון,
 * ומשלים יחד איתו את מה שחסר. השיחה מתוסרטת (אין שרת) - כל שלב יודע
 * מה להציג, אילו תשובות מהירות להציע ולאן ממשיכים.
 * העיצוב לקוח מהעוזר החכם של מלש"בייה, בצבעי אתר מתגייסים.
 */

// ── נתונים ─────────────────────────────────────────────────────────────────

interface Address {
  city: string;
  street: string;
  house: string;
  entrance: string;
  floor: string;
  apt: string;
  zip: string;
}

interface Relative {
  relation: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  /** null - עוד לא ידוע אם גר/ה באותה כתובת */
  sameAddress: boolean | null;
  /** כתובת חופשית, כשלא גר/ה באותה כתובת */
  address: string;
}

type RelativeField = "phone" | "nationalId" | "name" | "address";

interface Data {
  address: Address;
  phone: string;
  relatives: [Relative, Relative];
  bank: { name: string; branch: string; account: string; proof: string };
  beard: boolean | null;
  /** הקרוב שעליו עובדים כרגע, והשדה שמתקנים */
  cursor: { rel: 0 | 1; field: RelativeField };
  /** הגענו מתיקון בסיכום - בסוף הנושא חוזרים לסיכום */
  fixing: boolean;
  /** שדות שעודכנו בשיחה - מסומנים בכרטיסים */
  changed: string[];
}

const INITIAL_DATA: Data = {
  address: {
    city: "באר שבע",
    street: "כלנית",
    house: "32",
    entrance: "",
    floor: "",
    apt: "5",
    zip: "",
  },
  phone: "0500000000",
  relatives: [
    {
      relation: "אב",
      firstName: "דני",
      lastName: "ישראלית",
      nationalId: "211716293",
      phone: "0500000000",
      sameAddress: false,
      address: "רחוב כלנית 32, דירה 5, באר שבע",
    },
    {
      relation: "אם",
      firstName: "שירי",
      lastName: "ישראלית",
      nationalId: "",
      phone: "0521234567",
      sameAddress: null,
      address: "",
    },
  ],
  bank: { name: "", branch: "", account: "", proof: "" },
  beard: null,
  cursor: { rel: 0, field: "phone" },
  fixing: false,
  changed: [],
};

const SECTIONS = [
  { label: "כתובת ותקשורת", icon: MapPin },
  { label: "קרובים לשעת חירום", icon: Users },
  { label: "חשבון בנק", icon: Landmark },
  { label: "פטור זקן", icon: UserRound },
  { label: "סיכום וחתימה", icon: Signature },
] as const;

const BANKS = [
  "הפועלים",
  "לאומי",
  "דיסקונט",
  "מזרחי טפחות",
  "הבינלאומי",
];

const DECLARATION =
  "אני מצהיר/ה שכל הפרטים שמסרתי נכונים ומדויקים, וידוע לי שעליי לעדכן את צה״ל על כל שינוי בהם.";

// ── עיצוב ערכים ─────────────────────────────────────────────────────────────

const digits = (v: string) => v.replace(/\D/g, "");

const fmtPhone = (p: string) =>
  p.length === 10 ? `${p.slice(0, 3)}-${p.slice(3)}` : p;

function fmtAddress(a: Address) {
  const parts = [`רחוב ${a.street} ${a.house}`];
  if (a.entrance) parts.push(`כניסה ${a.entrance}`);
  if (a.apt) parts.push(`דירה ${a.apt}`);
  parts.push(a.city);
  return parts.join(", ");
}

const fullName = (r: Relative) => `${r.firstName} ${r.lastName}`;

function relativeAddress(r: Relative, d: Data) {
  if (r.sameAddress === null) return "";
  return r.sameAddress ? `${fmtAddress(d.address)} (כמו שלך)` : r.address;
}

/** מיקוד "שנמצא" עבור הכתובת - קבוע לכל כתובת, לצורך ההדגמה */
function lookupZip(a: Address) {
  if (a.city === "באר שבע" && a.street === "כלנית") return "8471532";
  let h = 7;
  for (const ch of `${a.city}${a.street}${a.house}`)
    h = (h * 31 + ch.charCodeAt(0)) % 9_000_000;
  return String(1_000_000 + h);
}

const YES = /^(כן|נכון|בטח|בהחלט|מאשר|מאשרת|אישור|יפה|סבבה|אוקיי|ok|👍)/i;
const NO = /^(לא|ממש לא|טעות|שגוי)/;

// ── הודעות ─────────────────────────────────────────────────────────────────

interface BotMsg {
  text?: string;
  card?: ReactNode;
  /** השאלה - מוצגת אחרי הכרטיס, כדי שיהיה ברור על מה עונים */
  ask?: string;
}

interface Msg extends BotMsg {
  id: number;
  role: "bot" | "user";
  /** חתימה - מוצגת כתמונה בבועת המשתמש */
  image?: string;
  /** שם קובץ שהועלה */
  file?: string;
}

/** **מודגש** בתוך טקסט ההודעה */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-bold text-[#122736]">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

// ── כרטיסי נתונים בתוך הצ'אט ─────────────────────────────────────────────────

/** זכוכית אטומה יותר מהצ'יפים - הנתונים צריכים להיקרא בבירור על הרקע */
const GLASS_PANEL =
  "bg-white/50 backdrop-blur-2xl backdrop-saturate-150 border border-white/70 shadow-[0_8px_32px_rgba(18,39,54,0.12)]";

interface Row {
  label: string;
  value: string;
  /** מפתח לסימון "עודכן" */
  key?: string;
  optional?: boolean;
}

function DataCard({
  icon: Icon,
  title,
  rows,
  changed = [],
}: {
  icon: typeof MapPin;
  title: string;
  rows: Row[];
  changed?: string[];
}) {
  return (
    <div className={`mt-3 rounded-[14px] ${GLASS_PANEL} p-3.5 sm:p-4`}>
      <div className="flex items-center gap-2 mb-2.5">
        <IconCircle size={28}>
          <Icon size={14} />
        </IconCircle>
        <span className="font-bold text-[#171c23] text-[14px]">
          {title}
        </span>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
        {rows.map((row) => {
          const isChanged = row.key && changed.includes(row.key);
          return (
            <div key={row.label} className="min-w-0">
              <dt className="text-[12px] text-[#171c23] opacity-55">
                {row.label}
              </dt>
              <dd className="text-[14px] font-semibold text-[#171c23] flex items-center gap-1.5 flex-wrap">
                {row.value ? (
                  <span className="break-words min-w-0">
                    {row.value}
                  </span>
                ) : row.optional ? (
                  <span className="font-normal opacity-40">—</span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(224,112,0,0.1)] text-[#e07000]">
                    חסר
                  </span>
                )}
                {isChanged && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(105,198,0,0.12)] text-[#4e9400]">
                    <Check size={11} />
                    עודכן
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

const addressCard = (d: Data) => (
  <DataCard
    icon={MapPin}
    title="כתובת עיקרית"
    changed={d.changed}
    rows={[
      { label: "יישוב", value: d.address.city, key: "city" },
      { label: "רחוב", value: d.address.street, key: "street" },
      { label: "מספר בית", value: d.address.house, key: "house" },
      {
        label: "כניסה",
        value: d.address.entrance,
        key: "entrance",
        optional: true,
      },
      { label: "קומה", value: d.address.floor, key: "floor" },
      { label: "דירה", value: d.address.apt, key: "apt", optional: true },
      { label: "מיקוד", value: d.address.zip, key: "zip" },
    ]}
  />
);

const relativeCard = (d: Data, i: 0 | 1) => {
  const r = d.relatives[i];
  const k = (f: string) => `rel${i}.${f}`;
  return (
    <DataCard
      icon={Users}
      title={`קרוב לשעת חירום ${i + 1}`}
      changed={d.changed}
      rows={[
        { label: "סוג קרבה", value: r.relation },
        { label: "שם מלא", value: fullName(r), key: k("name") },
        {
          label: "תעודת זהות",
          value: r.nationalId,
          key: k("nationalId"),
        },
        { label: "טלפון", value: fmtPhone(r.phone), key: k("phone") },
        {
          label: "כתובת",
          value: relativeAddress(r, d),
          key: k("address"),
        },
      ]}
    />
  );
};

const bankCard = (d: Data) => (
  <DataCard
    icon={Landmark}
    title="חשבון בנק"
    rows={[
      { label: "בנק", value: d.bank.name },
      { label: "סניף", value: d.bank.branch },
      { label: "מספר חשבון", value: d.bank.account },
      {
        label: "אסמכתא",
        value: d.bank.proof || "תוצג ביום הגיוס",
      },
    ]}
  />
);

function SummaryCard({ d }: { d: Data }) {
  const blocks = [
    {
      icon: MapPin,
      title: "כתובת ותקשורת",
      lines: [
        `${fmtAddress(d.address)}${d.address.floor ? `, קומה ${d.address.floor}` : ""}`,
        `מיקוד ${d.address.zip}`,
        `נייד ${fmtPhone(d.phone)}`,
      ],
    },
    {
      icon: Users,
      title: "קרובים לשעת חירום",
      lines: d.relatives.map(
        (r) =>
          `${fullName(r)} (${r.relation}) · ${fmtPhone(r.phone)}`,
      ),
    },
    {
      icon: Landmark,
      title: "חשבון בנק",
      lines: [
        `בנק ${d.bank.name} · סניף ${d.bank.branch} · חשבון ${d.bank.account}`,
        d.bank.proof ? `אסמכתא: ${d.bank.proof}` : "אסמכתא תוצג ביום הגיוס",
      ],
    },
    {
      icon: UserRound,
      title: "פטור זקן",
      lines: [d.beard ? "מעוניין/ת בפטור" : "לא מעוניין/ת"],
    },
  ];
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {blocks.map(({ icon: Icon, title, lines }) => (
        <div
          key={title}
          className={`rounded-[14px] ${GLASS_PANEL} p-3.5 flex flex-col gap-1`}
        >
          <span className="flex items-center gap-2 font-bold text-[#171c23] text-[14px] mb-1">
            <Icon size={15} className="text-[#008ff0] shrink-0" />
            {title}
          </span>
          {lines.map((line) => (
            <span
              key={line}
              className="text-[13px] text-[#171c23] opacity-75 leading-snug"
            >
              {line}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── התסריט ─────────────────────────────────────────────────────────────────

interface Option {
  label: string;
  value: string;
}

interface Result {
  data?: Data;
  reply?: BotMsg[];
  next: StepId;
}

interface Step {
  section: number;
  enter: (d: Data) => BotMsg[];
  options?: (d: Data) => Option[];
  /** שדה טקסט חופשי - בלעדיו מצפים לבחירה מהאפשרויות */
  text?: {
    placeholder: string;
    numeric?: boolean;
    /** הודעת שגיאה, או null כשהערך תקין */
    validate?: (v: string) => string | null;
  };
  /** קלט מיוחד במקום השדה */
  special?: "file" | "signature" | "done";
  answer: (value: string, d: Data) => Result;
}

type StepId =
  | "addr"
  | "addrCity"
  | "addrStreet"
  | "addrApt"
  | "addrFloor"
  | "addrZip"
  | "phone"
  | "phoneNew"
  | "rel1"
  | "rel2Id"
  | "rel2Addr"
  | "rel2AddrText"
  | "rel2"
  | "relFixPick"
  | "relFixValue"
  | "bankName"
  | "bankBranch"
  | "bankAccount"
  | "bankProof"
  | "bankConfirm"
  | "beard"
  | "summary"
  | "fixPick"
  | "sign"
  | "done";

const YES_NO: Option[] = [
  { label: "כן, נכון", value: "yes" },
  { label: "לא, צריך לעדכן", value: "no" },
];

const mark = (d: Data, ...keys: string[]): Data => ({
  ...d,
  changed: [...new Set([...d.changed, ...keys])],
});

const setAddress = (d: Data, patch: Partial<Address>): Data =>
  mark(
    { ...d, address: { ...d.address, ...patch } },
    ...Object.keys(patch),
  );

const setRelative = (
  d: Data,
  i: 0 | 1,
  patch: Partial<Relative>,
  ...keys: string[]
): Data => {
  const relatives = [...d.relatives] as [Relative, Relative];
  relatives[i] = { ...relatives[i], ...patch };
  return mark(
    { ...d, relatives },
    ...keys.map((k) => `rel${i}.${k}`),
  );
};

/** סוף נושא - ממשיכים לנושא הבא, או חוזרים לסיכום אם הגענו מתיקון */
const after = (d: Data, next: StepId): StepId =>
  d.fixing ? "summary" : next;

const validPhone = (v: string) =>
  /^05\d{8}$/.test(digits(v))
    ? null
    : "מספר נייד צריך להכיל 10 ספרות ולהתחיל ב-05, למשל 052-1234567.";

const validId = (v: string) =>
  digits(v).length === 9
    ? null
    : "מספר תעודת זהות צריך להכיל 9 ספרות (כולל ספרת ביקורת).";

const RELATIVE_FIELDS: Record<RelativeField, string> = {
  phone: "טלפון",
  nationalId: "תעודת זהות",
  name: "שם",
  address: "כתובת",
};

const STEPS: Record<StepId, Step> = {
  // ── כתובת ותקשורת ──
  addr: {
    section: 0,
    enter: (d) => [
      {
        text: `נתחיל בכתובת. אני רואה שהכתובת העיקרית שלך היא **${fmtAddress(d.address)}**.`,
        card: addressCard(d),
        ask: "האם זה נכון?",
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? { next: "addrFloor", reply: [{ text: "מעולה." }] }
        : {
            next: "addrCity",
            reply: [{ text: "אין בעיה, נעדכן יחד." }],
          },
  },
  addrCity: {
    section: 0,
    enter: () => [{ text: "באיזה יישוב את/ה גר/ה היום?" }],
    text: { placeholder: "לדוגמה: תל אביב-יפו" },
    answer: (v, d) => ({
      data: setAddress(d, { city: v.trim() }),
      next: "addrStreet",
    }),
  },
  addrStreet: {
    section: 0,
    enter: () => [{ text: "מה שם הרחוב ומספר הבית?" }],
    text: {
      placeholder: "לדוגמה: הרצל 12",
      validate: (v) =>
        /\d/.test(v) && /[^\d\s]/.test(v)
          ? null
          : "חסר לי שם רחוב או מספר בית. אפשר לכתוב למשל: הרצל 12",
    },
    answer: (v, d) => {
      const house = v.match(/\d+[א-ת]?/)?.[0] ?? "";
      const street = v
        .replace(house, "")
        .replace(/^\s*רחוב\s+/, "")
        .replace(/[,]/g, "")
        .trim();
      return {
        data: setAddress(d, { street, house, zip: "", floor: "" }),
        next: "addrApt",
      };
    },
  },
  addrApt: {
    section: 0,
    enter: () => [{ text: "ומספר דירה?" }],
    options: () => [{ label: "בית פרטי, אין דירה", value: "none" }],
    text: { placeholder: "מספר דירה", numeric: true },
    answer: (v, d) => ({
      data: setAddress(d, { apt: v === "none" ? "" : digits(v) }),
      next: "addrFloor",
    }),
  },
  addrFloor: {
    section: 0,
    enter: () => [{ text: "חסרה לי הקומה. באיזו קומה את/ה גר/ה?" }],
    options: () => [
      { label: "קומת קרקע", value: "0" },
      { label: "בית פרטי", value: "private" },
    ],
    text: { placeholder: "מספר קומה", numeric: true },
    answer: (v, d) => ({
      data: setAddress(d, {
        floor: v === "private" ? "בית פרטי" : v === "0" ? "קרקע" : digits(v),
      }),
      next: "addrZip",
    }),
  },
  addrZip: {
    section: 0,
    enter: () => [
      {
        text: "ומה המיקוד? אם לא זוכר/ת - אני יכול למצוא אותו לפי הכתובת.",
      },
    ],
    options: () => [{ label: "תמצא בשבילי", value: "lookup" }],
    text: {
      placeholder: "מיקוד בן 7 ספרות",
      numeric: true,
      validate: (v) =>
        digits(v).length === 7 ? null : "מיקוד צריך להכיל 7 ספרות.",
    },
    answer: (v, d) => {
      const zip = v === "lookup" ? lookupZip(d.address) : digits(v);
      const next = setAddress(d, { zip });
      return {
        data: next,
        reply: [
          {
            text:
              v === "lookup"
                ? `מצאתי - המיקוד הוא **${zip}**. הנה הכתובת המעודכנת:`
                : "תודה! הנה הכתובת המעודכנת:",
            card: addressCard(next),
          },
        ],
        next: "phone",
      };
    },
  },
  phone: {
    section: 0,
    enter: (d) => [
      {
        text: `המספר הנייד שרשום אצלנו הוא **${fmtPhone(d.phone)}**. זה עדיין המספר שלך?`,
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? {
            next: after(d, "rel1"),
            reply: [{ text: "סיימנו עם הכתובת והטלפון ✓" }],
          }
        : { next: "phoneNew" },
  },
  phoneNew: {
    section: 0,
    enter: () => [{ text: "מה מספר הנייד העדכני שלך?" }],
    text: {
      placeholder: "05X-XXXXXXX",
      numeric: true,
      validate: validPhone,
    },
    answer: (v, d) => ({
      data: mark({ ...d, phone: digits(v) }, "phone"),
      reply: [
        {
          text: `עדכנתי את המספר ל-**${fmtPhone(digits(v))}**. סיימנו עם הכתובת והטלפון ✓`,
        },
      ],
      next: after(d, "rel1"),
    }),
  },

  // ── קרובים לשעת חירום ──
  rel1: {
    section: 1,
    enter: (d) => [
      {
        text: "עכשיו נעבור על הקרובים לשעת חירום - האנשים שצה״ל ייצור איתם קשר אם חלילה יקרה משהו. צריך שניים.",
      },
      {
        text: `הקרוב הראשון שרשום אצלנו הוא **${fullName(d.relatives[0])} (${d.relatives[0].relation})**.`,
        card: relativeCard(d, 0),
        ask: "הפרטים נכונים?",
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? {
            data: { ...d, cursor: { ...d.cursor, rel: 1 } },
            next: d.relatives[1].nationalId ? "rel2" : "rel2Id",
          }
        : {
            data: { ...d, cursor: { ...d.cursor, rel: 0 } },
            next: "relFixPick",
          },
  },
  rel2Id: {
    section: 1,
    enter: (d) => [
      {
        text: `את הקרובה השנייה, **${fullName(d.relatives[1])} (${d.relatives[1].relation})**, כבר מצאתי - אבל חסרה לי תעודת הזהות שלה.`,
        card: relativeCard(d, 1),
        ask: "מה מספר תעודת הזהות שלה?",
      },
    ],
    text: { placeholder: "9 ספרות", numeric: true, validate: validId },
    answer: (v, d) => ({
      data: setRelative(d, 1, { nationalId: digits(v) }, "nationalId"),
      next: "rel2Addr",
    }),
  },
  rel2Addr: {
    section: 1,
    enter: (d) => [
      {
        text: `תודה! האם ${d.relatives[1].firstName} גרה איתך, ב${fmtAddress(d.address)}?`,
      },
    ],
    options: () => [
      { label: "כן, אותה כתובת", value: "yes" },
      { label: "לא, כתובת אחרת", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? {
            data: setRelative(d, 1, { sameAddress: true }, "address"),
            next: "rel2",
          }
        : { next: "rel2AddrText" },
  },
  rel2AddrText: {
    section: 1,
    enter: (d) => [
      { text: `מה הכתובת של ${d.relatives[1].firstName}?` },
    ],
    text: { placeholder: "רחוב, מספר בית, דירה ויישוב" },
    answer: (v, d) => ({
      data: setRelative(
        d,
        1,
        { sameAddress: false, address: v.trim() },
        "address",
      ),
      next: "rel2",
    }),
  },
  rel2: {
    section: 1,
    enter: (d) => [
      {
        text: `אלה הפרטים של **${fullName(d.relatives[1])}**:`,
        card: relativeCard(d, 1),
        ask: "הכל נכון?",
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? {
            next: after(d, "bankName"),
            reply: [{ text: "שני הקרובים לשעת חירום מעודכנים ✓" }],
          }
        : {
            data: { ...d, cursor: { ...d.cursor, rel: 1 } },
            next: "relFixPick",
          },
  },
  relFixPick: {
    section: 1,
    enter: () => [{ text: "מה צריך לתקן?" }],
    options: () =>
      (Object.keys(RELATIVE_FIELDS) as RelativeField[]).map((f) => ({
        label: RELATIVE_FIELDS[f],
        value: f,
      })),
    answer: (v, d) => ({
      data: { ...d, cursor: { ...d.cursor, field: v as RelativeField } },
      next: "relFixValue",
    }),
  },
  relFixValue: {
    section: 1,
    enter: (d) => {
      const r = d.relatives[d.cursor.rel];
      const prompts: Record<RelativeField, string> = {
        phone: `מה מספר הטלפון של ${r.firstName}?`,
        nationalId: `מה מספר תעודת הזהות של ${r.firstName}?`,
        name: "מה השם המלא (פרטי ומשפחה)?",
        address: `מה הכתובת של ${r.firstName}?`,
      };
      return [{ text: prompts[d.cursor.field] }];
    },
    text: { placeholder: "הקלד/י את הערך המעודכן" },
    answer: (v, d) => {
      const { rel, field } = d.cursor;
      const value = v.trim();
      const error =
        field === "phone"
          ? validPhone(value)
          : field === "nationalId"
            ? validId(value)
            : field === "name" && value.split(/\s+/).length < 2
              ? "צריך שם פרטי ושם משפחה."
              : null;
      if (error) return { reply: [{ text: error }], next: "relFixValue" };
      const [firstName, ...rest] = value.split(/\s+/);
      const patch: Partial<Relative> =
        field === "phone"
          ? { phone: digits(value) }
          : field === "nationalId"
            ? { nationalId: digits(value) }
            : field === "name"
              ? { firstName, lastName: rest.join(" ") }
              : { sameAddress: false, address: value };
      return {
        data: setRelative(d, rel, patch, field),
        reply: [{ text: "עודכן." }],
        next:
          rel === 0
            ? "rel1"
            : d.relatives[1].nationalId || field === "nationalId"
              ? "rel2"
              : "rel2Id",
      };
    },
  },

  // ── חשבון בנק ──
  bankName: {
    section: 2,
    enter: () => [
      {
        text: "כדי שנוכל להעביר לך את משכורת השירות, צריך חשבון בנק על שמך. עוד אין לנו את הפרטים - אז בוא/י נשלים אותם.",
      },
      { text: "באיזה בנק החשבון?" },
    ],
    options: () => BANKS.map((b) => ({ label: b, value: b })),
    text: { placeholder: "או הקלד/י שם של בנק אחר" },
    answer: (v, d) => ({
      data: {
        ...d,
        bank: { ...d.bank, name: v.trim().replace(/^בנק\s+/, "") },
      },
      next: "bankBranch",
    }),
  },
  bankBranch: {
    section: 2,
    enter: () => [
      {
        text: "מה מספר הסניף? הוא מופיע על פנקס הצ'קים או באפליקציה של הבנק.",
      },
    ],
    text: {
      placeholder: "עד 3 ספרות",
      numeric: true,
      validate: (v) =>
        /^\d{1,3}$/.test(digits(v)) && digits(v) === v.trim()
          ? null
          : "מספר סניף מכיל עד 3 ספרות.",
    },
    answer: (v, d) => ({
      data: { ...d, bank: { ...d.bank, branch: digits(v) } },
      next: "bankAccount",
    }),
  },
  bankAccount: {
    section: 2,
    enter: () => [{ text: "ומה מספר החשבון?" }],
    text: {
      placeholder: "מספר חשבון",
      numeric: true,
      validate: (v) =>
        /^\d{4,9}$/.test(digits(v))
          ? null
          : "מספר חשבון מכיל בין 4 ל-9 ספרות.",
    },
    answer: (v, d) => ({
      data: { ...d, bank: { ...d.bank, account: digits(v) } },
      next: "bankProof",
    }),
  },
  bankProof: {
    section: 2,
    enter: () => [
      {
        text: "כדי לאמת את הפרטים צריך גם אסמכתא - **צילום צ'ק** או **אישור ניהול חשבון** מהבנק.",
      },
    ],
    special: "file",
    options: () => [{ label: "אביא ביום הגיוס", value: "later" }],
    answer: (v, d) =>
      v === "later"
        ? {
            data: { ...d, bank: { ...d.bank, proof: "" } },
            reply: [
              {
                text: "בסדר. רק לא לשכוח להביא את האסמכתא ליום הגיוס.",
              },
            ],
            next: "bankConfirm",
          }
        : {
            data: { ...d, bank: { ...d.bank, proof: v } },
            reply: [{ text: "קיבלתי את הקובץ, תודה." }],
            next: "bankConfirm",
          },
  },
  bankConfirm: {
    section: 2,
    enter: (d) => [
      {
        text: "אלה פרטי החשבון שרשמתי:",
        card: bankCard(d),
        ask: "הכל נכון?",
      },
    ],
    options: () => [
      { label: "כן, נכון", value: "yes" },
      { label: "לא, נתחיל מחדש", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? {
            next: after(d, "beard"),
            reply: [{ text: "פרטי הבנק נשמרו ✓" }],
          }
        : { next: "bankName" },
  },

  // ── פטור זקן ──
  beard: {
    section: 3,
    enter: () => [
      {
        text: "שאלה אחרונה: האם את/ה מעוניין/ת בפטור זקן? הפטור מיועד למי שמגדל זקן מטעמי דת או מסורת.",
      },
    ],
    options: () => [
      { label: "לא, לא רלוונטי", value: "no" },
      { label: "כן, מעוניין/ת", value: "yes" },
    ],
    answer: (v, d) => ({
      data: { ...d, beard: v === "yes" },
      reply:
        v === "yes"
          ? [
              {
                text: "רשמתי. בלשכת הגיוס ינחו אותך לגבי ההמשך ואילו אישורים צריך להביא.",
              },
            ]
          : undefined,
      next: "summary",
    }),
  },

  // ── סיכום וחתימה ──
  summary: {
    section: 4,
    enter: (d) => [
      {
        text: d.fixing
          ? "עודכן. זה הסיכום המעודכן:"
          : "זהו, עברנו על הכל! זה סיכום הפרטים שלך:",
        card: <SummaryCard d={d} />,
        ask: "הכל נכון?",
      },
    ],
    options: () => [
      { label: "הכל נכון, לחתימה", value: "yes" },
      { label: "רוצה לתקן משהו", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? { data: { ...d, fixing: false }, next: "sign" }
        : { next: "fixPick" },
  },
  fixPick: {
    section: 4,
    enter: () => [{ text: "מה לתקן?" }],
    options: () => SECTIONS.slice(0, 4).map((s, i) => ({
      label: s.label,
      value: String(i),
    })),
    answer: (v, d) => ({
      data: { ...d, fixing: true, cursor: { ...d.cursor, rel: 0 } },
      next: (["addr", "rel1", "bankName", "beard"] as StepId[])[
        Number(v)
      ],
    }),
  },
  sign: {
    section: 4,
    enter: () => [
      {
        text: `נשאר רק לחתום על הצהרת נכונות הפרטים:\n**"${DECLARATION}"**`,
      },
    ],
    special: "signature",
    answer: () => ({
      reply: [
        {
          text: "תודה ישראלה! הפרטים שלך אומתו ונשמרו. ביום הגיוס תוכל/י לדלג על תחנת אימות הנתונים.",
        },
      ],
      next: "done",
    }),
  },
  done: {
    section: 5,
    enter: () => [],
    special: "done",
    answer: () => ({ next: "done" }),
  },
};

// ── טיוטה - יציאה וחזרה ממשיכות מאותה נקודה ────────────────────────────────

const draftStore: {
  started: boolean;
  msgs: Msg[];
  step: StepId;
  data: Data;
} = { started: false, msgs: [], step: "addr", data: INITIAL_DATA };

// ── מסך הפתיחה ─────────────────────────────────────────────────────────────

/**
 * זכוכית - כמו הצ'יפים של נתוני האיכות בעמוד הבית: שדה ההקלדה והתשובות
 * המהירות צפים מעל השיחה ומעל הגרדיאנט של הרקע. בריחוף - לבן מלא וזוהר כחול.
 */
const GLASS = `${GLASS_CARD} hover:bg-white hover:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]`;

const BRAND_GRADIENT =
  "linear-gradient(315deg, #008ff0 0%, #20aaf5 55%, #00d0ff 100%)";

function BotMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 text-white shadow-[0_6px_18px_-6px_rgba(0,143,240,0.6)]"
      style={{ width: size, height: size, background: BRAND_GRADIENT }}
    >
      <Sparkles size={size * 0.48} />
    </span>
  );
}

/** הדגמה קטנה של השיחה - בדסקטופ לצד ההסבר */
function ChatPreview() {
  return (
    <div className="rounded-[20px] bg-[#f5f5f7] p-4 flex flex-col gap-2.5 text-[13px] select-none">
      <div className="px-1 text-[#171c23] leading-relaxed">
        אני רואה שהכתובת העיקרית שלך היא{" "}
        <strong className="text-[#122736]">
          רחוב כלנית 32, באר שבע
        </strong>
        . האם זה נכון?
      </div>
      <div className="self-start bg-[#008ff0] text-white rounded-[16px] rounded-es-[6px] px-3.5 py-2">
        לא, עברנו דירה
      </div>
      <div className="px-1 text-[#171c23] leading-relaxed">
        אין בעיה, נעדכן יחד. באיזה יישוב את/ה גר/ה היום?
      </div>
      <div className="flex gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-40" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-60" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-80" />
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    icon: Eye,
    title: "מציגים לך מה רשום",
    text: "העוזר יעבור איתך על הפרטים שכבר יש לנו במערכת.",
  },
  {
    icon: CheckCheck,
    title: "מאשרים או מתקנים",
    text: "נכון? מאשרים בלחיצה. השתנה משהו? פשוט כותבים.",
  },
  {
    icon: PenLine,
    title: "משלימים את מה שחסר",
    text: "פרטים חסרים נשלים יחד, ובסוף חותמים דיגיטלית.",
  },
];

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 w-full max-w-[960px] mx-auto py-8 md:py-12 grid md:grid-cols-[1fr_340px] gap-10 items-center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-start gap-4">
          <span className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full bg-[rgba(105,198,0,0.14)] text-[#4e9400]">
            <Sparkles size={13} />
            חדש באתר מתגייסים
          </span>
          <div className="flex items-center gap-3">
            <BotMark size={48} />
            <h3 className="font-bold text-[#122736] text-[26px] sm:text-[30px] tracking-tight leading-tight">
              אימות נתונים בצ׳אט
              <span className="text-[#69c600]">.</span>
            </h3>
          </div>
          <p className="text-[#171c23] text-[16px] leading-relaxed text-right">
            היי ישראלה! במקום למלא טופס ארוך ביום הגיוס, אפשר לאמת
            את הפרטים כבר עכשיו - בשיחה קצרה עם העוזר החכם. כשתגיע/י
            ללשכת הגיוס, תחנת אימות הנתונים כבר תהיה מאחוריך.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <IconCircle size={36}>
                <Icon size={17} />
              </IconCircle>
              <span className="flex flex-col text-right">
                <span className="font-semibold text-[#171c23] text-[15px]">
                  {title}
                </span>
                <span className="text-[#171c23] text-[13px] opacity-60 leading-snug">
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-[#171c23] opacity-60">
            על מה נעבור
          </span>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#171c23] bg-[#f5f5f7] rounded-full px-3 py-1.5"
              >
                <Icon size={14} className="text-[#008ff0]" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button onClick={onStart} className="!px-6 !py-2.5 !text-[15px]">
            <MessageCircle size={16} className="shrink-0" />
            בואו נתחיל
          </Button>
          <span className="flex items-center gap-1.5 text-[13px] text-[#171c23] opacity-60">
            <Clock size={14} className="shrink-0" />
            כ-5 דקות · אפשר לעצור ולהמשיך אחר כך
          </span>
        </div>

        <span className="flex items-center gap-1.5 text-[12px] text-[#171c23] opacity-50">
          <ShieldCheck size={13} className="shrink-0" />
          הפרטים נשמרים בצורה מאובטחת ומשמשים את מערך הגיוס בלבד.
        </span>
      </div>

      <div className="hidden md:block">
        <ChatPreview />
      </div>
    </div>
  );
}

// ── חתימה ──────────────────────────────────────────────────────────────────

function SignaturePad({ onSign }: { onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  // הקנבס בגודל הפיקסלים האמיתי, כדי שהקו יהיה חד גם במסך רטינה
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#122736";
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  };

  return (
    <div className={`${GLASS_CARD} rounded-[20px] p-3 flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#171c23]">
          חתימה <span className="text-[#c43c3c]">*</span>
        </span>
        <Button variant="link" onClick={clear} disabled={empty}>
          ניקוי חתימה
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="אזור חתימה"
        className="w-full h-[120px] rounded-[12px] bg-white touch-none cursor-crosshair"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.beginPath();
          ctx.moveTo(...point(e));
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.lineTo(...point(e));
          ctx.stroke();
          setEmpty(false);
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
      <Button
        onClick={() => onSign(canvasRef.current!.toDataURL("image/png"))}
        disabled={empty}
        className="self-end"
      >
        <Signature size={15} className="shrink-0" />
        חתימה ושליחה
      </Button>
    </div>
  );
}

// ── הצ'אט ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function TypingIndicator() {
  return (
    <div
      className="flex gap-1.5 items-center px-1 py-2 self-start w-fit"
      role="status"
      aria-label="העוזר מקליד"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-[#008ff0] animate-[chat-bounce_1.1s_infinite]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

function MessageView({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="self-start max-w-[80%] animate-[chat-rise_.26s_ease-out_both]">
        <div className="bg-[#008ff0] text-white rounded-[20px] rounded-es-[6px] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {msg.image ? (
            <img
              src={msg.image}
              alt="החתימה שלך"
              className="w-[220px] max-w-full h-auto bg-white rounded-[10px]"
            />
          ) : msg.file ? (
            <span className="flex items-center gap-2">
              <FileCheck size={16} className="shrink-0" />
              {msg.file}
            </span>
          ) : (
            msg.text
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full animate-[chat-rise_.26s_ease-out_both]">
      {/* העוזר כותב ישירות על המסך - רק התשובות של המשתמש בבועה */}
      <div className="px-1 text-[16px] text-[#171c23] leading-relaxed">
        {msg.text && <Rich text={msg.text} />}
        {msg.card}
        {msg.ask && (
          <p className={msg.card ? "mt-3" : "mt-1"}>
            <Rich text={msg.ask} />
          </p>
        )}
      </div>
    </div>
  );
}

function Chat({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(draftStore.msgs);
  const [stepId, setStepId] = useState<StepId>(draftStore.step);
  const [data, setData] = useState<Data>(draftStore.data);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const nextId = useRef(msgs.length);

  const step = STEPS[stepId];
  const section = Math.min(step.section, SECTIONS.length - 1);
  const done = stepId === "done";

  useEffect(() => {
    draftStore.msgs = msgs;
    draftStore.step = stepId;
    draftStore.data = data;
  }, [msgs, stepId, data]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // השיחה נצמדת לתחתית בכל שינוי (הודעה חדשה, כרטיס, אזור תשובה שגדל),
  // אלא אם המשתמש גלל למעלה - כמו בעוזר של מלש"בייה
  const pinned = useRef(true);
  useEffect(() => {
    const el = streamRef.current!;
    const toBottom = () => {
      if (pinned.current) el.scrollTop = el.scrollHeight;
    };
    const onScroll = () => {
      pinned.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const mutations = new MutationObserver(toBottom);
    mutations.observe(el, { childList: true, subtree: true });
    const resize = new ResizeObserver(toBottom);
    resize.observe(el);
    toBottom();
    return () => {
      el.removeEventListener("scroll", onScroll);
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  // אזור התשובה צף מעל השיחה, אז השיחה מרופדת בגובה שלו (משתנה לפי השלב)
  useEffect(() => {
    const composer = composerRef.current;
    const el = streamRef.current;
    if (!composer || !el) return;
    const sync = () => {
      el.style.setProperty("--composer-h", `${composer.offsetHeight}px`);
      if (pinned.current) el.scrollTop = el.scrollHeight;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(composer);
    return () => observer.disconnect();
  }, [done]);

  // כל הודעה של המשתמש מחזירה את השיחה לתחתית
  useEffect(() => {
    pinned.current = true;
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  // אזור התשובה משנה גובה (תשובות מהירות, העלאת קובץ, חתימה) - מצמידים
  // שוב לפני הציור, כדי שההודעה האחרונה לא תוסתר מתחתיו
  useLayoutEffect(() => {
    const el = streamRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [busy, stepId, typing]);

  // הפוקוס חוזר לשדה כשהעוזר מסיים לכתוב
  useEffect(() => {
    if (!busy && step.text) inputRef.current?.focus();
  }, [busy, step.text]);

  const push = (msg: Omit<Msg, "id">) =>
    setMsgs((m) => [...m, { ...msg, id: nextId.current++ }]);

  /** העוזר "מקליד" לפני כל הודעה - זמן קצר שגדל עם אורך ההודעה */
  const say = async (list: BotMsg[]) => {
    for (const m of list) {
      if (!alive.current) return;
      setTyping(true);
      await delay(
        Math.min(450 + (m.text?.length ?? 0) * 7 + (m.card ? 250 : 0), 1300),
      );
      if (!alive.current) return;
      setTyping(false);
      push({ role: "bot", ...m });
      await delay(120);
    }
  };

  const go = async (reply: BotMsg[] | undefined, next: StepId, d: Data) => {
    setBusy(true);
    if (reply) await say(reply);
    if (!alive.current) return;
    setStepId(next);
    await say(STEPS[next].enter(d));
    setBusy(false);
  };

  // פתיחת השיחה בפעם הראשונה
  useEffect(() => {
    if (draftStore.started) return;
    draftStore.started = true;
    go(
      [
        { text: "היי ישראלה 👋 אני העוזר החכם של אתר מתגייסים." },
        {
          text: "אציג לך את הפרטים שרשומים עלייך במערכת - כל מה שצריך זה לאשר, לתקן, או להשלים את מה שחסר.",
        },
      ],
      "addr",
      data,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = step.options?.(data) ?? [];

  const respond = (value: string, label: string, extra?: Partial<Msg>) => {
    if (busy || done) return;
    push({ role: "user", text: label, ...extra });
    setDraft("");
    const result = step.answer(value, data);
    const d = result.data ?? data;
    setData(d);
    if (result.next === stepId) {
      // נשארים באותו שלב (למשל ערך לא תקין) - רק התשובה, בלי לשאול שוב
      setBusy(true);
      say(result.reply ?? []).then(() => setBusy(false));
      return;
    }
    go(result.reply, result.next, d);
  };

  /** טקסט חופשי - מתאים לאחת התשובות המהירות, או נבדק כערך */
  const submitText = (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    const byLabel = options.find((o) => o.label === text);
    if (byLabel) return respond(byLabel.value, byLabel.label);

    const hasYesNo = options.some((o) => o.value === "yes");
    if (hasYesNo && YES.test(text)) return respond("yes", text);
    if (hasYesNo && NO.test(text)) return respond("no", text);

    if (!step.text) {
      push({ role: "user", text });
      setDraft("");
      setBusy(true);
      say([
        {
          text: "לא בטוח שהבנתי. אפשר לבחור באחת התשובות שמעל שורת ההקלדה.",
        },
      ]).then(() => setBusy(false));
      return;
    }

    const error = step.text.validate?.(text);
    if (error) {
      push({ role: "user", text });
      setDraft("");
      setBusy(true);
      say([{ text: error }]).then(() => setBusy(false));
      return;
    }
    respond(text, text);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitText(draft);
  };

  const leave = () => {
    setExitOpen(false);
    onExit();
  };

  const finish = (goHome: boolean) => {
    draftStore.started = false;
    draftStore.msgs = [];
    draftStore.step = "addr";
    draftStore.data = INITIAL_DATA;
    if (goHome) onGoHome();
    else onExit();
  };

  const placeholder = busy
    ? "העוזר כותב…"
    : step.text?.placeholder ?? "אפשר לבחור תשובה או לכתוב…";

  return (
    <section className="relative flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100dvh-98px)]">
      {/* כותרת: שם המשימה, יציאה ושלבי השיחה */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)] px-4 sm:px-6 md:px-10 py-3 shrink-0">
        <div className="max-w-[760px] mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <BotMark size={30} />
              <span className="flex flex-col leading-tight min-w-0">
                <span className="font-semibold text-[#171c23] text-[14px]">
                  אימות נתונים
                </span>
                <span className="text-[12px] text-[#171c23] opacity-55 truncate">
                  {done
                    ? "הושלם"
                    : `שלב ${section + 1} מתוך ${SECTIONS.length} · ${SECTIONS[section].label}`}
                </span>
              </span>
            </span>
            {!done && (
              <button
                type="button"
                onClick={() => setExitOpen(true)}
                className="flex items-center gap-1.5 text-[#171c23] text-[13px] font-semibold opacity-60 hover:opacity-100 shrink-0"
              >
                <LogOut size={14} className="shrink-0" />
                יציאה
              </button>
            )}
          </div>
          <ProgressBar
            value={done ? 100 : (section / SECTIONS.length) * 100 + 4}
          />
        </div>
      </div>

      {/* השיחה */}
      <div
        ref={streamRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 pb-[calc(var(--composer-h,140px)+16px)]"
        role="log"
        aria-live="polite"
      >
        <div className="max-w-[760px] mx-auto flex flex-col gap-4">
          {msgs.map((m) => (
            <MessageView key={m.id} msg={m} />
          ))}
          {typing && <TypingIndicator />}
          {done && !typing && (
            <div className="flex flex-col items-center gap-3 py-6 text-center animate-[chat-rise_.26s_ease-out_both]">
              <IconCircle size={64} bg="rgba(105,198,0,0.12)" color="#69c600">
                <Check size={30} />
              </IconCircle>
              <span className="font-bold text-[#122736] text-[22px] tracking-tight">
                הנתונים אומתו בהצלחה
                <span className="text-[#69c600]">.</span>
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => finish(false)}>
                  חזרה למשימות
                </Button>
                <Button onClick={() => finish(true)}>
                  לעמוד הבית
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* אזור התשובה: תשובות מהירות + שדה הקלדה / העלאת קובץ / חתימה */}
      {!done && (
        <div
          ref={composerRef}
          className="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 md:px-10 pb-4 pt-8 pointer-events-none"
        >
          <div className="max-w-[760px] mx-auto flex flex-col gap-2 pointer-events-auto">
            {step.special === "signature" ? (
              !busy && (
                <SignaturePad
                  onSign={(url) =>
                    respond("signed", "", { image: url })
                  }
                />
              )
            ) : (
              <>
                {options.length > 0 && !busy && (
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="תשובות מהירות"
                  >
                    {options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => respond(o.value, o.label)}
                        className={`shrink-0 rounded-full ${GLASS} text-[#171c23] text-[14px] font-semibold px-4 py-2 transition-all active:scale-[.97] animate-[chat-rise_.26s_ease-out_both]`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {step.special === "file" && !busy && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) respond(f.name, "", { file: f.name });
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={`flex items-center justify-center gap-2 rounded-[20px] ${GLASS} text-[#008ff0] text-[14px] font-semibold px-4 py-4 transition-all`}
                    >
                      <Paperclip size={16} className="shrink-0" />
                      העלאת צילום צ׳ק או אישור ניהול חשבון
                    </button>
                  </>
                )}

                {step.special !== "file" && (
                  <form
                    onSubmit={onSubmit}
                    className={`flex items-center gap-2 ${GLASS} rounded-full ps-5 pe-1.5 py-1.5 transition-all focus-within:bg-white focus-within:border-[rgba(0,143,240,0.4)] focus-within:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]`}
                  >
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      disabled={busy}
                      placeholder={placeholder}
                      inputMode={step.text?.numeric ? "numeric" : "text"}
                      aria-label="תשובה"
                      className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#171c23] placeholder:text-[rgba(23,28,35,0.4)] py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={busy || !draft.trim()}
                      aria-label="שליחה"
                      className="w-10 h-10 rounded-full bg-[#008ff0] text-white flex items-center justify-center shrink-0 transition-all hover:bg-[#0080d6] active:scale-95 disabled:opacity-40"
                    >
                      <Send size={17} className="-scale-x-100" />
                    </button>
                  </form>
                )}
              </>
            )}
            {/* ההערה מוסתרת במובייל - חוסכת מקום מעל המקלדת */}
            <p className="hidden sm:block text-center text-[11.5px] text-[#171c23] opacity-45">
              העוזר מציג את הנתונים הרשומים במערכת. כל שינוי נשמר רק
              לאחר החתימה בסוף השיחה.
            </p>
          </div>
        </div>
      )}

      {exitOpen && (
        <Dialog
          onClose={() => setExitOpen(false)}
          width={420}
          title="לצאת מאימות הנתונים?"
          footer={
            <>
              <Button variant="outline" onClick={() => setExitOpen(false)}>
                המשך בשיחה
              </Button>
              <Button variant="primary" onClick={leave}>
                יציאה
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <BotMark size={40} />
            <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
              השיחה תישמר, ובכניסה הבאה נמשיך בדיוק מאותה נקודה.
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}

// ── העמוד ──────────────────────────────────────────────────────────────────

export default function DataVerificationChatPage({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  // מי שכבר התחיל שיחה חוזר ישר אליה
  const [started, setStarted] = useState(draftStore.started);

  if (started) return <Chat onExit={onExit} onGoHome={onGoHome} />;

  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="px-4 sm:px-6 md:px-10 pt-6">
        <nav className="flex items-center gap-1.5 text-[14px]">
          <button
            type="button"
            onClick={onExit}
            className="text-[#008ff0] font-semibold hover:underline underline-offset-4"
          >
            משימות
          </button>
          <ChevronLeft size={14} className="text-[#171c23] opacity-40 shrink-0" />
          <span className="text-[#171c23] opacity-70">אימות נתונים</span>
        </nav>
      </div>
      <section className="px-4 sm:px-6 md:px-10 flex flex-col flex-1">
        <IntroScreen onStart={() => setStarted(true)} />
      </section>
    </div>
  );
}
