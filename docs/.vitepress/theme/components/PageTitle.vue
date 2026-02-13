<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  title: string
  description?: string
  typewriter?: boolean
}>()

const displayTitle = ref('')
const displayDesc = ref('')
const titleDone = ref(false)
const allDone = ref(false)

const TYPE_SPEED = 80
const DESC_DELAY = 300

const typeText = (text: string, target: typeof displayTitle, onDone?: () => void) => {
  let i = 0
  target.value = ''
  const tick = () => {
    if (i < text.length) {
      target.value += text[i]
      i++
      setTimeout(tick, TYPE_SPEED)
    } else {
      onDone?.()
    }
  }
  tick()
}

const startTyping = () => {
  displayTitle.value = ''
  displayDesc.value = ''
  titleDone.value = false
  allDone.value = false

  typeText(props.title, displayTitle, () => {
    titleDone.value = true
    if (props.description) {
      setTimeout(() => {
        typeText(props.description!, displayDesc, () => {
          allDone.value = true
        })
      }, DESC_DELAY)
    } else {
      allDone.value = true
    }
  })
}

onMounted(() => {
  if (props.typewriter) startTyping()
})

watch(() => props.title, () => {
  if (props.typewriter) startTyping()
})
</script>

<template>
  <div class="page_title">
    <template v-if="typewriter">
      <div class="title">
        <span>{{ displayTitle }}</span>
        <span v-if="!titleDone" class="cursor">|</span>
      </div>
      <div class="description" v-if="description" :class="{ invisible: !titleDone }">
        <span>{{ titleDone ? displayDesc : description }}</span>
        <span v-if="titleDone && !allDone" class="cursor">|</span>
      </div>
    </template>
    <template v-else>
      <div class="title">{{ props.title }}</div>
      <div class="description" v-if="props.description">{{ props.description }}</div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.page_title {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .title {
    font-size: 40px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    line-height: 1.5;
  }

  .description {
    font-size: 16px;
    color: var(--vp-c-text-3);
    line-height: 1.5;
  }

  .invisible {
    visibility: hidden;
  }

  .cursor {
    display: inline-block;
    margin-left: 2px;
    animation: blink 0.6s step-end infinite;
    font-weight: 300;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
