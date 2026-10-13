<template>
  <div class="flex gap-1.5 items-center px-1 py-2 self-start w-fit" role="status" aria-label="העוזר מקליד">
    <span
      v-for="i in 3"
      :key="i"
      class="w-[7px] h-[7px] rounded-full bg-[#008ff0] animate-[chat-bounce_1.1s_infinite]"
      :style="{ animationDelay: `${(i - 1) * 0.16}s` }"
    />
  </div>
</template>
