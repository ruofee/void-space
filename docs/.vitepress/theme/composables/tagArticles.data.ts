import { createContentLoader } from 'vitepress'
import { calculateReadingTime } from '../utils/readingTime'

export interface TagArticle {
  title: string
  url: string
  date: string
  banner?: string
  description?: string
  readingTime: string
  tags: string[]
}

export interface TagData {
  tag: string
  articles: TagArticle[]
}

declare const data: TagData
export { data }

export default createContentLoader('article/*.md', {
  excerpt: true,
  render: true,
  transform(rawData): TagData {
    // 从 URL 中获取当前的 tag 名称
    // 这个方法会为每个页面单独调用
    const currentTag = '' // 默认值，实际在组件中动态获取
    
    const allArticles = rawData
      .map(({ url, frontmatter, html }) => ({
        title: frontmatter.title || 'Untitled',
        url,
        date: frontmatter.date || '',
        banner: frontmatter.banner,
        description: frontmatter.description || '',
        readingTime: calculateReadingTime(html || ''),
        tags: frontmatter.tags?.split(',').map((t: string) => t.trim()) || [],
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      tag: currentTag,
      articles: allArticles,
    }
  },
})
