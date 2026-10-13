<script setup lang="ts">
import { Sparkles } from "lucide-vue-next";
import { BRAND_GRADIENT } from "../styles";

/** הסמל של העוזר החכם - עיגול בגרדיאנט המותג עם ניצוצות */
withDefaults(defineProps<{ size?: number }>(), { size: 40 });
</script>

<template>
  <span
    class="rounded-full flex items-center justify-center shrink-0 text-white shadow-[0_6px_18px_-6px_rgba(0,143,240,0.6)]"
    :style="{ width: `${size}px`, height: `${size}px`, background: BRAND_GRADIENT }"
  >
    <Sparkles :size="size * 0.48" />
  </span>
</template>
