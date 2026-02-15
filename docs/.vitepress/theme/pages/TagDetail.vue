<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import { data } from '../composables/articles.data'

import ArticleCard from '../components/ArticleCard.vue'
import PageTitle from '../components/PageTitle.vue'
import BackButton from '../components/BackButton.vue'

const route = useRoute()

// 从路由中获取标签名称
const tagName = computed(() => {
  const path = route.path
  const match = path.match(/\/tags\/(.+)/)
  return match ? decodeURIComponent(match[1].replace('.html', '')) : ''
})

// 过滤出当前标签的文章
const articles = computed(() => {
  const tag = tagName.value
  if (!tag || !data?.articles) return []
  
  return data.articles.filter(article => 
    article.tags.includes(tag)
  )
})
</script>

<template>
  <div class="tag-articles">
    <div class="tag-articles-container">
      <BackButton href="/tags" text="返回分类列表" />

      <PageTitle
        class="page-title"
        :title="`分类: ${tagName}`" 
        :description="`共 ${articles.length} 篇文章`"
      />
      
      <div v-if="articles.length === 0" class="empty">
        该标签下暂无文章
      </div>
      
      <div v-else class="articles-list">
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
.tag-articles {
  display: flex;
  justify-content: center;
}

.tag-articles-container {
  width: 100%;
  max-width: 800px;
}

.empty {
  margin-top: 64px;
  text-align: center;
  font-size: 1rem;
  color: var(--vp-c-text-3);
}

.articles-list {
  display: flex;
  flex-direction: column;
  row-gap: 100px;
  margin-top: 64px;
}

.page-title {
  margin-top: 28px;
}
</style>
