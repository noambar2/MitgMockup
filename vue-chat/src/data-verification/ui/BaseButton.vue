<script setup lang="ts">
/** כפתור בעיצוב המערכת - אותם וריאנטים כמו Button ב-primitives של האתר */
withDefaults(
  defineProps<{ variant?: "primary" | "outline" | "link" }>(),
  { variant: "primary" },
);

const TONES = {
  primary: "bg-[#008ff0] text-white hover:bg-[#0080d6]",
  outline: "border-[#008ff0] text-[#008ff0] hover:bg-[rgba(0,143,240,0.06)]",
  link: "text-[#008ff0] hover:underline",
};
</script>

<template>
  <button
    type="button"
    :class="[
      'flex items-center font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
      variant === 'link'
        ? 'gap-1 text-[13px]'
        : 'gap-1.5 rounded-full px-5 py-1.5 text-[13px] border border-transparent',
      TONES[variant],
    ]"
  >
    <slot />
  </button>
</template>
