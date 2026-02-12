---
title: "vue-ellipsis-component: 满足多种场景的 vue 缩略组件"
date: 2022/2/9 23:13:00
banner: /imgs/vue
---

## vue-ellipsis-component 的诞生

文本缩略是业务中最常见的需求之一，通常我们使用 `webkit-line-clamp` 实现文本缩略，但这仅限于多行缩略，若是万恶的 PM 脑子一热需要你支持超过某个高度时进行缩略...... 为了让自己不会在这种场景下束手无措，我决定先摸索一下现有的 vue 缩略组件!

在一番寻找下，我发现一个 vue 缩略组件: 顾轶灵开源的 [vue-clamp](https://github.com/Justineo/vue-clamp)，大致功能如下:

- 支持多行缩略
- 支持超过最大高度时缩略
- 支持自定义缩略符，同时支持自定义缩略符出现的位置
- 支持缩略回调，在发生截断时触发
- 支持自适应缩略

vue-clamp 支持的功能挺全的，行数截断的实现原理也是相当有趣，主要是利用 `getClientRects` API 的特性，可以直接获取到行内元素的行数，因此不需要手动设置 `line-height`，具体可以查看 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getClientRects)!

然而 vue-clamp 只支持纯文本缩略，若是遇到富文本场景则捉襟见肘，就在这时，我发现一个 react 的缩略组件: [react-ellipsis](https://github.com/chenquincy/react-ellipsis)，功能更全:

- 支持多行缩略
- 支持超过最大高度时缩略
- 支持自定义缩略符
- 支持缩略回调，在发生截断时触发
- 支持富文本缩略
- 支持尾文本过滤
- 支持自适应缩略
- 超过 n 行时展示 m 行
- 超过高度 n 时展示 高度 n

确认过眼神，是我需要的人 (✺ω✺) 可惜它是个 react 组件，于是乎，动起手来，把它移植 (抄) 成 vue 组件~ vue-ellipsis-component 就这么诞生了!

## 简单介绍一下组件的功能以及原理

### 举一个 🌰

vue-ellipsis-component 完整移植了 react-ellipsis 的功能 (抄也要抄得完整)，举个简单的 demo:

```html
<template>
  <vue-ellipsis
    :visible-line="2"
    text="这是一段非常非常非常非常非常非常非常非常非常非常非常长的话">
  </vue-ellipsis>
</template>
```

更多的 demo 可以查看 [文档](http://vue-ellipsis.ruofee.cn/) ~

### 缩略策略

vue-ellipsis-component 会根据传入 props 的复杂度采用不同的缩略策略，比如[上面的例子](#简单上手)，只传入了 `text` 和 `visibleLine` 进行多行缩略，因此组件会基于常规策略实现多行缩略: 利用 css `-webkit-line-clamp` 属性进行缩略; 若是需要在超过最大高度时进行缩略，则会采用动态计算策略: 利用 JavaScript 动态计算得出缩略点，再进行文本内容的裁剪，比如以下的 demo:

```html
<template>
  <vue-ellipsis
    :visible-height="60"
    text="这是一段非常非常非常非常非常非常非常非常非常非常非常长的话">
  </vue-ellipsis>
</template>
```

并且在动态计算策略中，vue-ellipsis-component 使用二分法提升了文本缩略的性能!

### 自适应缩略

vue-ellipsis-component 通过传入 `reflowOnResize`  开启自适应缩略，默认使用 `ResizeObserver` 监听容器的变化，若是浏览器不支持 `ResizeObserver`，则使用 `window.resize` 作为降级方案 😄

```html
<template>
  <vue-ellipsis
    :visible-line="2"
    text="这是一段非常非常非常非常非常非常非常长的话"
    reflowOnResize>
   </vue-ellipsis>
</template>
```

### 富文本缩略

vue-ellipsis-component 通过传入 `useInnerHtml` 开启富文本缩略，将 `text` 作为 HTML 插入到 dom 中，因此需要自行确保 `text` 内容，防止 XSS 攻击!

```html
<template>
  <vue-ellipsis
    :visible-line="2"
    use-inner-html
    text="<b>这是一段</b><u>非常非常非常非常非常非常非常非常非常非常非常长</u>的话">
  </vue-ellipsis>
</template>
```

## 组件的不足

与 vue-clamp 不同的是，vue-ellipsis-component 需要你手动设置一个`line-height`:

在满足常规策略的情况下，是否主动设置 `line-height` 其实对缩略结果并没有影响，而在动态计算缩略下 `line-height` 则有可能会导致缩略结果不如预期；

动态计算的缩略策略，是根据 `line-height` 与传入的 `visibleLine` 进行计算得出一个可见高度，再利用可见高度和当前容器的高度做比较，从而判断是否需要进行文本裁剪。可以看出，这一过程很大程度地依赖 `line-height`；当 `line-height` 为默认值 `normal` 时，实际的行高取决于浏览器，但各个浏览器的取值可能不太一致。vue-ellipsis-component 会兼容 `line-height: normal` 的情况，但为了保证在不同浏览器的缩略效果一致，最好还是主动设置一个 `line-height`！

## 仓库地址

Github 地址: [vue-ellipsis-component](https://github.com/ruofee/vue-ellipsis-component)

文档地址: [docs](http://vue-ellipsis.ruofee.cn/)

如果觉得对你有所帮助，可以在你的项目中安装进行使用，或是给个 star ⭐️!

在 2022 年底，我们开发了支持 vue3.x 的版本：[vue-ellipsis-3](https://github.com/ruofee/vue-ellipsis-3)，api 完全和 vue-ellipsis-component 保持一致，因此你可以通过查阅 vue-ellipsis-component 的[文档](http://vue-ellipsis.ruofee.cn/)来使用它！

## 问题反馈

如果发现组件中存在的问题或是不足，可以提交你的问题到 [github issue](https://github.com/ruofee/vue-ellipsis-component/issues)，或提交一个 Pull Request，感谢你的参与!
