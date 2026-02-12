---
title: "vitepress 的实现原理"
date: 2023/2/1 19:30:00
banner: /imgs/vue
---

## 什么是 Vitepress？

Vitepress 是由 Vite 和 Vue 驱动的静态站点生成器，通过获取 Markdown 编写的内容，并可以生成对应的静态 HTML 页面。我们经常使用 Vitepress 构建博客等静态网站，本文主要解析一下 Vitepress 的实现原理，下面就开始吧！

## 原理

### 初始化项目

根据官方文档推荐，我们执行以下命令初始化项目：

```bash
npx vitepress init
```

执行完命令便会进入一个设置界面，通过设置项目名等参数，最终生成一个 vitepress 项目。

我们都知道，`npx vitepress init` 实际上等同于：

```bash
npm i -g vitepress
vitepress init
```

很好理解，先全局安装 vitepress，再执行 `vitepress init`命令：

先通过 `@clack/prompts` 开启命令行 UI 界面，用户进行初始化配置：

```ts
// src/node/init/init.ts
import { group } from '@clack/prompts'

const options: ScaffoldOptions = await group(
    {
      root: () =>
        text({
          message: 'Where should VitePress initialize the config?',
          initialValue: './',
          validate(value) {
            // TODO make sure directory is inside
          }
        }),
    
      title: () =>
        text({
          message: 'Site title:',
          placeholder: 'My Awesome Project'
        }),
    // ...以下省略
)
```

再根据配置项从 template 文件夹中拉取模板文件，完成项目的初始化。

### 启动服务

在 Vitepress 项目中，我们通过执行以下命令启动文档服务：

```bash
vitepress dev
```

执行完命令，我们便可以在浏览器访问文档网站！

启动服务主要分为两步：

1. 创建 Vite 服务；
2. 执行 Vite 插件；

#### 创建 Vite 服务

```ts
// src/node/server.ts
import { createServer as createViteServer, type ServerOptions } from 'vite'
import { resolveConfig } from './config'
import { createVitePressPlugin } from './plugin'

export async function createServer(
  root: string = process.cwd(),
  serverOptions: ServerOptions & { base?: string } = {},
  recreateServer?: () => Promise<void>
) {
  // 读取 vitepress 配置
  const config = await resolveConfig(root)

  if (serverOptions.base) {
    config.site.base = serverOptions.base
    delete serverOptions.base
  }

  // 创建 vite 服务
  return createViteServer({
    root: config.srcDir,
    base: config.site.base,
    cacheDir: config.cacheDir,
    plugins: await createVitePressPlugin(config, false, {}, {}, recreateServer),
    server: serverOptions,
    customLogger: config.logger,
    configFile: config.vite?.configFile
  })
}
```

上述代码创建并启动了一个 Vite 服务：首先，通过调用 `resolveConfig`，读取用户的 Vitepress 配置并整合为一个 config 对象（配置路径默认为：`.vitepress/config/index.js`），再将部分配置传入 `createViteServer`，创建并启动 Vite 服务。

#### 执行 Vite 插件

看完上面的内容，你可能会有点疑惑，正常来说，Vite 需要一个 HTML 作为入口文件，但我们找遍 Vitepress 也未发现我们想要的 HTML 文件……其实这部分工作由 Vite 插件完成，在上面的代码片段中，我们创建了 Vite 服务，同时配置了插件：

```ts
// src/node/server.ts
return createViteServer({
    // 省略代码
    plugins: await createVitePressPlugin(config, false, {}, {}, recreateServer),
    // 省略代码
})
```

`createVitePressPlugin` 函数返回了一个插件列表，其中有一个名为 `vitepress` 的插件：

```ts
// src/node/plugin.ts
const vitePressPlugin: Plugin = {
    name: 'vitepress',
    // 省略代码
    configureServer(server) {
      // 省略代码
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url && cleanUrl(req.url)
          if (url?.endsWith('.html')) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            let html = `<!DOCTYPE html>
<html>
  <head>
    <title></title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/@fs/${APP_PATH}/index.js"></script>
  </body>
</html>`
            html = await server.transformIndexHtml(url, html, req.originalUrl)
            res.end(html)
            return
          }
          next()
        })
      }
    },
    // 省略代码
  }
```

vitepress 插件中定义了 `configureServer` 生命周期，并在 `configureServer` 中返回一个 HTML 文件，作为 Vite 服务的入口 HTML 文件，当我们访问服务时，浏览器渲染网页，执行 HTML 中引入的 Script 文件（`<script type="module" src="/@fs/${APP_PATH}/index.js"></script>`，其中 `APP_PATH` 为 `src/client/app/index.ts`），网页正常展示在我们眼前，至此，服务正常启动！

### 文档渲染

在上面的部分，我们整理了启动服务的大致步骤，接下来我们将接着整理 Markdown 文件和路由的映射关系！

#### 创建路由

Vitepress 并没有使用 Vuejs 的官方路由方案（Vue Router），而是自己实现了一个简单的路由模块：首先通过监听 window 的点击事件，当用户点击超链接元素时，执行跳转函数 `go`：

```ts
// src/client/app/router.ts
async function go(href: string = inBrowser ? location.href : '/') {
    href = normalizeHref(href)
    if ((await router.onBeforeRouteChange?.(href)) === false) return
    updateHistory(href)
    await loadPage(href)
    await router.onAfterRouteChanged?.(href)
}

function updateHistory(href: string) {
    if (inBrowser && normalizeHref(href) !== normalizeHref(location.href)) {
        // save scroll position before changing url
        history.replaceState({ scrollPosition: window.scrollY }, document.title)
        history.pushState(null, '', href)
    }
}
```

通过执行 `updateHistory`，先调用 `history.replaceState`，将当前页面的位置信息 `scrollY` 保存到 history state 中；再调用 `history.pushState`，更新 url；最后再调用 `loadPage` 加载 url 对应的页面，核心代码如下：

```ts
// src/client/app.ts
let pageFilePath = pathToFile(path)
let pageModule = null
// 省略代码
pageModule = import(/*@vite-ignore*/ pageFilePath + '?t=' + Date.now())
// 省略代码
return pageModule

```

`pathToFile` 函数将传入的 url 转成 md 后缀的路径，也就是对应的 Markdown 文件，再通过 `import` 导入对应路径的文件；举个例子，假设 url 为 `/ruofee`，那么最终结果为：`import(/*@vite-ignore*/ 'ruofee.md?t=当前的时间戳')`；

同时监听 popstate 事件，当用户使用浏览器返回、前进等操作时，调用 `loadPage` 方法，加载 url 对应的 md 文件，并根据 history state 中保存的页面位置信息进行定位：

```ts
// src/client/app/router.ts
window.addEventListener('popstate', async (e) => {
    await loadPage(
        normalizeHref(location.href),
        (e.state && e.state.scrollPosition) || 0
    )
    router.onAfterRouteChanged?.(location.href)
})

// 省略代码 - loadPage
window.scrollTo(0, scrollPosition)
```

#### 创建 Vue 应用

```ts
// src/client/app.ts
import {
  createApp,
  type App
} from 'vue'

// 省略代码
function newApp(): App {
    // 省略代码
    return createApp(VitePressApp)
}

const app = newApp()
```

首先通过执行 `createApp(VitePressApp)` 创建 Vue 应用，`VitePressApp` 是当前主题的 Layout 组件（`@theme` 是别名配置，指向当前主题，若是没有设置，则默认为 `src/client/theme-default`）：

```ts
// src/client/app.ts
import RawTheme from '@theme/index'

const Theme = resolveThemeExtends(RawTheme)

const VitePressApp = defineComponent({
    name: 'VitePressApp',
    setup() {
    // 省略代码
        return () => h(Theme.Layout!)
    }
})

```

再将上面的路由对象注册到 Vue 应用中，并注册两个全局组件：`Content` 和 `ClientOnly`：

```ts
// src/client/app.ts
// 将路由注入 app
app.provide(RouterSymbol, router)
const data = initData(router.route)
app.provide(dataSymbol, data)

// 注册全局组件
app.component('Content', Content)
app.component('ClientOnly', ClientOnly)
```

#### Markdown 渲染

直到目前为止，我们已经启动了 Vite 服务，我们可以在浏览器中访问 HTML，并执行 Script 创建 Vue 应用，实现了路由系统，当我们访问对应链接时，便会加载对应的 Markdown 文件，但你肯定会有疑惑：我们的 Markdown 文件如何被解析渲染到页面中呢？

其实在[启动服务](#%E5%90%AF%E5%8A%A8%E6%9C%8D%E5%8A%A1)的部分中，我们提到了一个名为 vitepress 的 vite 插件，Markdown 渲染工作便是在这个插件的 `transform` 生命周期中实现：

```ts
// src/node/plugin.ts
{
    async transform(code, id) {
        if (id.endsWith('.vue')) {
            return processClientJS(code, id)
        } else if (id.endsWith('.md')) {
            // transform .md files into vueSrc so plugin-vue can handle it
            const { vueSrc, deadLinks, includes } = await markdownToVue(
              code,
              id,
              config.publicDir
            )
            // 省略代码
            const res = processClientJS(vueSrc, id)
            return res
        }
    }
}
```

当我们使用 `import` 加载 md 文件时，便会调用 `transform` 函数，对文件内容进行转换：执行 `markdownToVue`，将 markdown 内容转成 Vue SFC，再通过 `@vitejs/plugin-vue` 插件将 Vue 组件渲染到页面；那么 `markdownToVue` 做了什么工作呢？具体如下：

```ts
// src/node/markdownToVue.ts
const html = md.render(src, env)
const vueSrc = [
    // 省略代码
    `<template><div>${html}</div></template>`,
    // 省略代码
].join('\n')
```

这部分比较简单，md 是一个 markdown-it 对象，通过调用 `md.render` 函数，将 markdown 内容转成 HTML 格式，再输出到页面；

值得一提的是，若是你在 markdown 中书写 Vue 组件语法，由于是非 markdown 语法，因此 markdown-it 不会对其进行转换，那么 Vue 语法将在页面中得以执行，官网中的[例子](https://vitepress.dev/zh/guide/using-vue)便是利用这个原理！

## 总结

以上便是 Vitepress 大致的原理，Vitepress 是一个非常优秀的文档构建工具，其中有很多设计上的细节文章没提到，具体大家可以自行去 [Github](https://github.com/vuejs/vitepress) 上查看源码！