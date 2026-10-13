<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

/**
 * חלון - מודאל באמצע המסך בדסקטופ, בוטום-שיט במובייל (מתחת ל-768px).
 * כמו Dialog ב-primitives של האתר.
 */
withDefaults(defineProps<{ title?: string; width?: number }>(), { width: 480 });
const emit = defineEmits<{ close: [] }>();

const visible = ref(false);
const isMobile = ref(window.innerWidth < 768);
const onResize = () => (isMobile.value = window.innerWidth < 768);

onMounted(() => {
  requestAnimationFrame(() => (visible.value = true));
  window.addEventListener("resize", onResize);
});
onUnmounted(() => window.removeEventListener("resize", onResize));

/** סגירה עם האנימציה */
function close() {
  visible.value = false;
  setTimeout(() => emit("close"), 280);
}
defineExpose({ close });
</script>

<template>
  <Teleport to="body">
    <div
      :class="[
        'fixed inset-0 z-[400]',
        !isMobile && 'flex items-center justify-center p-4',
      ]"
      dir="rtl"
    >
      <div
        class="absolute inset-0 bg-black/20 transition-opacity duration-300"
        :style="{ opacity: visible ? 1 : 0 }"
        @click="close"
      />
      <div
        :class="
          isMobile
            ? 'absolute bottom-0 inset-x-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out flex flex-col max-h-[92vh]'
            : 'relative bg-white rounded-[10px] w-full max-h-[85vh] flex flex-col transition-all duration-300 shadow-[0_12px_32px_rgba(0,0,0,0.16)]'
        "
        :style="
          isMobile
            ? { transform: visible ? 'translateY(0)' : 'translateY(100%)' }
            : {
                maxWidth: `${width}px`,
                opacity: visible ? 1 : 0,
                transform: visible
                  ? 'translateY(0) scale(1)'
                  : 'translateY(12px) scale(0.98)',
              }
        "
      >
        <div v-if="isMobile" class="flex justify-center pt-3 pb-1 shrink-0">
          <div class="w-10 h-1 rounded-full bg-[rgba(23,28,35,0.15)]" />
        </div>
        <div
          v-if="title"
          class="px-5 py-4 border-b border-[rgba(23,28,35,0.08)] font-bold text-[#171c23] text-[18px]"
        >
          {{ title }}
        </div>
        <div class="overflow-y-auto flex-1 min-h-0 px-5 py-5">
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(23,28,35,0.08)]"
        >
          <slot name="footer" :close="close" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
