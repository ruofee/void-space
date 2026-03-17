---
name: cover-generator
description: 生成博客文章封面 - 当用户说生成xxx文章封面时触发，自动分析文章内容生成对应风格的HTML封面
---

## Trigger Phrases
- 帮我生成文章的封面
- 为这篇文章设计个封面
- 生成博客封面图：[文章标题/内容]

## Constraints
- **禁止使用 Emoji**：所有图形必须使用 CSS 绘制（如网格、线条、几何图形）。
- **禁止展示文章的时间**：禁止展示文章中的时间（发布时间、修改时间）。
- **风格**：现代、简约、大厂技术文档感、Hack 风格。
- **技术栈**：使用 HTML5, CSS3, 和 html-to-image 库。
- **输出格式**：直接输出一段包含完整 CSS 和 JS 的 HTML 代码块。

## Workflow

### Step 1: 内容解析
从用户提供的文本中提取：
- **Primary Title**: 核心标题（需精简，适合大字显示）。
- **Keywords**: 3-5 个技术关键词（如：React, WebAssembly, Rust）。
- **Visual Theme**: 根据技术栈判断主题色（例如：Node.js 为绿色 #00ed64，Docker 为蓝色 #2496ed）。

### Step 2: 界面设计 (CSS Logic)
- **背景**：深色调 (#0f172a) 或 纯白 (#ffffff)。
- **纹理**：使用 CSS `linear-gradient` 绘制 20px*20px 的网格线（Grid）。
- **装饰**：在角落添加“代码片段”感的小装饰，如 `[010110]`, `// ROOT_ACCESS`, `SYSTEM_READY` 等文字或 CSS 绘制的三角形。

### Step 3: 代码生成 (Template)
生成如下结构的 HTML 代码：

```html
<!DOCTYPE html>
<html>
<head>
    <script src="[https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js](https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js)"></script>
    <style>
        /* 1. 基础布局：1200x630 (标准社交媒体分享尺寸) */
        #capture-area {
            width: 1200px; height: 630px; 
            background: #0a0a0c; color: #fff;
            display: flex; flex-direction: column; justify-content: center;
            padding: 80px; box-sizing: border-box; position: relative;
            font-family: 'Segoe UI', system-ui, sans-serif; overflow: hidden;
        }
        /* 2. 极客装饰线 */
        .grid {
            position: absolute; inset: 0;
            background-image: linear-gradient(rgba(0,255,157,0.05) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(0,255,157,0.05) 1px, transparent 1px);
            background-size: 40px 40px;
        }
        .accent-bar {
            position: absolute; left: 0; top: 20%; width: 8px; height: 60%;
            background: {THEME_COLOR};
        }
        /* 3. 文本样式 */
        .title { font-size: 72px; font-weight: 800; line-height: 1.2; z-index: 10; max-width: 900px; }
        .metadata { margin-top: 40px; display: flex; gap: 20px; z-index: 10; }
        .tag { border: 1px solid {THEME_COLOR}; color: {THEME_COLOR}; padding: 5px 15px; font-family: monospace; }
        /* 4. 按钮样式 (不参与截图) */
        .download-btn {
            margin-top: 20px; padding: 12px 24px; background: {THEME_COLOR}; 
            color: #000; border: none; cursor: pointer; font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="capture-area">
        <div class="grid"></div>
        <div class="accent-bar"></div>
        <div class="title">{EXTRACTED_TITLE}</div>
        <div class="metadata">
            {KEYWORDS_AS_TAGS}
        </div>
    </div>
    <button class="download-btn" onclick="saveImage()">下载封面图片</button>

    <script>
        async function saveImage() {
            const el = document.getElementById('capture-area');
            const dataUrl = await htmlToImage.toPng(el);
            const link = document.createElement('a');
            link.download = 'blog-cover.png';
            link.href = dataUrl;
            link.click();
        }
    </script>
</body>
</html>
```

### Step 4: 文件保存

生成的 html 保存到当前目录中的 `banner-html` 文件夹中
