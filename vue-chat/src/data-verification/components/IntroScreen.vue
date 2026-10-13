<script setup lang="ts">
import {
  CheckCheck,
  ChevronLeft,
  Clock,
  Eye,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-vue-next";
import BotMark from "./BotMark.vue";
import BaseButton from "../ui/BaseButton.vue";
import IconCircle from "../ui/IconCircle.vue";
import { ICONS } from "../icons";
import { SECTIONS } from "../script";

/** מסך הכניסה למשימה - "חדש", הסבר קצר ומה נעבור. בדסקטופ גם הדגמה של השיחה */
defineProps<{ firstName: string }>();
const emit = defineEmits<{ start: []; exit: [] }>();

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
</script>

<template>
  <div class="flex flex-col flex-1 bg-white overflow-y-auto">
    <!-- פירורי לחם: חזרה לרשימת המשימות -->
    <nav class="flex items-center gap-1.5 text-[14px] px-4 sm:px-6 md:px-10 pt-6">
      <button
        type="button"
        class="text-[#008ff0] font-semibold hover:underline underline-offset-4"
        @click="emit('exit')"
      >
        משימות
      </button>
      <ChevronLeft :size="14" class="text-[#171c23] opacity-40 shrink-0" />
      <span class="text-[#171c23] opacity-70">אימות נתונים</span>
    </nav>

    <section class="px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      <div
        class="flex-1 w-full max-w-[960px] mx-auto py-8 md:py-12 grid md:grid-cols-[1fr_340px] gap-10 items-center"
      >
        <div class="flex flex-col gap-6">
          <div class="flex flex-col items-start gap-4">
            <span
              class="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full bg-[rgba(105,198,0,0.14)] text-[#4e9400]"
            >
              <Sparkles :size="13" />
              חדש באתר מתגייסים
            </span>
            <div class="flex items-center gap-3">
              <BotMark :size="48" />
              <h3
                class="font-bold text-[#122736] text-[26px] sm:text-[30px] tracking-tight leading-tight"
              >
                אימות נתונים בצ׳אט<span class="text-[#69c600]">.</span>
              </h3>
            </div>
            <p class="text-[#171c23] text-[16px] leading-relaxed text-right">
              היי {{ firstName }}! במקום למלא טופס ארוך ביום הגיוס, אפשר לאמת
              את הפרטים כבר עכשיו - בשיחה קצרה עם העוזר החכם. כשתגיע/י ללשכת
              הגיוס, תחנת אימות הנתונים כבר תהיה מאחוריך.
            </p>
          </div>

          <ol class="flex flex-col gap-3">
            <li v-for="item in HOW_IT_WORKS" :key="item.title" class="flex items-start gap-3">
              <IconCircle :size="36">
                <component :is="item.icon" :size="17" />
              </IconCircle>
              <span class="flex flex-col text-right">
                <span class="font-semibold text-[#171c23] text-[15px]">{{ item.title }}</span>
                <span class="text-[#171c23] text-[13px] opacity-60 leading-snug">{{ item.text }}</span>
              </span>
            </li>
          </ol>

          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-semibold text-[#171c23] opacity-60">על מה נעבור</span>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="section in SECTIONS"
                :key="section.label"
                class="flex items-center gap-1.5 text-[13px] font-semibold text-[#171c23] bg-[#f5f5f7] rounded-full px-3 py-1.5"
              >
                <component :is="ICONS[section.icon]" :size="14" class="text-[#008ff0]" />
                {{ section.label }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            <BaseButton class="!px-6 !py-2.5 !text-[15px]" @click="emit('start')">
              <MessageCircle :size="16" class="shrink-0" />
              בואו נתחיל
            </BaseButton>
            <span class="flex items-center gap-1.5 text-[13px] text-[#171c23] opacity-60">
              <Clock :size="14" class="shrink-0" />
              כ-5 דקות · אפשר לעצור ולהמשיך אחר כך
            </span>
          </div>

          <span class="flex items-center gap-1.5 text-[12px] text-[#171c23] opacity-50">
            <ShieldCheck :size="13" class="shrink-0" />
            הפרטים נשמרים בצורה מאובטחת ומשמשים את מערך הגיוס בלבד.
          </span>
        </div>

        <!-- הדגמה קטנה של השיחה - בדסקטופ בלבד -->
        <div class="hidden md:block">
          <div class="rounded-[20px] bg-[#f5f5f7] p-4 flex flex-col gap-2.5 text-[13px] select-none">
            <div class="px-1 text-[#171c23] leading-relaxed">
              אני רואה שהכתובת העיקרית שלך היא
              <strong class="text-[#122736]">רחוב כלנית 32, באר שבע</strong>. האם זה נכון?
            </div>
            <div class="self-start bg-[#008ff0] text-white rounded-[16px] rounded-es-[6px] px-3.5 py-2">
              לא, עברנו דירה
            </div>
            <div class="px-1 text-[#171c23] leading-relaxed">
              אין בעיה, נעדכן יחד. באיזה יישוב את/ה גר/ה היום?
            </div>
            <div class="flex gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-40" />
              <span class="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-60" />
              <span class="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
