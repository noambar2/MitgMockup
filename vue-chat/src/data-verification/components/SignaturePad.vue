<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Signature } from "lucide-vue-next";
import BaseButton from "../ui/BaseButton.vue";
import { GLASS_CARD } from "../styles";

/** חתימה באצבע / בעכבר. מחזיר תמונת PNG כ-data URL */
const emit = defineEmits<{ sign: [dataUrl: string] }>();

const canvas = ref<HTMLCanvasElement>();
const drawing = ref(false);
const empty = ref(true);

// הקנבס בגודל הפיקסלים האמיתי, כדי שהקו יהיה חד גם במסך רטינה
onMounted(() => {
  const c = canvas.value!;
  const ratio = window.devicePixelRatio || 1;
  c.width = c.offsetWidth * ratio;
  c.height = c.offsetHeight * ratio;
  const ctx = c.getContext("2d")!;
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#122736";
});

const point = (e: PointerEvent) => {
  const rect = canvas.value!.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top] as const;
};

function down(e: PointerEvent) {
  drawing.value = true;
  canvas.value!.setPointerCapture(e.pointerId);
  const ctx = canvas.value!.getContext("2d")!;
  ctx.beginPath();
  ctx.moveTo(...point(e));
}

function move(e: PointerEvent) {
  if (!drawing.value) return;
  const ctx = canvas.value!.getContext("2d")!;
  ctx.lineTo(...point(e));
  ctx.stroke();
  empty.value = false;
}

function clear() {
  const c = canvas.value!;
  c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  empty.value = true;
}
</script>

<template>
  <div :class="['rounded-[20px] p-3 flex flex-col gap-2.5', GLASS_CARD]">
    <div class="flex items-center justify-between">
      <span class="text-[13px] font-semibold text-[#171c23]">
        חתימה <span class="text-[#c43c3c]">*</span>
      </span>
      <BaseButton variant="link" :disabled="empty" @click="clear">ניקוי חתימה</BaseButton>
    </div>
    <canvas
      ref="canvas"
      aria-label="אזור חתימה"
      class="w-full h-[120px] rounded-[12px] bg-white touch-none cursor-crosshair"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="drawing = false"
      @pointerleave="drawing = false"
    />
    <BaseButton class="self-end" :disabled="empty" @click="emit('sign', canvas!.toDataURL('image/png'))">
      <Signature :size="15" class="shrink-0" />
      חתימה ושליחה
    </BaseButton>
  </div>
</template>
