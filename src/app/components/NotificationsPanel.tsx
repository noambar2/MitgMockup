import {
  MessageCircle,
  ClipboardList,
  CalendarPlus,
  CalendarClock,
  Clock,
  ChevronLeft,
  CheckCheck,
} from "lucide-react";

// ── Data ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "inquiry"
  | "task"
  | "newAppointment"
  | "reminder";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  timeAgo: string;
  actionLabel: string;
  /** העמוד אליו מנווט הכפתור (אם קיים עמוד כזה) */
  targetPage?: "tasks" | "appointments";
}

export const notifications: AppNotification[] = [
  {
    id: "inquiry-reply",
    type: "inquiry",
    title: "התקבלה תשובה לפנייתך",
    timeAgo: "לפני שעה",
    actionLabel: "לצפייה בפנייה",
  },
  {
    id: "new-task-documents",
    type: "task",
    title: "משימה חדשה - השלמת מסמכים",
    timeAgo: "לפני 3 שעות",
    actionLabel: "מעבר לעמוד המשימות",
    targetPage: "tasks",
  },
  {
    id: "new-appointment",
    type: "newAppointment",
    title: "זימון חדש - בדיקות רפואיות משלימות",
    timeAgo: "אתמול",
    actionLabel: "לצפייה בזימון",
    targetPage: "appointments",
  },
  {
    id: "reminder-tzav",
    type: "reminder",
    title: "תזכורת: זימון מתקרב - צו ראשון ב-09.08",
    timeAgo: "לפני יומיים",
    actionLabel: "לפרטי הזימון",
    targetPage: "appointments",
  },
];

// אייקון וצבע לפי סוג ההתראה
const TYPE_STYLE: Record<
  NotificationType,
  { Icon: typeof MessageCircle; bg: string; color: string }
> = {
  inquiry: {
    Icon: MessageCircle,
    bg: "rgba(0,143,240,0.1)",
    color: "#008ff0",
  },
  task: {
    Icon: ClipboardList,
    bg: "rgba(0,143,240,0.1)",
    color: "#008ff0",
  },
  newAppointment: {
    Icon: CalendarPlus,
    bg: "rgba(105,198,0,0.12)",
    color: "#4e9400",
  },
  reminder: {
    Icon: CalendarClock,
    bg: "rgba(224,112,0,0.1)",
    color: "#e07000",
  },
};

// ── Panel ───────────────────────────────────────────────────────────────────

export default function NotificationsPanel({
  readIds,
  onMarkAllRead,
  onAction,
  onViewAll,
}: {
  readIds: Set<string>;
  onMarkAllRead: () => void;
  onAction: (notification: AppNotification) => void;
  onViewAll?: () => void;
}) {
  const unreadCount = notifications.filter(
    (n) => !readIds.has(n.id),
  ).length;

  return (
    <div
      dir="rtl"
      className="bg-white rounded-[14px] overflow-hidden"
      style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.18)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(23,28,35,0.08)]">
        <h3 className="font-bold text-[#171c23] text-[17px]">
          התראות
        </h3>
        <button
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold disabled:opacity-40 hover:underline"
        >
          <CheckCheck size={14} className="shrink-0" />
          סימון הכל כנקרא
        </button>
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto">
        {notifications.map((notification) => {
          const { Icon, bg, color } =
            TYPE_STYLE[notification.type];
          const unread = !readIds.has(notification.id);
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 px-5 py-4 border-b border-[rgba(23,28,35,0.05)] last:border-0 ${
                unread ? "bg-[rgba(0,143,240,0.04)]" : ""
              }`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: bg }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1">
                {/* שורה ראשונה: כותרת מימין, זמן ונקודת "לא נקרא" משמאל */}
                <div className="flex items-center justify-between gap-3 w-full">
                  <p
                    className={`text-[#171c23] text-[14px] text-right leading-snug min-w-0 ${
                      unread ? "font-bold" : "font-semibold opacity-80"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 text-[#171c23] text-[12px] opacity-50 whitespace-nowrap">
                      <Clock size={11} className="shrink-0" />
                      {notification.timeAgo}
                    </span>
                    {unread && (
                      <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0" />
                    )}
                  </span>
                </div>
                <button
                  onClick={() => onAction(notification)}
                  className="group flex items-center gap-0.5 text-[#008ff0] text-[13px] font-semibold hover:underline"
                >
                  {notification.actionLabel}
                  <ChevronLeft
                    size={14}
                    className="transition-transform duration-200 group-hover:-translate-x-0.5"
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* קישור לעמוד ההודעות המלא */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-3 text-[#008ff0] text-[14px] font-semibold border-t border-[rgba(23,28,35,0.08)] transition-colors hover:bg-[rgba(0,143,240,0.04)]"
        >
          לכל ההודעות
        </button>
      )}
    </div>
  );
}
