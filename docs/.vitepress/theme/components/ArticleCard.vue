<script lang="ts" setup>
import ArticleDate from './ArticleDate.vue'
import ArticleTags from './ArticleTags.vue'

const props = defineProps<{
  title: string
  url: string
  date: string
  description?: string
  banner?: string
  excerpt?: string
  readingTime?: string
  tags?: string[]
}>()

const handleImageError = (e: Event) => {
  console.error('图片加载失败:', props.banner, e)
}
</script>

<template>
  <a :href="url" class="article_card">
    <img 
      v-if="props.banner" 
      class="banner" 
      :src="props.banner" 
      alt=""
      @error="handleImageError"
    >

    <div class="content">
      <div class="title">{{ props.title }}</div>

      <div v-if="props.description" class="description">{{ props.description }}</div>

      <ArticleDate :date="props.date" :time="props.readingTime" />

      <ArticleTags :tags="props.tags" />
    </div>
  </a>
</template>

<style lang="scss" scoped>
.article_card {
  display: flex;
  flex-direction: column;
  row-gap: 24px;

  .banner {
    width: 100%;
    object-fit: cover;
  }

  .content {
    display: flex;
    flex-direction: column;
    row-gap: 16px;

    .title {
      font-size: 26px;
      font-weight: 500;
      color: var(--vp-c-text-1);
    }

    .description {
      font-size: 14px;
      color: var(--vp-c-text-3);
    }

    .info {
      display: flex;
      align-items: center;
      column-gap: 16px;
      color: var(--vp-c-text-3);
      font-size: 14px;

      .date {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .reading-time {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .icon {
        width: 14px;
        height: 14px;
      }
    }
  }
}
</style>
