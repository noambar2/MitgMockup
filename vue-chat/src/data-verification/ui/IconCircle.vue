<script setup lang="ts">
withDefaults(
  defineProps<{ size?: number; bg?: string; color?: string }>(),
  { size: 40, bg: "rgba(0,143,240,0.1)", color: "#008ff0" },
);
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center shrink-0"
    :style="{ width: `${size}px`, height: `${size}px`, backgroundColor: bg, color }"
  >
    <slot />
  </div>
</template>
