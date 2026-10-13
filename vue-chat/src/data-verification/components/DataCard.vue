<script setup lang="ts">
import { Check } from "lucide-vue-next";
import IconCircle from "../ui/IconCircle.vue";
import { ICONS } from "../icons";
import { GLASS_PANEL } from "../styles";
import type { Card } from "../script";

/** כרטיס נתונים בתוך הצ'אט - שדה חסר מסומן "חסר", שדה שעודכן מסומן "עודכן" */
defineProps<{ card: Extract<Card, { kind: "data" }> }>();
</script>

<template>
  <div :class="['mt-3 rounded-[14px] p-3.5 sm:p-4', GLASS_PANEL]">
    <div class="flex items-center gap-2 mb-2.5">
      <IconCircle :size="28">
        <component :is="ICONS[card.icon]" :size="14" />
      </IconCircle>
      <span class="font-bold text-[#171c23] text-[14px]">{{ card.title }}</span>
    </div>
    <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
      <div v-for="row in card.rows" :key="row.label" class="min-w-0">
        <dt class="text-[12px] text-[#171c23] opacity-55">{{ row.label }}</dt>
        <dd class="text-[14px] font-semibold text-[#171c23] flex items-center gap-1.5 flex-wrap">
          <span v-if="row.value" class="break-words min-w-0">{{ row.value }}</span>
          <span v-else-if="row.optional" class="font-normal opacity-40">—</span>
          <span
            v-else
            class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(224,112,0,0.1)] text-[#e07000]"
          >
            חסר
          </span>
          <span
            v-if="row.changed"
            class="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(105,198,0,0.12)] text-[#4e9400]"
          >
            <Check :size="11" />
            עודכן
          </span>
        </dd>
      </div>
    </dl>
  </div>
</template>
