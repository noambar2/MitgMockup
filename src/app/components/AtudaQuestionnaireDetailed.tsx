import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Check,
  GraduationCap,
  Info,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  IconCircle,
  FIELD_CLASS,
} from "./primitives";
import {
  ALL_TRACKS,
  CLUSTERS,
  Choice,
  DECLARATIONS,
  INSTITUTIONS,
  MAX_INSTITUTIONS,
  MAX_TRACKS,
  MIN_TRACKS,
  Track,
} from "./atudaData";


// ── Shared bits ─────────────────────────────────────────────────────────────

function ValidationMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 text-[#c43c3c] text-[13px] font-semibold text-right"
    >
      <Info size={14} className="shrink-0 mt-0.5" />
      {children}
    </p>
  );
}

function StepHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-right">
        {title}
        <span className="text-[#69c600]">.</span>
      </h3>
      {children}
    </div>
  );
}

// ── Step 1: tracks + institutions ───────────────────────────────────────────

/** כרטיס מוסד לימודים - לחיצה מוסיפה אותו לתיעדוף */
function InstitutionButton({
  name,
  rank,
  disabled,
  onClick,
}: {
  name: string;
  rank: number | null;
  /** נבחרו כבר מקסימום מוסדות והמוסד הזה אינו אחד מהם */
  disabled: boolean;
  onClick: () => void;
}) {
  const selected = rank !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={selected ? "לחיצה נוספת תסיר את המוסד מהבחירה" : undefined}
      className={`flex items-center justify-between gap-2 rounded-[10px] border px-4 py-3 text-right transition-colors ${
        selected
          ? "border-[#008ff0] bg-[rgba(0,143,240,0.06)]"
          : disabled
            ? "border-[rgba(23,28,35,0.1)] bg-white opacity-40 cursor-not-allowed"
            : "border-[rgba(23,28,35,0.12)] bg-white hover:border-[rgba(0,143,240,0.35)]"
      }`}
    >
      <span
        className={`text-[14px] min-w-0 ${selected ? "font-semibold text-[#171c23]" : "text-[#171c23]"}`}
      >
        {name}
      </span>
      {selected && (
        <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
          {rank}
        </span>
      )}
    </button>
  );
}

function TrackPanel({
  track,
  draft,
  added,
  tracksFull,
  error,
  onToggleInstitution,
  onReset,
  onAdd,
  onRemove,
  onClose,
}: {
  track: Track;
  draft: string[];
  added: boolean;
  /** נבחרו כבר מקסימום מגמות ולכן אי אפשר להוסיף עוד */
  tracksFull: boolean;
  error: string | null;
  onToggleInstitution: (name: string) => void;
  onReset: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const institutionsFull = draft.length >= MAX_INSTITUTIONS;
  return (
    <div className="bg-white rounded-[10px] border border-[rgba(0,143,240,0.25)] flex flex-col">
      {/* כותרת המגמה + האשכול שלה */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col items-start min-w-0">
          <h4 className="font-bold text-[#171c23] text-[18px] text-right">
            {track.name}
          </h4>
          <span className="text-[#171c23] text-[13px] opacity-50">
            {track.cluster}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-50 hover:opacity-100 shrink-0 -mt-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* מידע על המגמה - הכותרת קבועה, התוכן משתנה */}
      <div className="px-5 pt-4 flex flex-col gap-1.5">
        <span className="text-[#171c23] text-[13px] opacity-50">
          על המגמה
        </span>
        <p className="text-[#171c23] text-[14px] leading-relaxed text-right">
          {track.about}
        </p>
      </div>

      {/* בחירת מוסדות לפי העדפה */}
      <div className="px-5 pt-5 flex flex-col gap-3">
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
              {draft.length === 0
                ? `באפשרותך לבחור עד ${MAX_INSTITUTIONS} מוסדות לימוד`
                : `נבחרו ${draft.length} מתוך ${MAX_INSTITUTIONS} מוסדות לימוד`}
            </span>
            {draft.length > 0 && (
              <Button variant="link" onClick={onReset}>
                <RotateCcw size={13} className="shrink-0" />
                איפוס בחירה
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INSTITUTIONS.map((name) => (
            <InstitutionButton
              key={name}
              name={name}
              rank={
                draft.indexOf(name) >= 0
                  ? draft.indexOf(name) + 1
                  : null
              }
              disabled={
                institutionsFull && !draft.includes(name)
              }
              onClick={() => onToggleInstitution(name)}
            />
          ))}
        </div>

        {institutionsFull && (
          <p className="text-[#171c23] text-[13px] opacity-60 text-right">
            בחרת את מלוא {MAX_INSTITUTIONS} המוסדות. כדי להחליף
            מוסד יש ללחוץ שוב על אחד מהמוסדות שנבחרו.
          </p>
        )}
      </div>

      {/* הוספה / הסרה של המגמה */}
      <div className="px-5 py-5 mt-4 border-t border-[rgba(23,28,35,0.06)] flex flex-col gap-2">
        {error && <ValidationMessage>{error}</ValidationMessage>}
        {added ? (
          <Button variant="outline" onClick={onRemove}>
            <Trash2 size={15} className="shrink-0" />
            הסר מגמה
          </Button>
        ) : (
          <>
            <Button onClick={onAdd} disabled={tracksFull}>
              הוסף מגמה
            </Button>
            {tracksFull && (
              <p className="text-[#171c23] text-[13px] opacity-60 text-right">
                בחרת את מלוא {MAX_TRACKS} המגמות. כדי להוסיף
                מגמה זו יש להסיר קודם אחת מהמגמות שבחרת.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** רצועה דביקה שמציגה תמיד את המגמות שנבחרו עד כה, עם המוסדות שלהן */
function SelectedTray({
  items,
  onRemove,
  onOpen,
}: {
  items: { track: Track; institutions: string[] }[];
  onRemove: (trackId: string) => void;
  onOpen: (trackId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[#171c23] text-[13px] font-semibold text-right">
        המגמות שבחרת ({items.length}/{MAX_TRACKS})
      </span>
      {items.length === 0 ? (
        <p className="text-[#171c23] text-[13px] opacity-50 text-right">
          עדיין לא נבחרו מגמות. פתחו מגמה מהרשימה, בחרו מוסדות
          לימוד ולחצו "הוסף מגמה".
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {items.map(({ track, institutions }, i) => (
            <div
              key={track.id}
              className="shrink-0 max-w-[240px] bg-[rgba(0,143,240,0.06)] border border-[rgba(0,143,240,0.25)] rounded-[10px] ps-2 pe-3 py-2 flex items-center gap-2"
            >
              <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onOpen(track.id)}
                className="flex flex-col items-start min-w-0 text-right"
              >
                <span className="font-semibold text-[#171c23] text-[13px] truncate max-w-full">
                  {track.name}
                </span>
                <span className="text-[#171c23] text-[12px] opacity-55 truncate max-w-full">
                  {institutions.join(" · ")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(track.id)}
                aria-label={`הסרת ${track.name}`}
                className="w-6 h-6 flex items-center justify-center rounded-full text-[#171c23] opacity-45 hover:opacity-100 hover:text-[#c43c3c] shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type Step = "intro" | 1 | 2 | 3 | "success";

const STEP_LABELS = [
  "בחירת מגמות",
  "דירוג ההעדפות",
  "סיכום ושליחה",
];

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const index = i + 1;
          const done = index < current;
          const active = index === current;
          return (
            <div
              key={label}
              className="flex-1 flex flex-col gap-1.5 min-w-0"
            >
              <div
                className={`h-[6px] rounded-full transition-colors ${
                  done || active
                    ? "bg-[#008ff0]"
                    : "bg-[rgba(23,28,35,0.08)]"
                }`}
              />
              <span
                className={`text-[12px] text-right truncate ${
                  active
                    ? "text-[#008ff0] font-semibold"
                    : "text-[#171c23] opacity-50"
                }`}
              >
                {index}. {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AtudaQuestionnaireDetailed({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");

  // ── שלב 1 ──
  const [openTrackId, setOpenTrackId] = useState<string | null>(
    null,
  );
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [choices, setChoices] = useState<Choice[]>([]);
  const [query, setQuery] = useState("");
  const [openClusters, setOpenClusters] = useState<string[]>([
    CLUSTERS[0].name,
  ]);
  const [panelError, setPanelError] = useState<string | null>(null);

  // ── שלב 3 ──
  const [agreed, setAgreed] = useState<boolean[]>(
    DECLARATIONS.map(() => false),
  );
  const [summaryError, setSummaryError] = useState<string | null>(
    null,
  );

  const openTrack = ALL_TRACKS.find((t) => t.id === openTrackId);
  const chosenIds = choices.map((c) => c.trackId);
  const searching = query.trim() !== "";

  /** סינון לפי חיפוש - autocomplete על שם המגמה */
  const visibleClusters = useMemo(() => {
    if (!searching) return CLUSTERS;
    const q = query.trim();
    return CLUSTERS.map((c) => ({
      ...c,
      tracks: c.tracks.filter((t) => t.name.includes(q)),
    })).filter((c) => c.tracks.length > 0);
  }, [query, searching]);

  const noResults = searching && visibleClusters.length === 0;

  const trackDraft = (id: string) => draft[id] ?? [];

  /** לחיצה על מוסד מוסיפה אותו לסוף התיעדוף, ולחיצה חוזרת מסירה אותו והמספור מתעדכן */
  const toggleInstitution = (trackId: string, name: string) => {
    setPanelError(null);
    const current = trackDraft(trackId);
    if (current.includes(name)) {
      setDraft((prev) => ({
        ...prev,
        [trackId]: current.filter((n) => n !== name),
      }));
      return;
    }
    if (current.length >= MAX_INSTITUTIONS) return; // הכפתורים ממילא מעומעמים
    setDraft((prev) => ({
      ...prev,
      [trackId]: [...current, name],
    }));
  };

  const addTrack = (track: Track) => {
    const institutions = trackDraft(track.id);
    if (institutions.length === 0) {
      setPanelError(
        "כדי להוסיף מגמה עליך לבחור לפחות מוסד לימודים אחד בו תרצה ללמוד",
      );
      return;
    }
    if (choices.length >= MAX_TRACKS) return; // הכפתור ממילא מושבת
    setPanelError(null);
    setChoices((prev) => [
      ...prev,
      { trackId: track.id, institutions },
    ]);
  };

  const removeTrack = (trackId: string) => {
    setChoices((prev) => prev.filter((c) => c.trackId !== trackId));
    setPanelError(null);
  };

  /** אפשר להמשיך רק אחרי שנבחרו לפחות שתי מגמות */
  const canContinue = choices.length >= MIN_TRACKS;

  const goToStep2 = () => {
    setOpenTrackId(null);
    setStep(2);
  };

  /** הזזת מגמה בדירוג - למעלה או למטה ברשימה */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= choices.length) return;
    setChoices((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const allAgreed = agreed.every(Boolean);

  const submit = () => {
    if (!allAgreed) {
      setSummaryError(
        "כדי לשלוח את השאלון יש לאשר את כל ההצהרות",
      );
      return;
    }
    setSummaryError(null);
    setStep("success");
  };

  const trackById = (id: string) =>
    ALL_TRACKS.find((t) => t.id === id)!;

  const showProgress = step === 1 || step === 2 || step === 3;

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">

      {/* סרגל התקדמות - מוצג רק בתוך שלבי השאלון */}
      {showProgress && (
        <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
          <div className="max-w-[760px] mx-auto">
            <ProgressSteps current={step as number} />
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[760px] mx-auto py-6">
        {/* ── מסך מקדים ── */}
        {step === "intro" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <IconCircle size={72} bg="rgba(0,143,240,0.1)">
                <GraduationCap size={34} />
              </IconCircle>
              <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
                ישראלה, ברוכה הבאה לשאלון העתודה
                <span className="text-[#69c600]">.</span>
              </h3>
            </div>

            {/* משפט בכל פסקה - קל יותר לקריאה ממקטע טקסט אחד ארוך */}
            <div className="flex flex-col gap-3 text-[#171c23] text-[16px] leading-relaxed text-right">
              <p>
                מטרת השאלון היא הבעת רצון להצטרף לתהליך המיון
                לעתודה ולבחירת תחום הלימוד ומוסד אקדמי בו תרצו
                להשתלב.
              </p>
              <p>
                עליכם לדרג עד ארבעה תחומי לימוד המעניינים אתכם,
                ובכל תחום לימוד לדרג עד שלושה מוסדות לימוד
                אקדמיים בהם הנכם מעוניינים ללמוד.
              </p>
              <p>
                בעדיפות הראשונה יש לציין את התחום בו תרצו להשתלב
                בעדיפות הגבוהה ביותר וכן הלאה.
              </p>
            </div>

            <a
              href="https://www.mitgaisim.idf.il"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[#008ff0] text-[14px] font-semibold hover:underline self-start"
            >
              למד עוד על מסלול העתודה האקדמית
              <ChevronLeft size={15} className="shrink-0" />
            </a>

            <div className="bg-[#f5f5f7] rounded-[10px] p-5 flex flex-col gap-3">
              <span className="font-semibold text-[#171c23] text-[15px]">
                שלבי השאלון
              </span>
              <ol className="flex flex-col gap-2.5">
                {STEP_LABELS.map((label, i) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 text-[#171c23] text-[14px]"
                  >
                    <span className="w-7 h-7 rounded-full bg-white text-[#008ff0] font-bold text-[13px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ── שלב 1: בחירת מגמות ומוסדות ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="בחירת המגמות ומוסדות הלימוד">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-right opacity-70">
                כדי לעבור לשלב הבא עליך לבחור מגמות, באפשרותך
                לבחור עד {MAX_TRACKS} מגמות.
              </p>
              {!canContinue && (
                <span className="text-[#171c23] text-[13px] opacity-60 text-right">
                  כדי להמשיך לשלב הבא יש לבחור לפחות {MIN_TRACKS}{" "}
                  מגמות.
                </span>
              )}
            </StepHeading>

            {/* חיפוש מגמה */}
            <div className="flex flex-col gap-2">
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
              {noResults && (
                <p className="text-[#171c23] text-[13px] opacity-60 text-right">
                  לא נמצאו תוצאות חיפוש עבור "{query.trim()}"
                </p>
              )}
            </div>

            {/* רשימת האשכולות והמגמות */}
            <div className="flex flex-col gap-3">
              {visibleClusters.map((cluster) => {
                const open =
                  searching ||
                  openClusters.includes(cluster.name);
                return (
                  <div
                    key={cluster.name}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] overflow-hidden"
                  >
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
                      className="w-full h-[52px] px-4 flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-[#171c23] text-[15px]">
                        {cluster.name}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-[#171c23] opacity-60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      />
                    </button>

                    {open && (
                      <div className="border-t border-[rgba(23,28,35,0.06)] flex flex-col">
                        {cluster.tracks.map((t) => {
                          const track = { ...t, cluster: cluster.name };
                          const chosen = chosenIds.includes(track.id);
                          const isOpen = openTrackId === track.id;
                          return (
                            <div key={track.id}>
                              <div
                                className={`flex items-center justify-between gap-2 px-4 h-[46px] ${isOpen ? "bg-[rgba(0,143,240,0.06)]" : ""}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPanelError(null);
                                    setOpenTrackId(
                                      isOpen ? null : track.id,
                                    );
                                  }}
                                  className="flex items-center gap-2 min-w-0 flex-1 text-right"
                                >
                                  {chosen && (
                                    <Check
                                      size={15}
                                      className="text-[#4e9400] shrink-0"
                                    />
                                  )}
                                  <span
                                    className={`text-[14px] truncate ${chosen ? "font-semibold text-[#171c23]" : "text-[#171c23]"}`}
                                  >
                                    {track.name}
                                  </span>
                                </button>
                                {chosen && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeTrack(track.id)
                                    }
                                    aria-label={`הסרת ${track.name}`}
                                    className="w-7 h-7 flex items-center justify-center text-[#c43c3c] opacity-70 hover:opacity-100 shrink-0"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>

                              {isOpen && (
                                <div className="px-3 pb-3">
                                  <TrackPanel
                                    track={track}
                                    draft={trackDraft(track.id)}
                                    added={chosen}
                                    tracksFull={
                                      choices.length >= MAX_TRACKS
                                    }
                                    error={panelError}
                                    onToggleInstitution={(name) =>
                                      toggleInstitution(
                                        track.id,
                                        name,
                                      )
                                    }
                                    onReset={() => {
                                      setDraft((prev) => ({
                                        ...prev,
                                        [track.id]: [],
                                      }));
                                      setPanelError(null);
                                    }}
                                    onAdd={() => addTrack(track)}
                                    onRemove={() =>
                                      removeTrack(track.id)
                                    }
                                    onClose={() =>
                                      setOpenTrackId(null)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── שלב 2: תיעדוף המגמות ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="דרג את המגמות לפי העדפותיך">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-right opacity-70">
                מתוך כל {choices.length} המגמות שבחרת, באפשרותך
                לתעדף את רמת הרצון שלך מאותה מגמה. לאחר הסיום -
                לחץ על המשך.
              </p>
            </StepHeading>

            <ol className="flex flex-col gap-3">
              {choices.map((choice, i) => {
                const track = trackById(choice.trackId);
                return (
                  <li
                    key={choice.trackId}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-4 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#008ff0] text-white font-bold text-[15px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-semibold text-[#171c23] text-[15px]">
                        {track.name}
                      </span>
                      <span className="text-[#171c23] text-[13px] opacity-50 truncate max-w-full">
                        {choice.institutions.join(" · ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
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
                        disabled={i === choices.length - 1}
                        aria-label="הורדה בדירוג"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="text-[#171c23] text-[13px] opacity-50 text-right">
              1 = המגמה שאותה תרצה/י הכי הרבה, והמספר האחרון =
              הכי פחות.
            </p>
          </div>
        )}

        {/* ── שלב 3: סיכום ושליחה ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="סיכום ושליחה">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-right opacity-70">
                לפניך ריכוז הבחירות שלך לפי סדר העדפה. מומלץ
                לעבור עליהן פעם אחרונה - לאחר השליחה לא ניתן
                יהיה לשנות את הבחירות בשאלון זה.
              </p>
            </StepHeading>

            <div className="flex flex-col gap-3">
              {choices.map((choice, i) => {
                const track = trackById(choice.trackId);
                return (
                  <div
                    key={choice.trackId}
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
                      {choice.institutions.map((name, j) => (
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

            {/* הצהרות */}
            <div className="bg-[#f5f5f7] rounded-[10px] p-5 flex flex-col gap-3">
              <span className="font-semibold text-[#171c23] text-[15px] text-right">
                הצהרות
              </span>
              {DECLARATIONS.map((text, i) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setAgreed((prev) =>
                      prev.map((v, j) => (j === i ? !v : v)),
                    );
                    setSummaryError(null);
                  }}
                  aria-pressed={agreed[i]}
                  className="flex items-start gap-3 text-right"
                >
                  <span
                    className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      agreed[i]
                        ? "bg-[#008ff0] border-[#008ff0]"
                        : "bg-white border-[rgba(23,28,35,0.25)]"
                    }`}
                  >
                    {agreed[i] && (
                      <Check size={13} className="text-white" />
                    )}
                  </span>
                  <span className="text-[#171c23] text-[14px] leading-relaxed">
                    {text}
                  </span>
                </button>
              ))}
            </div>

            {summaryError && (
              <ValidationMessage>{summaryError}</ValidationMessage>
            )}
          </div>
        )}

        {/* ── מסך אישור שליחה ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <IconCircle
              size={72}
              bg="rgba(105,198,0,0.12)"
              color="#69c600"
            >
              <Check size={34} />
            </IconCircle>
            <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
              העדפותיך נשלחו בהצלחה
              <span className="text-[#69c600]">.</span>
            </h3>
            <p className="text-[#171c23] text-[15px] opacity-60 max-w-[380px] leading-relaxed">
              הבחירות שלך נשמרו ויועברו לגורמי המיון של מערך
              העתודה. עדכון על המשך התהליך יישלח אליך להודעות
              באזור האישי.
            </p>
          </div>
        )}
      </div>

      {/* סרגל הניווט התחתון */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        {/* מגירת המגמות שנבחרו - נשארת גלויה לאורך כל שלב 1 */}
        {step === 1 && (
          <div className="max-w-[760px] mx-auto pb-3 mb-3 border-b border-[rgba(23,28,35,0.08)]">
            <SelectedTray
              items={choices.map((c) => ({
                track: trackById(c.trackId),
                institutions: c.institutions,
              }))}
              onRemove={removeTrack}
              onOpen={(id) => {
                setPanelError(null);
                setOpenTrackId(id);
                setOpenClusters((prev) => {
                  const cluster = trackById(id).cluster!;
                  return prev.includes(cluster)
                    ? prev
                    : [...prev, cluster];
                });
              }}
            />
          </div>
        )}
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          {step === "intro" && (
            <>
              <Button variant="outline" onClick={onExit}>
                חזרה למשימות
              </Button>
              <Button onClick={() => setStep(1)}>
                בואו נתחיל
              </Button>
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
              <Button onClick={goToStep2} disabled={!canContinue}>
                סיימתי, לשלב הבא
                <ChevronLeft size={16} className="shrink-0" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                חזרה
              </Button>
              <Button onClick={() => setStep(3)}>
                המשך לסיכום
                <ChevronLeft size={16} className="shrink-0" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
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
