/**
 * התסריט של צ'אט אימות הנתונים - TypeScript נקי, בלי תלות ב-Vue.
 *
 * כל שלב (Step) יודע:
 *  - enter    - אילו הודעות העוזר שולח כשמגיעים לשלב
 *  - options  - תשובות מהירות (צ'יפים)
 *  - text     - האם מותר להקליד, ואיך בודקים את הערך
 *  - special  - קלט מיוחד: העלאת קובץ / חתימה / סיום
 *  - answer   - מה עושים עם התשובה: עדכון הנתונים, תגובה, והשלב הבא
 *
 * הודעות וכרטיסים הם אובייקטים פשוטים (בלי קומפוננטות), כך שאפשר לשמור
 * את השיחה כטיוטה, ולרנדר אותה בכל פריימוורק.
 */

// ── נתונים ─────────────────────────────────────────────────────────────────

export interface Address {
  city: string;
  street: string;
  house: string;
  entrance: string;
  floor: string;
  apt: string;
  zip: string;
}

export interface Relative {
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

export type RelativeField = "phone" | "nationalId" | "name" | "address";

/** הנתונים שהצ'אט מאמת - זה מה שצריך לטעון מהשרת ולשלוח בסיום */
export interface RecruitData {
  /** שם פרטי לפנייה בשיחה */
  firstName: string;
  address: Address;
  phone: string;
  relatives: [Relative, Relative];
  bank: { name: string; branch: string; account: string; proof: string };
  beard: boolean | null;
}

/** מצב השיחה - הנתונים + עזרים פנימיים של התסריט */
export interface Data extends RecruitData {
  /** הקרוב שעליו עובדים כרגע, והשדה שמתקנים */
  cursor: { rel: 0 | 1; field: RelativeField };
  /** הגענו מתיקון בסיכום - בסוף הנושא חוזרים לסיכום */
  fixing: boolean;
  /** שדות שעודכנו בשיחה - מסומנים "עודכן" בכרטיסים */
  changed: string[];
}

/** נתוני הדגמה - במערכת האמיתית מגיעים מהשרת */
export const DEMO_DATA: RecruitData = {
  firstName: "ישראלה",
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
};

/** העתק עמוק - JSON ולא structuredClone, כי props של Vue הם Proxy */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export const initialState = (data: RecruitData): Data => ({
  ...clone(data),
  cursor: { rel: 0, field: "phone" },
  fixing: false,
  changed: [],
});

/** מחזיר רק את נתוני המלש"ב, בלי העזרים של התסריט - לשליחה לשרת */
export function toRecruitData(d: Data): RecruitData {
  const { cursor: _c, fixing: _f, changed: _ch, ...data } = d;
  return clone(data);
}

/** נושאי השיחה - לסרגל ההתקדמות ולמסך הפתיחה. icon - מפתח ב-ICONS */
export const SECTIONS = [
  { label: "כתובת ותקשורת", icon: "map" },
  { label: "קרובים לשעת חירום", icon: "users" },
  { label: "חשבון בנק", icon: "bank" },
  { label: "פטור זקן", icon: "user" },
  { label: "סיכום וחתימה", icon: "signature" },
] as const;

const BANKS = ["הפועלים", "לאומי", "דיסקונט", "מזרחי טפחות", "הבינלאומי"];

export const DECLARATION =
  "אני מצהיר/ה שכל הפרטים שמסרתי נכונים ומדויקים, וידוע לי שעליי לעדכן את צה״ל על כל שינוי בהם.";

// ── עיצוב ערכים ─────────────────────────────────────────────────────────────

export const digits = (v: string) => v.replace(/\D/g, "");

export const fmtPhone = (p: string) =>
  p.length === 10 ? `${p.slice(0, 3)}-${p.slice(3)}` : p;

export function fmtAddress(a: Address) {
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

/**
 * מיקוד "שנמצא" עבור הכתובת - קבוע לכל כתובת, לצורך ההדגמה.
 * במערכת האמיתית: קריאה לשירות המיקוד של דואר ישראל.
 */
function lookupZip(a: Address) {
  if (a.city === "באר שבע" && a.street === "כלנית") return "8471532";
  let h = 7;
  for (const ch of `${a.city}${a.street}${a.house}`)
    h = (h * 31 + ch.charCodeAt(0)) % 9_000_000;
  return String(1_000_000 + h);
}

export const YES = /^(כן|נכון|בטח|בהחלט|מאשר|מאשרת|אישור|יפה|סבבה|אוקיי|ok|👍)/i;
export const NO = /^(לא|ממש לא|טעות|שגוי)/;

// ── הודעות וכרטיסים ────────────────────────────────────────────────────────

export type IconKey = "map" | "users" | "bank" | "user" | "signature";

export interface CardRow {
  label: string;
  value: string;
  /** אין ערך - מוצג "—" במקום "חסר" */
  optional?: boolean;
  /** הערך עודכן בשיחה - מוצג תג "עודכן" */
  changed?: boolean;
}

/** כרטיס נתונים - צילום מצב של הנתונים ברגע שליחת ההודעה */
export type Card =
  | { kind: "data"; icon: IconKey; title: string; rows: CardRow[] }
  | {
      kind: "summary";
      blocks: { icon: IconKey; title: string; lines: string[] }[];
    };

export interface BotMsg {
  text?: string;
  card?: Card;
  /** השאלה - מוצגת אחרי הכרטיס, כדי שיהיה ברור על מה עונים */
  ask?: string;
}

export interface Msg extends BotMsg {
  id: number;
  role: "bot" | "user";
  /** חתימה - תמונה (data URL) בבועת המשתמש */
  image?: string;
  /** שם קובץ שהועלה */
  file?: string;
}

const addressCard = (d: Data): Card => {
  const c = (k: string) => d.changed.includes(k);
  const a = d.address;
  return {
    kind: "data",
    icon: "map",
    title: "כתובת עיקרית",
    rows: [
      { label: "יישוב", value: a.city, changed: c("city") },
      { label: "רחוב", value: a.street, changed: c("street") },
      { label: "מספר בית", value: a.house, changed: c("house") },
      { label: "כניסה", value: a.entrance, optional: true, changed: c("entrance") },
      { label: "קומה", value: a.floor, changed: c("floor") },
      { label: "דירה", value: a.apt, optional: true, changed: c("apt") },
      { label: "מיקוד", value: a.zip, changed: c("zip") },
    ],
  };
};

const relativeCard = (d: Data, i: 0 | 1): Card => {
  const r = d.relatives[i];
  const c = (f: string) => d.changed.includes(`rel${i}.${f}`);
  return {
    kind: "data",
    icon: "users",
    title: `קרוב לשעת חירום ${i + 1}`,
    rows: [
      { label: "סוג קרבה", value: r.relation },
      { label: "שם מלא", value: fullName(r), changed: c("name") },
      { label: "תעודת זהות", value: r.nationalId, changed: c("nationalId") },
      { label: "טלפון", value: fmtPhone(r.phone), changed: c("phone") },
      { label: "כתובת", value: relativeAddress(r, d), changed: c("address") },
    ],
  };
};

const bankCard = (d: Data): Card => ({
  kind: "data",
  icon: "bank",
  title: "חשבון בנק",
  rows: [
    { label: "בנק", value: d.bank.name },
    { label: "סניף", value: d.bank.branch },
    { label: "מספר חשבון", value: d.bank.account },
    { label: "אסמכתא", value: d.bank.proof || "תוצג ביום הגיוס" },
  ],
});

const summaryCard = (d: Data): Card => ({
  kind: "summary",
  blocks: [
    {
      icon: "map",
      title: "כתובת ותקשורת",
      lines: [
        `${fmtAddress(d.address)}${d.address.floor ? `, קומה ${d.address.floor}` : ""}`,
        `מיקוד ${d.address.zip}`,
        `נייד ${fmtPhone(d.phone)}`,
      ],
    },
    {
      icon: "users",
      title: "קרובים לשעת חירום",
      lines: d.relatives.map(
        (r) => `${fullName(r)} (${r.relation}) · ${fmtPhone(r.phone)}`,
      ),
    },
    {
      icon: "bank",
      title: "חשבון בנק",
      lines: [
        `בנק ${d.bank.name} · סניף ${d.bank.branch} · חשבון ${d.bank.account}`,
        d.bank.proof ? `אסמכתא: ${d.bank.proof}` : "אסמכתא תוצג ביום הגיוס",
      ],
    },
    {
      icon: "user",
      title: "פטור זקן",
      lines: [d.beard ? "מעוניין/ת בפטור" : "לא מעוניין/ת"],
    },
  ],
});

// ── שלבים ──────────────────────────────────────────────────────────────────

export interface Option {
  label: string;
  value: string;
}

export interface Result {
  data?: Data;
  reply?: BotMsg[];
  next: StepId;
}

export interface Step {
  /** אינדקס ב-SECTIONS (5 = הסתיים) */
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

export type StepId =
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

export const FIRST_STEP: StepId = "addr";

/** הודעות הפתיחה, לפני השלב הראשון */
export const greeting = (d: Data): BotMsg[] => [
  { text: `היי ${d.firstName} 👋 אני העוזר החכם של אתר מתגייסים.` },
  {
    text: "אציג לך את הפרטים שרשומים עלייך במערכת - כל מה שצריך זה לאשר, לתקן, או להשלים את מה שחסר.",
  },
];

const YES_NO: Option[] = [
  { label: "כן, נכון", value: "yes" },
  { label: "לא, צריך לעדכן", value: "no" },
];

const mark = (d: Data, ...keys: string[]): Data => ({
  ...d,
  changed: [...new Set([...d.changed, ...keys])],
});

const setAddress = (d: Data, patch: Partial<Address>): Data =>
  mark({ ...d, address: { ...d.address, ...patch } }, ...Object.keys(patch));

const setRelative = (
  d: Data,
  i: 0 | 1,
  patch: Partial<Relative>,
  ...keys: string[]
): Data => {
  const relatives = [...d.relatives] as [Relative, Relative];
  relatives[i] = { ...relatives[i], ...patch };
  return mark({ ...d, relatives }, ...keys.map((k) => `rel${i}.${k}`));
};

/** סוף נושא - ממשיכים לנושא הבא, או חוזרים לסיכום אם הגענו מתיקון */
const after = (d: Data, next: StepId): StepId => (d.fixing ? "summary" : next);

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

export const STEPS: Record<StepId, Step> = {
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
    answer: (v) =>
      v === "yes"
        ? { next: "addrFloor", reply: [{ text: "מעולה." }] }
        : { next: "addrCity", reply: [{ text: "אין בעיה, נעדכן יחד." }] },
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
      { text: "ומה המיקוד? אם לא זוכר/ת - אני יכול למצוא אותו לפי הכתובת." },
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
    text: { placeholder: "05X-XXXXXXX", numeric: true, validate: validPhone },
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
    enter: (d) => [{ text: `מה הכתובת של ${d.relatives[1].firstName}?` }],
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
        /^\d{4,9}$/.test(digits(v)) ? null : "מספר חשבון מכיל בין 4 ל-9 ספרות.",
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
            reply: [{ text: "בסדר. רק לא לשכוח להביא את האסמכתא ליום הגיוס." }],
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
      { text: "אלה פרטי החשבון שרשמתי:", card: bankCard(d), ask: "הכל נכון?" },
    ],
    options: () => [
      { label: "כן, נכון", value: "yes" },
      { label: "לא, נתחיל מחדש", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? { next: after(d, "beard"), reply: [{ text: "פרטי הבנק נשמרו ✓" }] }
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
        card: summaryCard(d),
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
    options: () =>
      SECTIONS.slice(0, 4).map((s, i) => ({ label: s.label, value: String(i) })),
    answer: (v, d) => ({
      data: { ...d, fixing: true, cursor: { ...d.cursor, rel: 0 } },
      next: (["addr", "rel1", "bankName", "beard"] as StepId[])[Number(v)],
    }),
  },
  sign: {
    section: 4,
    enter: () => [
      { text: `נשאר רק לחתום על הצהרת נכונות הפרטים:\n**"${DECLARATION}"**` },
    ],
    special: "signature",
    answer: (_v, d) => ({
      reply: [
        {
          text: `תודה ${d.firstName}! הפרטים שלך אומתו ונשמרו. ביום הגיוס תוכל/י לדלג על תחנת אימות הנתונים.`,
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
