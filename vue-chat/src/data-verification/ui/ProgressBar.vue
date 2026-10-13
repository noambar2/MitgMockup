<script setup lang="ts">
defineProps<{ value: number }>();
</script>

<template>
  <div
    class="w-full h-1.5 rounded-full bg-[rgba(23,28,35,0.08)] overflow-hidden"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-full bg-[#008ff0] transition-[width] duration-700 ease-out"
      :style="{ width: `${value}%` }"
    />
  </div>
</template>
