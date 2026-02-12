/**
 * 计算文本的阅读时间
 * @param text 要计算的文本内容
 * @param wordsPerMinute 每分钟阅读的字数，中文默认300，英文默认200
 * @returns 格式化的阅读时间，如 "5 min" 或 "30 second"
 */
export const calculateReadingTime = (text: string, wordsPerMinute = 300): string => {
  if (!text) return '0 second'

  // 移除 Markdown 语法标记
  let cleanText = text
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`[^`]*`/g, '')
    // 移除链接
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除标题标记
    .replace(/^#+\s+/gm, '')
    // 移除列表标记
    .replace(/^[-*+]\s+/gm, '')
    // 移除引用标记
    .replace(/^>\s+/gm, '')

  // 统计中文字符数（包括中文标点）
  const chineseChars = (cleanText.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g) || []).length
  
  // 统计英文单词数
  const englishWords = cleanText
    .replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '')
    .match(/\b\w+\b/g)?.length || 0

  // 计算总字数（中文按字计算，英文按单词计算）
  const totalWords = chineseChars + englishWords

  // 计算阅读时间（分钟）
  const minutes = totalWords / wordsPerMinute
  
  // 转换为秒
  const seconds = Math.ceil(minutes * 60)

  // 格式化输出
  if (seconds < 60) {
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }

  const mins = Math.ceil(minutes)
  return `${mins} min${mins > 1 ? 's' : ''}`
}
