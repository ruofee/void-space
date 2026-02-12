import { createContentLoader } from 'vitepress'
import { calculateReadingTime } from '../utils/readingTime'

export interface ArticleData {
  title: string
  url: string
  date: string
  banner?: string
  excerpt?: string
  readingTime: string
}

declare const data: {
  articles: ArticleData[]
  tags: {
    name: string
    count: number
  }[]
}
export { data }

export default createContentLoader('article/*.md', {
  excerpt: true,
  render: true,
  transform(rawData) {
    const articles = rawData
      .map(({ url, frontmatter, excerpt, html }) => ({
        title: frontmatter.title || 'Untitled',
        url,
        date: frontmatter.date || '',
        banner: frontmatter.banner,
        excerpt: excerpt || '',
        readingTime: calculateReadingTime(html || ''),
        tags: frontmatter.tags?.split(',') || [],
        description: frontmatter.description || '',
      }))
      .sort((a, b) => {
        // 按日期降序排序
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

    const tags = articles.flatMap((article) => article.tags).reduce((acc, tag) => {
      if (!acc.find((t) => t.name === tag)) {
        acc.push({ name: tag, count: 1 })
      } else {
        acc.find((t) => t.name === tag)!.count++
      }
      return acc
    }, [] as { name: string; count: number }[])

    return {
      articles,
      tags,
    }
  }
})
