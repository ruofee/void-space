<script lang="ts" setup>
import PageTitle from '../components/PageTitle.vue'

const toys = [
  {
    name: 'vue-ellipsis-component',
    description: '高性能、可自定义的 vue 文本缩略组件。支持自定义缩略符、尾文本过滤、富文本缩略等功能。Gzip 后仅 5 KB大小',
    link: 'https://github.com/ruofee/vue-ellipsis-component',
  },
  {
    name: 'vue-ellipsis-3',
    description: '缩略组件的 vue3.x 版本',
    link: 'https://github.com/ruofee/vue-ellipsis-3',
  },
  {
    name: 'vuepress-theme-blue',
    description: '一个简洁且优雅的 vuepress 博客主题',
    link: 'https://github.com/ruofee/vuepress-theme-blue',
  },
  {
    name: 'log game',
    description: '一个运行在浏览器控制台的汽车小游戏，演示可以看这篇文章',
    link: 'https://github.com/ruofee/LogGame',
  },
  {
    name: 'vue-filter-box',
    description: '根据JSON对象自动构建的vue筛选框组件, 基于view-design',
    link: 'https://github.com/ruofee/vue-filter-box',
  }
]

const contacts = [
  {
    name: 'github',
    link: 'https://github.com/ruofee',
  },
  {
    name: 'zhihu',
    link: 'https://www.zhihu.com/people/chen-ruo-feng-e',
  },
  {
    name: 'email',
    link: 'mailto:ruofee@126.com',
  }
]
</script>

<template>
  <div class="about-me">
    <div class="about-me-container">
      <PageTitle title="关于我" />

      <div class="info">
        <img class="avatar" src="https://www.ruofee.cn/imgs/headImage.png" alt="">

        <div class="info-content">
          <div class="name">Ruofee</div>
          <div class="job">前端开发工程师 & 全职</div>
          <div class="description">
            <p>欢迎来到我的个人博客，我是 Ruofee，一位热爱编程的前端工程师，此前就职于百度，目前在职于 Shopee~</p>
            <p>不知道分享的知识对你是否有帮助呢？</p>
            <p>除了编程也会玩玩 lolm，switch games，也有点喜欢动漫 ^.^</p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="toys">
        <div class="toys-title">开源</div>
        <div class="toys-description">偶尔写写的小玩具，感兴趣的可以看看~</div>
        <div class="toys-list">
          <div class="toy-item" v-for="toy in toys" :key="toy.name">
            <a :href="toy.link" target="_blank" class="toy-name">{{ toy.name }}</a>
            <div class="toy-description">{{ toy.description }}</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="contacts">
        <div class="contacts-title">联系方式~</div>
        <div class="contacts-description">如果有问题或者想要交流，可以通过以下方式联系我~</div>
        <div class="contacts-list">
          <div class="contact-item">
            <a href="https://github.com/ruofee" target="_blank" class="contact-name">
              <img src="../assets/icons/github.svg" alt="github" class="contact-icon">
            </a>
          </div>
          <div class="contact-item">
            <a href="https://github.com/ruofee" target="_blank" class="contact-name">
              <img src="../assets/icons/zhihu.svg" alt="zhihu" class="contact-icon">
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-me {
  display: flex;
  justify-content: center;
}

.about-me-container {
  display: flex;
  flex-direction: column;
  gap: 60px;
  width: 100%;
  max-width: 800px;
  padding: 32px;

  .info {
    display: flex;
    column-gap: 64px;

    .avatar {
      width: 190px;
      height: 190px;
      object-fit: cover;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .name {
        font-size: 28px;
        font-weight: 600;
        color: var(--vp-c-text-1);
      }

      .job {
        font-size: 16px;
        color: var(--vp-c-text-3);
      }

      .description {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 16px;
        line-height: 1.5;
        color: var(--vp-c-text-1);
      }
    }
  }

  .contacts {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .contacts-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--vp-c-text-1);
    }

    .contacts-description {
      font-size: 16px;
      color: var(--vp-c-text-3);
    }

    .contacts-list {
      display: flex;
      gap: 16px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 16px;

      .contact-name {
        font-size: 16px;

        .contact-icon {
          width: 20px;
          height: 20px;
        }
      }
    }
  }

  .toys {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .toys-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--vp-c-text-1);
    }

    .toys-description {
      font-size: 16px;
      color: var(--vp-c-text-3);
    }

    .toys-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .toy-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .toy-name {
        font-size: 16px;
        color: var(--vp-c-brand-1);
      }

      .toy-description {
        font-size: 14px;
        color: var(--vp-c-text-1);
      }
    }
  }
}

.divider {
  width: 100%;
  height: 1px;
  background-color: var(--vp-c-divider);
}
</style>
