<script lang="ts" setup>
import { useData } from 'vitepress'

import { data } from '../composables/articles.data'

import ArticleCard from '../components/ArticleCard.vue'
import PageTitle from '../components/PageTitle.vue'

const { site } = useData()

const articles = data?.articles || []
</script>

<template>
  <div class="articles">
    <div class="articles-container">
      <PageTitle title="Hi~ 我是 Ruofee" description="欲买桂花同载酒，终不似，少年游" typewriter />
      <div v-if="articles.length === 0" class="empty">
        暂无文章
      </div>
      <div v-else class="articles_list">
        <ArticleCard
          v-for="article in articles"
          :key="article.url"
          :title="article.title"
          :url="article.url"
          :date="article.date"
          :banner="article.banner"
          :description="article.description"
          :reading-time="article.readingTime"
          :tags="article.tags"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.articles {
  display: flex;
  justify-content: center;
}

.articles-container {
  width: 100%;
  max-width: 800px;
  padding: 32px;
}

.articles_list {
  display: flex;
  flex-direction: column;
  row-gap: 100px;
  margin-top: 64px;
}

</style>