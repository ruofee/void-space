<script lang="ts" setup>
const props = defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="page_title">
    <div class="title">{{ props.title }}</div>
    <div class="description" v-if="props.description">{{ props.description }}</div>
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
  }

  .description {
    font-size: 16px;
    color: var(--vp-c-text-3);
  }
}
</style>
