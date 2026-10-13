<script setup lang="ts">
import { FileCheck } from "lucide-vue-next";
import RichText from "./RichText.vue";
import DataCard from "./DataCard.vue";
import SummaryCard from "./SummaryCard.vue";
import type { Msg } from "../script";

/**
 * הודעה בשיחה. רק התשובות של המשתמש בבועה (כחולה, הפינה הקטנה בימין למטה);
 * העוזר כותב ישירות על המסך, ושאלה שיש לה כרטיס מוצגת אחריו.
 */
defineProps<{ msg: Msg }>();
</script>

<template>
  <div
    v-if="msg.role === 'user'"
    class="self-start max-w-[80%] animate-[chat-rise_.26s_ease-out_both]"
  >
    <div
      class="bg-[#008ff0] text-white rounded-[20px] rounded-es-[6px] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
    >
      <img
        v-if="msg.image"
        :src="msg.image"
        alt="החתימה שלך"
        class="w-[220px] max-w-full h-auto bg-white rounded-[10px]"
      />
      <span v-else-if="msg.file" class="flex items-center gap-2">
        <FileCheck :size="16" class="shrink-0" />
        {{ msg.file }}
      </span>
      <template v-else>{{ msg.text }}</template>
    </div>
  </div>

  <div v-else class="w-full animate-[chat-rise_.26s_ease-out_both]">
    <div class="px-1 text-[16px] text-[#171c23] leading-relaxed">
      <RichText v-if="msg.text" :text="msg.text" />
      <DataCard v-if="msg.card?.kind === 'data'" :card="msg.card" />
      <SummaryCard v-else-if="msg.card?.kind === 'summary'" :card="msg.card" />
      <p v-if="msg.ask" :class="msg.card ? 'mt-3' : 'mt-1'">
        <RichText :text="msg.ask" />
      </p>
    </div>
  </div>
</template>
