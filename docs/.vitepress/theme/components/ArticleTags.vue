<script lang="ts" setup>
const props = defineProps<{
  tags: string[]
}>()
</script>

<template>
  <div class="article_tags">
    <a class="tag" v-for="tag in props.tags" :key="tag" :href="`/tags/${tag}`">{{ tag }}</a>
  </div>
</template>

<style lang="scss" scoped>
.article_tags {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;

  .tag {
    padding: 2px 8px;
    border-radius: 4px;
    background-color: var(--vp-c-bg-soft);
    font-size: 12px;
  }
}
</style>
