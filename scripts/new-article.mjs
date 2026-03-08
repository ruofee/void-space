import { writeFile, access } from 'node:fs/promises'
import { createInterface } from 'node:readline'

const ARTICLE_DIR = new URL('../docs/article', import.meta.url).pathname
const BANNERS = Array.from({ length: 19 }, (_, i) => `/imgs/banner/banner${i + 1}.png`)

function today() {
  const d = new Date()
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function randomBanner() {
  return BANNERS[Math.floor(Math.random() * BANNERS.length)]
}

function createPrompter() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  let closed = false
  rl.once('close', () => { closed = true })

  return {
    ask(question) {
      if (closed) return Promise.resolve('')
      return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer))
      })
    },
    close() { rl.close() },
  }
}

function buildFrontmatter({ title, date, banner, description, tags }) {
  return [
    '---',
    `title: "${title}"`,
    `date: ${date}`,
    `banner: ${banner}`,
    `description: ${description}`,
    `tags: ${tags}`,
    '---',
  ].join('\n')
}

async function main() {
  const prompter = createPrompter()

  const title = (await prompter.ask('📝 文章标题: ')).trim()
  if (!title) {
    console.log('❌ 标题不能为空')
    prompter.close()
    return
  }

  const filePath = `${ARTICLE_DIR}/${title}.md`

  try {
    await access(filePath)
    console.log(`❌ 文章已存在: ${title}.md`)
    prompter.close()
    return
  } catch {}

  const description = (await prompter.ask('📄 文章描述 (可选): ')).trim()
  const tags = (await prompter.ask('🏷️  文章标签 (逗号分隔, 可选): ')).trim()

  prompter.close()

  const content = buildFrontmatter({
    title,
    date: today(),
    banner: randomBanner(),
    description,
    tags,
  })

  await writeFile(filePath, `${content}\n`)
  console.log(`\n✅ 已创建: docs/article/${title}.md`)
}

main().catch(console.error)
