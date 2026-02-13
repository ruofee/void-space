<script setup>
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

import Header from './Header.vue'
import Footer from './Footer.vue'

import Articles from '../pages/Articles.vue'
import Article from '../pages/Article.vue'
import Tags from '../pages/Tags.vue'
import TagDetail from '../pages/TagDetail.vue'
import AboutMe from '../pages/AboutMe.vue'

const { frontmatter } = useData()
const route = useRoute()

// 根据路由判断是否是标签详情页
const isTagDetailPage = computed(() => {
  return route.path.startsWith('/tags/') && route.path !== '/tags' && route.path !== '/tags.html'
})
</script>

<template>
  <div>
    <Header />
    <div class="content-wrapper">
      <div class="content">
        <Articles v-if="frontmatter.layout === 'home'" />
        <Tags v-else-if="frontmatter.layout === 'tags'" />
        <TagDetail v-else-if="isTagDetailPage" />
        <AboutMe v-else-if="frontmatter.layout === 'about'" />
        <Article v-else />
      </div>
    </div>
    <Footer />
  </div>
</template>

<style lang="scss" scoped>
.content-wrapper {
  display: flex;
  justify-content: center;
  padding-top: calc(56px + 64px);
  padding-bottom: 120px;

  .content {
    padding-left: 40px;
    padding-right: 40px;
    max-width: 1200px;
    background-color: #fff;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    .content {
      max-width: 100%;
    }
  }
}
</style>