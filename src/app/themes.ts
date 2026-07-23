/**
 * ערכות נושא - מיטב מתגייסים
 * ──────────────────────────
 * כל ערכה מגדירה צבע מותג, רקע עמוד, גרדיאנט הרקע וגרדיאנט סרגל הניווט.
 * הכותרת העליונה (נייבי + לוגו מיטב) לא משתנה בין ערכות.
 */

export interface Theme {
  id: string;
  name: string;
  /** משטחים כהים (כרטיסים כהים, טקסט בהיר) */
  dark: boolean;
  /** צבע המותג - כפתורים, קישורים, אייקונים */
  brand: string;
  /** גוון המותג במעבר עכבר */
  brandHover: string;
  /** "R,G,B" של צבע המותג - לחישוב גווני שקיפות */
  brandRgb: string;
  /** רקע העמוד מתחת לגרדיאנט */
  pageBg: string;
  /** שני צבעי הכתמים ברקע */
  blobA: string;
  blobB: string;
  /** עוצמת הכתמים - בערכות כהות צריך יותר */
  blobOpacity: number;
  /** גרדיאנט סרגל הניווט (הפס מתחת לכותרת) */
  navGradient: string;
  /** צבע ההדגמה בבורר הערכות */
  swatch: string;
}

export const THEMES: Theme[] = [
  {
    id: "light",
    name: "בהיר",
    dark: false,
    brand: "#008ff0",
    brandHover: "#0080d6",
    brandRgb: "0,143,240",
    pageBg: "#f5f5f7",
    blobA: "#008ff0",
    blobB: "#69c600",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(36,83,119) 6%, rgb(19,131,208) 48%, rgb(0,143,240) 102%, rgb(93,184,245) 113%)",
    swatch: "#008ff0",
  },
  {
    id: "dark",
    name: "כהה",
    dark: true,
    brand: "#4db4f5",
    brandHover: "#6ec4f8",
    brandRgb: "77,180,245",
    pageBg: "#0c1720",
    blobA: "#1e7fc4",
    blobB: "#2f9c6a",
    blobOpacity: 1.7,
    navGradient:
      "linear-gradient(-11.751deg, rgb(16,34,48) 6%, rgb(20,66,102) 48%, rgb(24,104,158) 102%, rgb(45,138,196) 113%)",
    swatch: "#16242f",
  },
  {
    id: "purple",
    name: "סגול",
    dark: false,
    brand: "#7a5cf0",
    brandHover: "#6a4ce0",
    brandRgb: "122,92,240",
    pageBg: "#f6f4fb",
    blobA: "#7a5cf0",
    blobB: "#d46bd8",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(52,40,102) 6%, rgb(88,62,178) 48%, rgb(122,92,240) 102%, rgb(168,140,250) 113%)",
    swatch: "#7a5cf0",
  },
  {
    id: "teal",
    name: "טורקיז",
    dark: false,
    brand: "#0aa2a2",
    brandHover: "#08908f",
    brandRgb: "10,162,162",
    pageBg: "#f2f8f8",
    blobA: "#0aa2a2",
    blobB: "#69c600",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(22,72,74) 6%, rgb(12,124,124) 48%, rgb(10,162,162) 102%, rgb(80,206,198) 113%)",
    swatch: "#0aa2a2",
  },
  {
    id: "sunset",
    name: "שקיעה",
    dark: false,
    brand: "#e2622c",
    brandHover: "#cc5623",
    brandRgb: "226,98,44",
    pageBg: "#fcf6f2",
    blobA: "#e2622c",
    blobB: "#f0a92c",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(94,45,28) 6%, rgb(178,74,36) 48%, rgb(226,98,44) 102%, rgb(244,158,86) 113%)",
    swatch: "#e2622c",
  },
  {
    id: "rose",
    name: "ורוד",
    dark: false,
    brand: "#d63b73",
    brandHover: "#c02f64",
    brandRgb: "214,59,115",
    pageBg: "#fcf3f7",
    blobA: "#d63b73",
    blobB: "#8d5cf0",
    blobOpacity: 1,
    navGradient:
      "linear-gradient(-11.751deg, rgb(92,32,58) 6%, rgb(166,44,88) 48%, rgb(214,59,115) 102%, rgb(240,124,166) 113%)",
    swatch: "#d63b73",
  },
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

/** גרדיאנט הרקע של העמוד - כתמים מטושטשים בצבעי הערכה */
function heroGradientSvg(
  theme: Theme,
  blueOffsetX: number,
  blobScale: number,
  blobOpacityScale: number,
) {
  const o = blobOpacityScale * theme.blobOpacity;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <defs>
    <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <linearGradient id="line-fade-bottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${theme.dark ? 0.03 : 0.35}" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="line-fade-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${theme.dark ? 0.018 : 0.18}" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <g filter="url(#blob-blur)">
    <ellipse cx="380" cy="530" rx="${250 * blobScale}" ry="${200 * blobScale}" fill="${theme.blobA}" opacity="${0.16 * o}" />
    <ellipse cx="${1180 + blueOffsetX}" cy="340" rx="${340 * blobScale}" ry="${270 * blobScale}" fill="${theme.blobA}" opacity="${0.18 * o}" />
    <ellipse cx="600" cy="750" rx="${150 * blobScale}" ry="${120 * blobScale}" fill="${theme.blobB}" opacity="${0.2 * o}" />
  </g>
  <g stroke-width="140" fill="none">
    <circle cx="130" cy="520" r="260" stroke="url(#line-fade-bottom)" />
    <circle cx="${1260 + blueOffsetX}" cy="380" r="260" stroke="url(#line-fade-top)" />
  </g>
</svg>`.trim();
}

export function heroGradientBg(
  theme: Theme,
  blueOffsetX: number,
  blobScale: number,
  blobOpacityScale: number,
) {
  return `url("data:image/svg+xml,${encodeURIComponent(
    heroGradientSvg(theme, blueOffsetX, blobScale, blobOpacityScale),
  )}")`;
}

/** משתני ה-CSS שהערכה מזריקה לשורש */
export function themeVars(theme: Theme): React.CSSProperties {
  return {
    "--brand": theme.brand,
    "--brand-hover": theme.brandHover,
    "--brand-rgb": theme.brandRgb,
  } as React.CSSProperties;
}
