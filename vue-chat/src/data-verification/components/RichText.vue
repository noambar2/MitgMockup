<script setup lang="ts">
import { computed } from "vue";

/** טקסט הודעה: **מודגש** ושבירת שורה - בלי v-html, כדי שלא תוזרק תגית */
const props = defineProps<{ text: string }>();

const lines = computed(() =>
  props.text.split("\n").map((line) =>
    line
      .split(/(\*\*[^*]+\*\*)/g)
      .filter(Boolean)
      .map((part) =>
        part.startsWith("**") && part.endsWith("**")
          ? { bold: true, text: part.slice(2, -2) }
          : { bold: false, text: part },
      ),
  ),
);
</script>

<template>
  <template v-for="(line, i) in lines" :key="i">
    <br v-if="i > 0" />
    <template v-for="(part, j) in line" :key="j">
      <strong v-if="part.bold" class="font-bold text-[#122736]">{{ part.text }}</strong>
      <template v-else>{{ part.text }}</template>
    </template>
  </template>
</template>
