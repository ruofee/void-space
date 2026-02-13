<script lang="ts" setup>
import { computed } from 'vue'
import { Content, useData } from 'vitepress'
import { data } from '../composables/articles.data'

import ArticleDate from '../components/ArticleDate.vue'
import ArticleTags from '../components/ArticleTags.vue'
import BackButton from '../components/BackButton.vue'

const { page } = useData()

const article = computed(() => {
  const currentUrl = '/' + page.value.relativePath.replace(/\.md$/, '')

  const articles = data?.articles || []

  return articles.find((article) => article.url === `${currentUrl}.html`)
})
</script>

<template>
  <div class="article">
    <div class="article-container">
      <div class="article-header">
        <BackButton href="/" text="返回文章列表" />

        <div class="title">{{ article?.title }}</div>

        <ArticleDate :date="article?.date" :time="article?.readingTime" />

        <ArticleTags :tags="article?.tags" />
      </div>

      <div v-if="article?.banner" class="banner-wrapper">
        <img class="banner" :src="article?.banner" alt="" />
      </div>

      <Content class="vp-doc article-content" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.article {
  display: flex;
  justify-content: center;

  .article-container {
    display: flex;
    flex-direction: column;
    gap: 36px;
    width: 100%;
    max-width: 800px;

    .article-header {
      display: flex;
      flex-direction: column;
      gap: 28px;

      .title {
        font-size: 35px;
        font-weight: 500;
        color: var(--vp-c-text-1);
      }
    }

    .banner-wrapper {
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
      cursor: pointer;

      &:hover .banner {
        transform: scale(1.1);
      }
    }

    .banner {
      width: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }

    .article-content {}
  }
}
</style>