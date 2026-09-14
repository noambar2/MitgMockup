import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button, ELEVATION } from "./primitives";
import { useIsMobile } from "./ui/use-mobile";
import {
  ALL_TRACKS,
  CLUSTERS,
  DECLARATIONS,
  INSTITUTIONS,
  MAX_INSTITUTIONS,
  MAX_TRACKS,
  MIN_TRACKS,
  Track,
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
 * גרסה שלישית: רשימת עדיפויות קצרה בעמוד, וכל הבחירה - מגמה, ההסבר
 * עליה ומוסדות הלימוד - מתבצעת בפאנל צדדי בדסקטופ ובבוטום שיט במובייל.
 */

type Step = "intro" | 1 | 2 | "success";

const STEP_LABELS = ["בחירת ההעדפות", "סיכום ושליחה"];

interface Slot {
  key: number;
  trackId: string | null;
  institutions: string[];
}

const emptySlot = (key: number): Slot => ({
  key,
  trackId: null,
  institutions: [],
});

// ── הפאנל: צד בדסקטופ, בוטום שיט במובייל ──────────────────────────────────

function SidePanel({
  title,
  subtitle,
  onBack,
  onClose,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  /** חץ חזרה בכותרת - מוצג רק כשיש לאן לחזור בתוך הפאנל */
  onBack?: () => void;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const body = (
    <div className="flex flex-col flex-1 min-h-0" dir="rtl">
      <div className="flex items-start gap-2 px-5 py-4 border-b border-[rgba(23,28,35,0.08)] shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="חזרה לרשימת המגמות"
            className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-60 hover:opacity-100 shrink-0 -mr-1"
          >
            <ChevronRight size={20} />
          </button>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-[#171c23] text-[18px] text-right">
            {title}
          </span>
          {subtitle && (
            <span className="text-[#171c23] text-[13px] opacity-60 mt-0.5 text-right">
              {subtitle}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="סגירה"
          className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-60 hover:opacity-100 shrink-0 -mt-1"
        >
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">{children}</div>

      {footer && (
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-[rgba(23,28,35,0.08)] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[400]" dir="rtl">
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={close}
      />
      {isMobile ? (
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out flex flex-col h-[88vh]"
          style={{
            transform: visible
              ? "translateY(0)"
              : "translateY(100%)",
          }}
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-[rgba(23,28,35,0.15)]" />
          </div>
          {body}
        </div>
      ) : (
        <div
          className="absolute top-0 bottom-0 right-0 w-[460px] max-w-[92vw] bg-white flex flex-col transition-transform duration-300 ease-out"
          style={{
            transform: visible
              ? "translateX(0)"
              : "translateX(100%)",
            boxShadow: ELEVATION.overlay,
          }}
        >
          {body}
        </div>
      )}
    </div>,
    document.querySelector("[data-app-root]") ?? document.body,
  );
}

// ── תוכן הפאנל ─────────────────────────────────────────────────────────────

function TrackList({
  takenIds,
  onPick,
}: {
  takenIds: string[];
  onPick: (track: Track) => void;
}) {
  const [query, setQuery] = useState("");
  const [openClusters, setOpenClusters] = useState<string[]>([
    CLUSTERS[0].name,
  ]);
  const searching = query.trim() !== "";

  const visibleClusters = useMemo(() => {
    if (!searching) return CLUSTERS;
    const q = query.trim();
    return CLUSTERS.map((c) => ({
      ...c,
      tracks: c.tracks.filter((t) => t.name.includes(q)),
    })).filter((c) => c.tracks.length > 0);
  }, [query, searching]);

  return (
    <div className="flex flex-col">
      <div className="px-5 py-4 sticky top-0 bg-white z-10 border-b border-[rgba(23,28,35,0.06)]">
        <div className="bg-white border border-[rgba(23,28,35,0.12)] rounded-full h-10 px-4 flex items-center gap-2">
          <Search
            size={15}
            className="text-[#171c23] opacity-40 shrink-0"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מגמה"
            className="flex-1 bg-transparent outline-none text-[14px] text-[#171c23] placeholder:opacity-40"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="ניקוי חיפוש"
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[rgba(23,28,35,0.08)] text-[#171c23] opacity-60 hover:opacity-100 shrink-0"
            >
              <X size={12} />
            </button>
          )}
        </div>
        {searching && visibleClusters.length === 0 && (
          <p className="text-[#171c23] text-[13px] opacity-60 text-right mt-2">
            לא נמצאו תוצאות חיפוש עבור "{query.trim()}"
          </p>
        )}
      </div>

      <div className="flex flex-col">
        {visibleClusters.map((cluster) => {
          const open =
            searching || openClusters.includes(cluster.name);
          return (
            <div key={cluster.name}>
              <button
                type="button"
                onClick={() =>
                  setOpenClusters((prev) =>
                    prev.includes(cluster.name)
                      ? prev.filter((c) => c !== cluster.name)
                      : [...prev, cluster.name],
                  )
                }
                aria-expanded={open}
                className="w-full h-[48px] px-5 flex items-center justify-between gap-2 bg-[#f5f5f7]"
              >
                <span className="font-semibold text-[#171c23] text-[14px]">
                  {cluster.name}
                </span>
                <ChevronDown
                  size={17}
                  className={`text-[#171c23] opacity-60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open &&
                cluster.tracks.map((t) => {
                  const track = { ...t, cluster: cluster.name };
                  const taken = takenIds.includes(track.id);
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => onPick(track)}
                      disabled={taken}
                      className="w-full px-5 h-[50px] flex items-center justify-between gap-2 border-b border-[rgba(23,28,35,0.06)] text-right disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgba(0,143,240,0.04)]"
                    >
                      <span className="text-[#171c23] text-[14px] truncate">
                        {track.name}
                      </span>
                      {taken ? (
                        <span className="text-[#171c23] text-[12px] opacity-60 shrink-0">
                          כבר נבחרה
                        </span>
                      ) : (
                        <ChevronLeft
                          size={16}
                          className="text-[#171c23] opacity-35 shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackDetails({
  track,
  picked,
  onToggle,
  onReset,
}: {
  track: Track;
  picked: string[];
  onToggle: (name: string) => void;
  onReset: () => void;
}) {
  const full = picked.length >= MAX_INSTITUTIONS;
  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-[#171c23] text-[13px] opacity-50">
          על המגמה
        </span>
        <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
          {track.about}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[#171c23] text-[15px] text-right">
            בחירת מוסד הלימודים לפי העדפה
          </span>
          <p className="text-[#171c23] text-[13px] opacity-60 text-right leading-relaxed">
            סדר הלחיצה הינו סדר התיעדוף. לחיצה נוספת על מוסד
            שנבחר תסיר אותו, והמספור יתעדכן אוטומטית.
          </p>
          <div className="flex items-center justify-between gap-3 mt-1">
            <span className="text-[#171c23] text-[13px] font-semibold">
              {picked.length === 0
                ? `באפשרותך לבחור עד ${MAX_INSTITUTIONS} מוסדות לימוד`
                : `נבחרו ${picked.length} מתוך ${MAX_INSTITUTIONS} מוסדות לימוד`}
            </span>
            {picked.length > 0 && (
              <Button variant="link" onClick={onReset}>
                איפוס בחירה
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {INSTITUTIONS.map((name) => {
            const rank = picked.indexOf(name);
            const selected = rank >= 0;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggle(name)}
                disabled={full && !selected}
                aria-pressed={selected}
                className={`flex items-center justify-between gap-2 rounded-[10px] border px-4 py-3 text-right transition-colors ${
                  selected
                    ? "border-[#008ff0] bg-[rgba(0,143,240,0.06)]"
                    : full
                      ? "border-[rgba(23,28,35,0.1)] bg-white opacity-40 cursor-not-allowed"
                      : "border-[rgba(23,28,35,0.12)] bg-white hover:border-[rgba(0,143,240,0.35)]"
                }`}
              >
                <span
                  className={`text-[14px] min-w-0 ${selected ? "font-semibold" : ""} text-[#171c23]`}
                >
                  {name}
                </span>
                {selected && (
                  <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                    {rank + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {full && (
          <p className="text-[#171c23] text-[13px] opacity-60 text-right">
            בחרת את מלוא {MAX_INSTITUTIONS} המוסדות. כדי להחליף
            מוסד יש ללחוץ שוב על אחד מהמוסדות שנבחרו.
          </p>
        )}
      </div>
    </div>
  );
}

// ── העמוד ──────────────────────────────────────────────────────────────────

export default function AtudaQuestionnaireSheet({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [slots, setSlots] = useState<Slot[]>([
    emptySlot(1),
    emptySlot(2),
  ]);
  const [nextKey, setNextKey] = useState(3);

  // ── מצב הפאנל ──
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [panelTrack, setPanelTrack] = useState<Track | null>(null);
  const [panelPicked, setPanelPicked] = useState<string[]>([]);

  const [agreed, setAgreed] = useState<boolean[]>(
    DECLARATIONS.map(() => false),
  );
  const [summaryError, setSummaryError] = useState<string | null>(
    null,
  );

  const trackById = (id: string) =>
    ALL_TRACKS.find((t) => t.id === id)!;

  const openPanel = (slot: Slot) => {
    setEditingKey(slot.key);
    setPanelTrack(slot.trackId ? trackById(slot.trackId) : null);
    setPanelPicked(slot.institutions);
  };

  const closePanel = () => {
    setEditingKey(null);
    setPanelTrack(null);
    setPanelPicked([]);
  };

  const togglePanelInstitution = (name: string) => {
    setPanelPicked((prev) => {
      if (prev.includes(name))
        return prev.filter((n) => n !== name);
      if (prev.length >= MAX_INSTITUTIONS) return prev;
      return [...prev, name];
    });
  };

  const savePanel = () => {
    if (!panelTrack || panelPicked.length === 0) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.key === editingKey
          ? {
              ...s,
              trackId: panelTrack.id,
              institutions: panelPicked,
            }
          : s,
      ),
    );
    closePanel();
  };

  const addSlot = () => {
    if (slots.length >= MAX_TRACKS) return;
    setSlots((prev) => [...prev, emptySlot(nextKey)]);
    setNextKey((k) => k + 1);
  };

  const removeSlot = (key: number) => {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  };

  const clearSlot = (key: number) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, trackId: null, institutions: [] }
          : s,
      ),
    );
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= slots.length) return;
    setSlots((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const filledSlots = slots.filter((s) => s.trackId);
  const takenIds = slots
    .filter((s) => s.key !== editingKey && s.trackId)
    .map((s) => s.trackId!) as string[];

  /** אפשר להמשיך רק כששתי העדפות מלאות - מגמה ולפחות מוסד אחד */
  const canContinue = filledSlots.length >= MIN_TRACKS;

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
        {step === "intro" && <IntroScreen />}

        {/* ── שלב 1: רשימת העדיפויות ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="בחירת ההעדפות">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-right opacity-70">
                לכל עדיפות בוחרים מגמה ואת מוסדות הלימוד
                המועדפים עליכם בה. סדר העדיפויות ניתן לשינוי
                בעזרת החיצים.
              </p>
              {!canContinue && (
                <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                  כדי להמשיך לסיכום יש למלא לפחות {MIN_TRACKS}{" "}
                  העדפות - מגמה ולפחות מוסד לימודים אחד בכל אחת.
                </span>
              )}
            </StepHeading>

            <div className="flex flex-col gap-3">
              {slots.map((slot, i) => {
                const track = slot.trackId
                  ? trackById(slot.trackId)
                  : null;
                return (
                  <div
                    key={slot.key}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-4 flex flex-col gap-3"
                  >
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
                        disabled={i === slots.length - 1}
                        aria-label="הורדה בדירוג"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.key)}
                        disabled={slots.length <= 1}
                        aria-label={`הסרת עדיפות ${i + 1}`}
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#c43c3c] disabled:opacity-30 hover:border-[rgba(196,60,60,0.4)]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {track ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col items-start min-w-0">
                            <span className="font-bold text-[#171c23] text-[16px]">
                              {track.name}
                            </span>
                            <span className="text-[#171c23] text-[13px] opacity-50">
                              {track.cluster}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="link"
                              onClick={() => openPanel(slot)}
                            >
                              <Pencil
                                size={13}
                                className="shrink-0"
                              />
                              עריכה
                            </Button>
                            <Button
                              variant="linkDanger"
                              onClick={() => clearSlot(slot.key)}
                            >
                              ניקוי
                            </Button>
                          </div>
                        </div>
                        <ol className="flex flex-wrap gap-2">
                          {slot.institutions.map((name, j) => (
                            <li
                              key={name}
                              className="flex items-center gap-2 rounded-full bg-[rgba(0,143,240,0.06)] border border-[rgba(0,143,240,0.2)] ps-1.5 pe-3 py-1"
                            >
                              <span className="w-5 h-5 rounded-full bg-[#008ff0] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                {j + 1}
                              </span>
                              <span className="text-[#171c23] text-[13px]">
                                {name}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openPanel(slot)}
                        className="w-full rounded-[10px] border border-dashed border-[rgba(0,143,240,0.4)] bg-[rgba(0,143,240,0.03)] py-4 flex items-center justify-center gap-2 text-[#008ff0] text-[14px] font-semibold hover:bg-[rgba(0,143,240,0.07)]"
                      >
                        <Plus size={16} className="shrink-0" />
                        בחירת מגמה ומוסדות לימוד
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={addSlot}
                disabled={slots.length >= MAX_TRACKS}
              >
                <Plus size={15} className="shrink-0" />
                הוספת עדיפות
              </Button>
              <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                {slots.length >= MAX_TRACKS
                  ? `בחרת את מלוא ${MAX_TRACKS} העדיפויות`
                  : `נוספו ${slots.length} מתוך ${MAX_TRACKS} עדיפויות`}
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

            <div className="flex flex-col gap-3">
              {filledSlots.map((slot, i) => {
                const track = trackById(slot.trackId!);
                return (
                  <div
                    key={slot.key}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#008ff0] text-white font-bold text-[15px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-bold text-[#171c23] text-[16px]">
                          {track.name}
                        </span>
                        <span className="text-[#171c23] text-[13px] opacity-50">
                          {track.cluster}
                        </span>
                      </div>
                    </div>
                    <ol className="flex flex-col gap-2 ps-11">
                      {slot.institutions.map((name, j) => (
                        <li
                          key={name}
                          className="flex items-center gap-2.5 text-[#171c23] text-[14px]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[rgba(0,143,240,0.12)] text-[#008ff0] text-[12px] font-bold flex items-center justify-center shrink-0">
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

      {/* פאנל בחירת המגמה והמוסדות */}
      {editingKey !== null && (
        <SidePanel
          title={panelTrack ? panelTrack.name : "בחירת מגמה"}
          subtitle={
            panelTrack
              ? panelTrack.cluster
              : "בחרו את המגמה שתופיע בעדיפות זו"
          }
          onBack={
            panelTrack
              ? () => {
                  setPanelTrack(null);
                  setPanelPicked([]);
                }
              : undefined
          }
          onClose={closePanel}
          footer={
            panelTrack ? (
              <>
                <Button variant="outline" onClick={closePanel}>
                  ביטול
                </Button>
                <Button
                  onClick={savePanel}
                  disabled={panelPicked.length === 0}
                >
                  שמירת הבחירה
                </Button>
              </>
            ) : undefined
          }
        >
          {panelTrack ? (
            <TrackDetails
              track={panelTrack}
              picked={panelPicked}
              onToggle={togglePanelInstitution}
              onReset={() => setPanelPicked([])}
            />
          ) : (
            <TrackList
              takenIds={takenIds}
              onPick={(track) => {
                setPanelTrack(track);
                setPanelPicked([]);
              }}
            />
          )}
        </SidePanel>
      )}
    </section>
  );
}
