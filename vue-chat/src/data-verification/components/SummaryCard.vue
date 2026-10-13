<script setup lang="ts">
import { ICONS } from "../icons";
import { GLASS_PANEL } from "../styles";
import type { Card } from "../script";

defineProps<{ card: Extract<Card, { kind: "summary" }> }>();
</script>

<template>
  <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
    <div
      v-for="block in card.blocks"
      :key="block.title"
      :class="['rounded-[14px] p-3.5 flex flex-col gap-1', GLASS_PANEL]"
    >
      <span class="flex items-center gap-2 font-bold text-[#171c23] text-[14px] mb-1">
        <component :is="ICONS[block.icon]" :size="15" class="text-[#008ff0] shrink-0" />
        {{ block.title }}
      </span>
      <span
        v-for="line in block.lines"
        :key="line"
        class="text-[13px] text-[#171c23] opacity-75 leading-snug"
      >
        {{ line }}
      </span>
    </div>
  </div>
</template>
