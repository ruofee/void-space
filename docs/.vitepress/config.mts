import { defineConfig } from 'vitepress'
import type MarkdownIt from 'markdown-it'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 创建一个虚拟图片模块，用于替代不存在的图片
const virtualImageId = '/@vitepress/missing-image.svg'
const resolvedVirtualImageId = '\0' + virtualImageId

// Vite 插件：处理缺失的图片
const handleMissingImagesPlugin = (): Plugin => {
  return {
    name: 'vitepress-handle-missing-images',
    resolveId(id) {
      // 如果是虚拟图片模块，返回虚拟 ID
      if (id === virtualImageId) {
        return resolvedVirtualImageId
      }
      
      // 检查是否是图片文件
      if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(id)) {
        // 如果路径以 / 开头，相对于 docs 目录
        if (id.startsWith('/')) {
          const imagePath = path.join(__dirname, '..', id)
          if (!fs.existsSync(imagePath)) {
            console.warn(`[VitePress] Image not found: ${id}, using placeholder`)
            // 返回虚拟图片模块
            return resolvedVirtualImageId
          }
        }
      }
      return null
    },
    load(id) {
      // 加载虚拟图片模块，返回一个透明的 1x1 像素 SVG
      if (id === resolvedVirtualImageId) {
        return `export default "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"`
      }
      return null
    }
  }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Void Space",
  description: "Thoughts on software development, architecture, and engineering practices.",
  // 忽略死链接检查
  ignoreDeadLinks: true,
  vite: {
    plugins: [handleMissingImagesPlugin()],
    build: {
      // 忽略缺失资源的警告
      rollupOptions: {
        onwarn(warning, warn) {
          // 忽略无法解析的导入警告（通常是缺失的图片）
          if (warning.code === 'UNRESOLVED_IMPORT') {
            return
          }
          warn(warning)
        }
      }
    },
    preview: {
      // Preview 服务器配置
      port: 4173,
      strictPort: false,
      host: true,
      open: true,
    }
  },
  markdown: {
    config: (md: MarkdownIt) => {
      // 自定义 card 语法块
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args
        const token = tokens[idx]
        const lang = token.info.trim()
        
        if (lang === 'card') {
          const content = token.content.trim()
          return `<Card content="${content.replace(/"/g, '&quot;')}" />`
        }
        
        return fence(...args)
      }
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
