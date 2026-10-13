<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { Check, LogOut, Paperclip, Send } from "lucide-vue-next";
import BotMark from "./BotMark.vue";
import ChatMessage from "./ChatMessage.vue";
import TypingIndicator from "./TypingIndicator.vue";
import SignaturePad from "./SignaturePad.vue";
import BaseButton from "../ui/BaseButton.vue";
import BaseDialog from "../ui/BaseDialog.vue";
import IconCircle from "../ui/IconCircle.vue";
import ProgressBar from "../ui/ProgressBar.vue";
import { GLASS, GLASS_CARD } from "../styles";
import { draft } from "../draft";
import {
  FIRST_STEP,
  NO,
  SECTIONS,
  STEPS,
  YES,
  greeting,
  type BotMsg,
  type Data,
  type Msg,
  type StepId,
} from "../script";

/**
 * השיחה עצמה. מריצה את התסריט מ-script.ts: מציגה את הודעות השלב,
 * מקבלת תשובה (צ'יפ / טקסט / קובץ / חתימה) ועוברת לשלב הבא.
 */
const props = defineProps<{ initial: Data }>();
const emit = defineEmits<{
  exit: [];
  /** סיום - הנתונים המאומתים והחתימה (data URL) */
  complete: [data: Data, signature: string];
  done: [goHome: boolean];
}>();

const msgs = ref<Msg[]>(draft.msgs);
const stepId = ref<StepId>(draft.step);
const data = shallowRef<Data>(draft.data ?? props.initial);
const typing = ref(false);
const busy = ref(false);
const text = ref("");
const exitOpen = ref(false);

const streamEl = ref<HTMLDivElement>();
const inputEl = ref<HTMLInputElement>();
const fileEl = ref<HTMLInputElement>();
const composerEl = ref<HTMLDivElement>();

let alive = true;
let nextId = msgs.value.length;

const step = computed(() => STEPS[stepId.value]);
const section = computed(() => Math.min(step.value.section, SECTIONS.length - 1));
const done = computed(() => stepId.value === "done");
const options = computed(() => step.value.options?.(data.value) ?? []);
const placeholder = computed(() =>
  busy.value ? "העוזר כותב…" : (step.value.text?.placeholder ?? "אפשר לבחור תשובה או לכתוב…"),
);

// שמירת הטיוטה בכל שינוי
watch(
  [msgs, stepId, data],
  () => {
    draft.msgs = msgs.value;
    draft.step = stepId.value;
    draft.data = data.value;
  },
  { deep: true },
);

// ── גלילה: השיחה נצמדת לתחתית, אלא אם המשתמש גלל למעלה ──
let pinned = true;
const toBottom = () => {
  const el = streamEl.value;
  if (el && pinned) el.scrollTop = el.scrollHeight;
};
const onScroll = () => {
  const el = streamEl.value!;
  pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
};

let mutations: MutationObserver | undefined;
let resize: ResizeObserver | undefined;

onMounted(() => {
  const el = streamEl.value!;
  mutations = new MutationObserver(toBottom);
  mutations.observe(el, { childList: true, subtree: true });
  // אזור התשובה צף מעל השיחה, אז השיחה מרופדת בגובה שלו
  resize = new ResizeObserver(() => {
    if (composerEl.value)
      el.style.setProperty("--composer-h", `${composerEl.value.offsetHeight}px`);
    toBottom();
  });
  resize.observe(el);
  if (composerEl.value) resize.observe(composerEl.value);
  toBottom();

  // פתיחת השיחה בפעם הראשונה
  if (!draft.started) {
    draft.started = true;
    go(greeting(data.value), FIRST_STEP, data.value);
  }
});

onBeforeUnmount(() => {
  alive = false;
  mutations?.disconnect();
  resize?.disconnect();
});

// הודעה של המשתמש מחזירה לתחתית; שינוי באזור התשובה מצמיד שוב
watch(
  () => msgs.value.length,
  () => {
    pinned = true;
    nextTick(toBottom);
  },
);
watch([busy, stepId, typing], () => nextTick(toBottom), { flush: "post" });

// הפוקוס חוזר לשדה כשהעוזר מסיים לכתוב
watch(busy, (isBusy) => {
  if (!isBusy && step.value.text) nextTick(() => inputEl.value?.focus());
});

// ── מנוע השיחה ──
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const push = (msg: Omit<Msg, "id">) => msgs.value.push({ ...msg, id: nextId++ });

/** העוזר "מקליד" לפני כל הודעה - זמן קצר שגדל עם אורך ההודעה */
async function say(list: BotMsg[]) {
  for (const m of list) {
    if (!alive) return;
    typing.value = true;
    await delay(Math.min(450 + (m.text?.length ?? 0) * 7 + (m.card ? 250 : 0), 1300));
    if (!alive) return;
    typing.value = false;
    push({ role: "bot", ...m });
    await delay(120);
  }
}

async function go(reply: BotMsg[] | undefined, next: StepId, d: Data) {
  busy.value = true;
  if (reply) await say(reply);
  if (!alive) return;
  stepId.value = next;
  await say(STEPS[next].enter(d));
  busy.value = false;
}

/** עונה בתוך אותו שלב (למשל ערך לא תקין) - בלי לשאול שוב */
async function sayOnly(list: BotMsg[]) {
  busy.value = true;
  await say(list);
  busy.value = false;
}

function respond(value: string, label: string, extra?: Partial<Msg>) {
  if (busy.value || done.value) return;
  push({ role: "user", text: label, ...extra });
  text.value = "";
  const result = step.value.answer(value, data.value);
  const d = result.data ?? data.value;
  data.value = d;
  if (result.next === stepId.value) return sayOnly(result.reply ?? []);
  go(result.reply, result.next, d);
}

/** טקסט חופשי - מתאים לאחת התשובות המהירות, או נבדק כערך */
function submitText() {
  const value = text.value.trim();
  if (!value || busy.value) return;

  const byLabel = options.value.find((o) => o.label === value);
  if (byLabel) return respond(byLabel.value, byLabel.label);

  const hasYesNo = options.value.some((o) => o.value === "yes");
  if (hasYesNo && YES.test(value)) return respond("yes", value);
  if (hasYesNo && NO.test(value)) return respond("no", value);

  if (!step.value.text) {
    push({ role: "user", text: value });
    text.value = "";
    return sayOnly([
      { text: "לא בטוח שהבנתי. אפשר לבחור באחת התשובות שמעל שורת ההקלדה." },
    ]);
  }

  const error = step.value.text.validate?.(value);
  if (error) {
    push({ role: "user", text: value });
    text.value = "";
    return sayOnly([{ text: error }]);
  }
  respond(value, value);
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  // במערכת האמיתית: להעלות את הקובץ לשרת, ולשמור מזהה במקום השם
  if (f) respond(f.name, "", { file: f.name });
  input.value = "";
}

function onSign(url: string) {
  emit("complete", data.value, url);
  respond("signed", "", { image: url });
}
</script>

<template>
  <section class="relative flex flex-col h-full min-h-0" dir="rtl">
    <!-- כותרת: שם המשימה, השלב, יציאה ופס התקדמות -->
    <div
      class="bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)] px-4 sm:px-6 md:px-10 py-3 shrink-0"
    >
      <div class="max-w-[760px] mx-auto flex flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <span class="flex items-center gap-2 min-w-0">
            <BotMark :size="30" />
            <span class="flex flex-col leading-tight min-w-0">
              <span class="font-semibold text-[#171c23] text-[14px]">אימות נתונים</span>
              <span class="text-[12px] text-[#171c23] opacity-55 truncate">
                {{
                  done
                    ? "הושלם"
                    : `שלב ${section + 1} מתוך ${SECTIONS.length} · ${SECTIONS[section].label}`
                }}
              </span>
            </span>
          </span>
          <button
            v-if="!done"
            type="button"
            class="flex items-center gap-1.5 text-[#171c23] text-[13px] font-semibold opacity-60 hover:opacity-100 shrink-0"
            @click="exitOpen = true"
          >
            <LogOut :size="14" class="shrink-0" />
            יציאה
          </button>
        </div>
        <ProgressBar :value="done ? 100 : (section / SECTIONS.length) * 100 + 4" />
      </div>
    </div>

    <!-- השיחה -->
    <div
      ref="streamEl"
      class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 pb-[calc(var(--composer-h,140px)+16px)]"
      role="log"
      aria-live="polite"
      @scroll.passive="onScroll"
    >
      <div class="max-w-[760px] mx-auto flex flex-col gap-4">
        <ChatMessage v-for="m in msgs" :key="m.id" :msg="m" />
        <TypingIndicator v-if="typing" />
        <div
          v-if="done && !typing"
          class="flex flex-col items-center gap-3 py-6 text-center animate-[chat-rise_.26s_ease-out_both]"
        >
          <IconCircle :size="64" bg="rgba(105,198,0,0.12)" color="#69c600">
            <Check :size="30" />
          </IconCircle>
          <span class="font-bold text-[#122736] text-[22px] tracking-tight">
            הנתונים אומתו בהצלחה<span class="text-[#69c600]">.</span>
          </span>
          <div class="flex flex-wrap justify-center gap-2">
            <BaseButton variant="outline" @click="emit('done', false)">חזרה למשימות</BaseButton>
            <BaseButton @click="emit('done', true)">לעמוד הבית</BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- אזור התשובה - צף מעל השיחה, בזכוכית -->
    <div
      v-if="!done"
      ref="composerEl"
      class="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 md:px-10 pb-4 pt-8 pointer-events-none"
    >
      <div class="max-w-[760px] mx-auto flex flex-col gap-2 pointer-events-auto">
        <template v-if="step.special === 'signature'">
          <SignaturePad v-if="!busy" @sign="onSign" />
        </template>
        <template v-else>
          <!-- תשובות מהירות. בלי overflow - אחרת הצל של הזכוכית נחתך -->
          <div
            v-if="options.length && !busy"
            class="flex flex-wrap gap-2"
            role="group"
            aria-label="תשובות מהירות"
          >
            <button
              v-for="o in options"
              :key="o.value"
              type="button"
              :class="[
                'shrink-0 rounded-full text-[#171c23] text-[14px] font-semibold px-4 py-2 transition-all active:scale-[.97] animate-[chat-rise_.26s_ease-out_both]',
                GLASS,
              ]"
              @click="respond(o.value, o.label)"
            >
              {{ o.label }}
            </button>
          </div>

          <template v-if="step.special === 'file' && !busy">
            <input ref="fileEl" type="file" accept="image/*,.pdf" class="hidden" @change="onFile" />
            <button
              type="button"
              :class="[
                'flex items-center justify-center gap-2 rounded-[20px] text-[#008ff0] text-[14px] font-semibold px-4 py-4 transition-all',
                GLASS,
              ]"
              @click="fileEl?.click()"
            >
              <Paperclip :size="16" class="shrink-0" />
              העלאת צילום צ׳ק או אישור ניהול חשבון
            </button>
          </template>

          <form
            v-if="step.special !== 'file'"
            :class="[
              'flex items-center gap-2 rounded-full ps-5 pe-1.5 py-1.5 transition-all focus-within:bg-white focus-within:border-[rgba(0,143,240,0.4)] focus-within:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]',
              GLASS,
            ]"
            @submit.prevent="submitText"
          >
            <input
              ref="inputEl"
              v-model="text"
              :disabled="busy"
              :placeholder="placeholder"
              :inputmode="step.text?.numeric ? 'numeric' : 'text'"
              aria-label="תשובה"
              class="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#171c23] placeholder:text-[rgba(23,28,35,0.4)] py-1.5"
            />
            <button
              type="submit"
              :disabled="busy || !text.trim()"
              aria-label="שליחה"
              class="w-10 h-10 rounded-full bg-[#008ff0] text-white flex items-center justify-center shrink-0 transition-all hover:bg-[#0080d6] active:scale-95 disabled:opacity-40"
            >
              <Send :size="17" class="-scale-x-100" />
            </button>
          </form>
        </template>

        <!-- ההערה מוסתרת במובייל - חוסכת מקום מעל המקלדת -->
        <p class="hidden sm:block text-center text-[11.5px] text-[#171c23] opacity-45">
          העוזר מציג את הנתונים הרשומים במערכת. כל שינוי נשמר רק לאחר החתימה בסוף השיחה.
        </p>
      </div>
    </div>

    <BaseDialog
      v-if="exitOpen"
      title="לצאת מאימות הנתונים?"
      :width="420"
      @close="exitOpen = false"
    >
      <div class="flex items-start gap-3">
        <BotMark :size="40" />
        <p class="text-[#171c23] text-[14px] leading-relaxed text-right">
          השיחה תישמר, ובכניסה הבאה נמשיך בדיוק מאותה נקודה.
        </p>
      </div>
      <template #footer="{ close }">
        <BaseButton variant="outline" @click="close">המשך בשיחה</BaseButton>
        <BaseButton
          @click="
            exitOpen = false;
            emit('exit');
          "
        >
          יציאה
        </BaseButton>
      </template>
    </BaseDialog>
  </section>
</template>
