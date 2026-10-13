<script setup lang="ts">
import { ref } from "vue";
import IntroScreen from "./components/IntroScreen.vue";
import ChatView from "./components/ChatView.vue";
import { draft, resetDraft } from "./draft";
import {
  DEMO_DATA,
  initialState,
  toRecruitData,
  type Data,
  type RecruitData,
} from "./script";

/**
 * משימת "אימות נתונים" - מסך כניסה ואז הצ'אט.
 *
 * הקומפוננטה ממלאת את הגובה של האלמנט שעוטף אותה (h-full), כך שהמארח
 * קובע את הגובה - בדרך כלל גובה המסך פחות הכותרת של האתר.
 */
const props = withDefaults(
  defineProps<{
    /** הנתונים הרשומים על המלש"ב - לטעון מהשרת. ברירת מחדל: נתוני הדגמה */
    recruit?: RecruitData;
  }>(),
  { recruit: () => DEMO_DATA },
);

const emit = defineEmits<{
  /** יציאה מהמשימה (פירורי הלחם או "יציאה") - לחזור לרשימת המשימות */
  exit: [];
  /** "לעמוד הבית" במסך הסיום */
  goHome: [];
  /**
   * המלש"ב חתם - הנתונים המאומתים והחתימה (PNG כ-data URL).
   * כאן שולחים לשרת ומסמנים את המשימה כ"בוצע".
   */
  complete: [data: RecruitData, signature: string];
}>();

// מי שכבר התחיל שיחה חוזר ישר אליה
const started = ref(draft.started);
const initial: Data = initialState(props.recruit);

function finish(goHome: boolean) {
  resetDraft();
  if (goHome) emit("goHome");
  else emit("exit");
}
</script>

<template>
  <div class="h-full min-h-0 flex flex-col" dir="rtl" lang="he">
    <ChatView
      v-if="started"
      :initial="initial"
      @exit="emit('exit')"
      @complete="(d, sig) => emit('complete', toRecruitData(d), sig)"
      @done="finish"
    />
    <IntroScreen
      v-else
      :first-name="recruit.firstName"
      @start="started = true"
      @exit="emit('exit')"
    />
  </div>
</template>
