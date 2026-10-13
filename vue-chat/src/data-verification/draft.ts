import type { Data, Msg, StepId } from "./script";

/**
 * טיוטת השיחה - יציאה וחזרה ממשיכות מאותה נקודה.
 * כאן זה בזיכרון בלבד (מתאפס ברענון). במערכת האמיתית אפשר לשמור את
 * האובייקט הזה ב-sessionStorage או בשרת - כל השדות בו הם JSON פשוט.
 */
export interface Draft {
  started: boolean;
  msgs: Msg[];
  step: StepId;
  data: Data | null;
}

export const draft: Draft = { started: false, msgs: [], step: "addr", data: null };

export function resetDraft() {
  draft.started = false;
  draft.msgs = [];
  draft.step = "addr";
  draft.data = null;
}
