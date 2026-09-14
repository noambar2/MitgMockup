import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button, SelectField } from "./primitives";
import {
  ALL_TRACKS,
  DECLARATIONS,
  INSTITUTIONS,
  MAX_INSTITUTIONS,
  MAX_TRACKS,
  MIN_TRACKS,
} from "./atudaData";
import {
  DeclarationsBlock,
  IntroScreen,
  ProgressSteps,
  StepHeading,
  SuccessScreen,
  ValidationMessage,
} from "./atudaShared";

/**
 * גרסה מפושטת של שאלון העתודה: במקום פאנלים ובחירה בלחיצות,
 * כל עדיפות היא שורה אחת עם דרופדאונים - מגמה ושלושת מוסדות הלימוד.
 * סדר השורות הוא סדר התיעדוף, ולכן אין שלב דירוג נפרד.
 */

type Step = "intro" | 1 | 2 | "success";

const STEP_LABELS = ["מילוי ההעדפות", "סיכום ושליחה"];

interface Row {
  key: number;
  trackName: string | null;
  institutions: (string | null)[];
}

const emptyRow = (key: number): Row => ({
  key,
  trackName: null,
  institutions: [null, null, null],
});

/** שדה דרופדאון עם אפשרות ניקוי - SelectField עצמו לא יודע לנקות בחירה */
function ClearableSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#171c23] text-[13px] opacity-60">
          {label}
        </span>
        {value && (
          <Button variant="link" onClick={onClear}>
            <X size={13} className="shrink-0" />
            ניקוי
          </Button>
        )}
      </div>
      <SelectField
        value={value}
        placeholder={placeholder}
        options={options}
        onChange={onChange}
      />
    </div>
  );
}

export default function AtudaQuestionnaireSimple({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [rows, setRows] = useState<Row[]>([
    emptyRow(1),
    emptyRow(2),
  ]);
  const [nextKey, setNextKey] = useState(3);
  const [agreed, setAgreed] = useState<boolean[]>(
    DECLARATIONS.map(() => false),
  );
  const [summaryError, setSummaryError] = useState<string | null>(
    null,
  );

  const trackByName = (name: string) =>
    ALL_TRACKS.find((t) => t.name === name);

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const setInstitution = (
    key: number,
    index: number,
    value: string | null,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              institutions: r.institutions.map((v, i) =>
                i === index ? value : v,
              ),
            }
          : r,
      ),
    );
  };

  const addRow = () => {
    if (rows.length >= MAX_TRACKS) return;
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  };

  const removeRow = (key: number) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  /** השורות המלאות בלבד - מגמה ולפחות מוסד אחד */
  const filledRows = rows.filter(
    (r) => r.trackName && r.institutions.some(Boolean),
  );

  /** שורות שנבחרה בהן מגמה אך לא נבחר אף מוסד לימודים */
  const partialRows = rows.filter(
    (r) => r.trackName && !r.institutions.some(Boolean),
  );

  /** אפשר להמשיך רק כששתי העדפות מלאות, ואין מגמה ללא מוסד */
  const canContinue =
    filledRows.length >= MIN_TRACKS && partialRows.length === 0;

  const allAgreed = agreed.every(Boolean);

  const submit = () => {
    if (!allAgreed) {
      setSummaryError("כדי לשלוח את השאלון יש לאשר את כל ההצהרות");
      return;
    }
    setSummaryError(null);
    setStep("success");
  };

  const showProgress = step === 1 || step === 2;

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      {showProgress && (
        <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
          <div className="max-w-[760px] mx-auto">
            <ProgressSteps
              labels={STEP_LABELS}
              current={step as number}
            />
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[760px] mx-auto py-6">
        {/* ── מסך מקדים ── */}
        {step === "intro" && <IntroScreen />}

        {/* ── שלב 1: שורות העדפה ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="מילוי ההעדפות">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-right opacity-70">
                כל שורה היא עדיפות אחת: בוחרים מגמה ואת מוסדות
                הלימוד המועדפים עליכם באותה מגמה. סדר השורות הוא
                סדר התיעדוף - ניתן להזיז שורה למעלה או למטה בעזרת
                החיצים.
              </p>
              {!canContinue && (
                <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                  {partialRows.length > 0
                    ? "בכל מגמה שבחרת יש לבחור לפחות מוסד לימודים אחד כדי להמשיך."
                    : `כדי להמשיך לסיכום יש למלא לפחות ${MIN_TRACKS} העדפות - מגמה ולפחות מוסד לימודים אחד בכל אחת.`}
                </span>
              )}
            </StepHeading>

            <div className="flex flex-col gap-4">
              {rows.map((row, i) => {
                const track = row.trackName
                  ? trackByName(row.trackName)
                  : undefined;
                const usedTracks = rows
                  .filter((r) => r.key !== row.key)
                  .map((r) => r.trackName)
                  .filter(Boolean) as string[];
                const trackOptions = ALL_TRACKS.filter(
                  (t) => !usedTracks.includes(t.name),
                ).map((t) => t.name);

                return (
                  <div
                    key={row.key}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-4 sm:p-5 flex flex-col gap-4"
                  >
                    {/* כותרת השורה: מספר העדפה, חיצי הזזה והסרה */}
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#008ff0] text-white font-bold text-[15px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-[#171c23] text-[15px] flex-1 text-right">
                        עדיפות {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="העלאה בדירוג"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1}
                        aria-label="הורדה בדירוג"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        aria-label={`הסרת עדיפות ${i + 1}`}
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#c43c3c] disabled:opacity-30 hover:border-[rgba(196,60,60,0.4)]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* בחירת המגמה */}
                    <ClearableSelect
                      label="מגמה"
                      value={row.trackName}
                      placeholder="בחירת מגמה"
                      options={trackOptions}
                      onChange={(v) =>
                        updateRow(row.key, { trackName: v })
                      }
                      onClear={() =>
                        updateRow(row.key, {
                          trackName: null,
                          institutions: [null, null, null],
                        })
                      }
                    />

                    {track && (
                      <>
                        {/* מידע קצר על המגמה - נפתח רק כשרוצים */}
                        <details className="bg-[#f5f5f7] rounded-[10px] px-4 py-3">
                          <summary className="cursor-pointer text-[#171c23] text-[13px] font-semibold text-right marker:content-['']">
                            <span className="flex items-center justify-between gap-2">
                              על המגמה ({track.cluster})
                              <ChevronDown
                                size={15}
                                className="opacity-60 shrink-0"
                              />
                            </span>
                          </summary>
                          <p className="text-[#171c23] text-[13px] leading-relaxed text-right mt-2">
                            {track.about}
                          </p>
                        </details>

                        {/* שלושת מוסדות הלימוד לפי עדיפות */}
                        <div className="flex flex-col gap-3">
                          <span className="font-semibold text-[#171c23] text-[14px] text-right">
                            מוסדות הלימוד לפי העדפה
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Array.from({
                              length: MAX_INSTITUTIONS,
                            }).map((_, j) => {
                              const used = row.institutions.filter(
                                (v, k) => k !== j && v,
                              ) as string[];
                              return (
                                <ClearableSelect
                                  key={j}
                                  label={`עדיפות ${j + 1}${j === 0 ? "" : " (רשות)"}`}
                                  value={row.institutions[j]}
                                  placeholder="בחירת מוסד"
                                  options={INSTITUTIONS.filter(
                                    (n) => !used.includes(n),
                                  )}
                                  onChange={(v) =>
                                    setInstitution(row.key, j, v)
                                  }
                                  onClear={() =>
                                    setInstitution(row.key, j, null)
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={addRow}
                disabled={rows.length >= MAX_TRACKS}
              >
                <Plus size={15} className="shrink-0" />
                הוספת עדיפות
              </Button>
              <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                {rows.length >= MAX_TRACKS
                  ? `בחרת את מלוא ${MAX_TRACKS} העדיפויות`
                  : `נוספו ${rows.length} מתוך ${MAX_TRACKS} עדיפויות`}
              </span>
            </div>
          </div>
        )}

        {/* ── שלב 2: סיכום ושליחה ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="סיכום ושליחה">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-right opacity-70">
                לפניך ריכוז הבחירות שלך לפי סדר העדפה. מומלץ
                לעבור עליהן פעם אחרונה - לאחר השליחה לא ניתן יהיה
                לשנות את הבחירות בשאלון זה.
              </p>
            </StepHeading>

            {/* תצוגת טבלה - מגמה מול מוסדות הלימוד שנבחרו לה */}
            <div className="rounded-[10px] border border-[rgba(23,28,35,0.1)] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[48px_1fr_1.2fr] bg-[#f5f5f7] text-[#171c23] text-[13px] font-semibold">
                <span className="px-3 py-2.5">#</span>
                <span className="px-3 py-2.5">מגמה</span>
                <span className="px-3 py-2.5">
                  מוסדות הלימוד לפי העדפה
                </span>
              </div>
              {filledRows.map((row, i) => {
                const track = trackByName(row.trackName!)!;
                const institutions = row.institutions.filter(
                  Boolean,
                ) as string[];
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-1 sm:grid-cols-[48px_1fr_1.2fr] border-t border-[rgba(23,28,35,0.08)]"
                  >
                    <div className="px-3 pt-3 sm:py-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="sm:hidden font-semibold text-[#171c23] text-[14px]">
                        {track.name}
                      </span>
                    </div>
                    <div className="hidden sm:flex px-3 py-3 flex-col items-start">
                      <span className="font-semibold text-[#171c23] text-[14px]">
                        {track.name}
                      </span>
                      <span className="text-[#171c23] text-[12px] opacity-50">
                        {track.cluster}
                      </span>
                    </div>
                    <ol className="px-3 pb-3 pt-2 sm:py-3 flex flex-col gap-1.5">
                      {institutions.map((name, j) => (
                        <li
                          key={name}
                          className="flex items-center gap-2 text-[#171c23] text-[13px]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[rgba(0,143,240,0.12)] text-[#008ff0] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {j + 1}
                          </span>
                          {name}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>

            <DeclarationsBlock
              agreed={agreed}
              onToggle={(i) => {
                setAgreed((prev) =>
                  prev.map((v, j) => (j === i ? !v : v)),
                );
                setSummaryError(null);
              }}
            />

            {summaryError && (
              <ValidationMessage>{summaryError}</ValidationMessage>
            )}
          </div>
        )}

        {/* ── מסך אישור שליחה ── */}
        {step === "success" && <SuccessScreen />}
      </div>

      {/* סרגל הניווט התחתון */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          {step === "intro" && (
            <>
              <Button variant="outline" onClick={onExit}>
                חזרה למשימות
              </Button>
              <Button onClick={() => setStep(1)}>בואו נתחיל</Button>
            </>
          )}

          {step === 1 && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("intro")}
              >
                חזרה
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canContinue}
              >
                המשך לסיכום
                <ChevronLeft size={16} className="shrink-0" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                חזרה
              </Button>
              <Button onClick={submit} disabled={!allAgreed}>
                <Send size={15} className="shrink-0" />
                שליחה
              </Button>
            </>
          )}

          {step === "success" && (
            <div className="w-full flex justify-center">
              <Button onClick={onGoHome}>לעמוד הבית</Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
