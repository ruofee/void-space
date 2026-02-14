# Void Space

Thoughts on software development, architecture, and engineering practices.

## 🚀 开发命令

### 开发模式

启动开发服务器，支持热更新：

```bash
pnpm docs:dev
```

访问地址：http://localhost:5173/

### 构建生产版本

构建静态站点到 `docs/.vitepress/dist` 目录：

```bash
pnpm docs:build
```

### 预览生产版本

预览构建后的生产版本（需要先构建）：

```bash
pnpm docs:preview
```

或者一键构建并预览：

```bash
pnpm preview
```

预览服务器配置：
- 端口：4173
- 自动打开浏览器
- 支持局域网访问

## 📦 项目结构

```
void-space/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts           # VitePress 配置
│   │   └── theme/               # 自定义主题
│   │       ├── pages/           # 页面组件
│   │       ├── components/      # 通用组件
│   │       ├── composables/     # 数据加载器
│   │       └── utils/           # 工具函数
│   ├── article/                 # 文章 Markdown 文件
│   ├── tags/                    # 标签动态路由
│   └── index.md                 # 首页
└── package.json
```

## ✨ 功能特性

- 📝 文章管理系统
- 🏷️ 标签分类和筛选
- 📱 响应式设计
- 🎨 自定义主题和样式
- 🚀 快速构建和预览
- 🔍 丝滑的滚动体验
- 🖼️ 图片容错处理

## 🛠️ 技术栈

- [VitePress](https://vitepress.dev/) - 基于 Vite 的静态站点生成器
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Sass](https://sass-lang.com/) - CSS 预处理器

## 📝 添加文章

1. 在 `docs/article/` 目录下创建 `.md` 文件
2. 添加 frontmatter 元数据：

```markdown
---
title: 文章标题
description: 文章描述
date: 2024/01/01
banner: /imgs/banner.png
tags: Vue,React,TypeScript
---

文章内容...
```

3. 文章会自动出现在首页和对应的标签页

## 🎯 命令说明

| 命令 | 说明 |
|------|------|
| `pnpm docs:dev` | 启动开发服务器 |
| `pnpm docs:build` | 构建生产版本 |
| `pnpm docs:preview` | 预览已构建的站点 |
| `pnpm preview` | 构建并预览（一键命令） |

## 📋 Git Commit 规范

本项目使用 [Commitlint](https://commitlint.js.org/) 规范，所有 commit 消息必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式变更
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建系统变更
- `ci`: CI 配置变更
- `chore`: 其他变更

### 示例

```bash
feat: add grid background pattern
fix(article): resolve hydration mismatch in article list
docs: update README with commit guidelines
```

详细规范请查看 [`.cursor/rules/commit-message.md`](.cursor/rules/commit-message.md)

### Cursor AI 集成

如果你使用 Cursor IDE，AI 会自动遵循 `.cursor/rules/` 中定义的规范。当你说"提交代码"时，Cursor 会自动生成符合规范的 commit message。

## 📄 License

MIT
