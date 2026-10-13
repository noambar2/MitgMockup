<script setup lang="ts">
import { ref } from "vue";
import { ChevronLeft, Sparkles } from "lucide-vue-next";
import { DataVerificationChat, type RecruitData } from "./data-verification";

/**
 * דף הדגמה בלבד - מדמה את המעטפת של אתר מתגייסים (כותרת + רקע) סביב
 * הצ'אט. באתר האמיתי משתמשים רק ב-<DataVerificationChat>.
 */
const page = ref<"tasks" | "chat">("chat");

function onComplete(data: RecruitData, signature: string) {
  // כאן שולחים לשרת
  console.info("[data-verification] complete", data, `${signature.length} chars`);
}

/** הגרדיאנט של רקע האתר (ערכת "בהיר"), בלי הטבעות והכתם התחתון - כמו בעמוד הצ'אט */
const BACKGROUND = `url("data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter></defs>
  <g filter="url(#b)">
    <ellipse cx="380" cy="530" rx="350" ry="280" fill="#008ff0" opacity="0.112"/>
    <ellipse cx="1180" cy="340" rx="476" ry="378" fill="#008ff0" opacity="0.126"/>
  </g>
</svg>`)}")`;
</script>

<template>
  <div
    class="min-h-[100dvh] flex flex-col"
    dir="rtl"
    :style="{
      backgroundColor: '#f5f5f7',
      backgroundImage: BACKGROUND,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }"
  >
    <!-- כותרת האתר (מדומה): 64px במובייל, 98px בדסקטופ -->
    <header class="sticky top-0 z-50 shrink-0">
      <div class="hidden md:flex h-[42px] bg-[#122736] items-center px-10 text-white text-[15px] font-bold">
        מיטב
      </div>
      <div
        class="h-[64px] md:h-[56px] flex items-center px-4 md:px-10 text-white text-[14px] font-semibold"
        style="background: linear-gradient(-11.751deg, rgb(36,83,119) 6%, rgb(19,131,208) 48%, rgb(0,143,240) 102%, rgb(93,184,245) 113%)"
      >
        אתר מתגייסים · הדגמת Vue
      </div>
    </header>

    <!-- הצ'אט ממלא את גובה המסך פחות הכותרת -->
    <main v-if="page === 'chat'" class="h-[calc(100dvh-64px)] md:h-[calc(100dvh-98px)]">
      <DataVerificationChat
        @exit="page = 'tasks'"
        @go-home="page = 'tasks'"
        @complete="onComplete"
      />
    </main>

    <!-- במקום עמוד המשימות האמיתי - כרטיס אחד שפותח את הצ'אט שוב -->
    <main v-else class="p-4 sm:p-10">
      <button
        type="button"
        class="bg-white rounded-[10px] p-5 flex flex-col gap-2 text-right w-full max-w-[360px] hover:shadow-[0_0_20px_0_rgba(0,143,240,0.25)] transition-shadow"
        @click="page = 'chat'"
      >
        <span class="flex items-center justify-between">
          <span class="bg-[rgba(0,143,240,0.1)] w-10 h-10 rounded-full flex items-center justify-center text-[#008ff0]">
            <Sparkles :size="18" />
          </span>
          <span class="text-[12px] font-bold px-2.5 py-1 rounded-full bg-[rgba(105,198,0,0.14)] text-[#4e9400]">חדש</span>
        </span>
        <span class="font-bold text-[#171c23] text-[18px]">אימות נתונים</span>
        <span class="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold">
          מעבר לצ׳אט <ChevronLeft :size="16" />
        </span>
      </button>
    </main>
  </div>
</template>
