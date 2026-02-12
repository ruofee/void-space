---
title: "我的 vue 怎么和你们的不一样"
date: 2021/09/21 15:57:00
banner: /imgs/wallpaper2
---



## 💣 事情经过

在某个中秋节, 心血来潮的我咔嚓咔嚓写起了 **[Yondaime](https://github.com/ruofee/Yondaime)** (一个没什么人用的博客框架) 的一个 Feature, 具体功能是这样的, 小T同学说要在网站底部加上网站的备案号, 但思来想去, 直接在配置加上一个备案号的专属配置实在是不太通用, 毕竟下次他可能就这么要求:

"废物, 我要在底部加外链"

^_^ : 滚

因此解决方案是这样的, 在配置中加多一个底部栏的拓展, 允许用户自定义底部栏的文案, 具体 api 如下:

config.js 配置文件

```js
{
  // ...省略好多配置
  footers: ['备案号: xxxxxx'],
}
```

基于以上配置, 在项目中进行功能点开发:

```html
<template>
  <div v-for="(footer, index) of footers" :key="index">
    <span>{{ footer }}</span>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        footers: ['备案号: xxxxxx'],
      };
    }
  };
</script>
```

嗯嗯, 大概就这样了, 很简单的一个功能

但是! 得兼容一下外链的场景, 因此 footers 格式修改一下:

```ts
type Footer = string | { label: string, link: string }
```

这种格式进可支持支持带链接的文本, 退可支持纯文本展示, 简称 "全 能"

啊? 你问我为什么不直接改成这样:

```ts
type Footer = { label: string, link?: string }
```

那是考虑到灵活性, 怎么扭都可以~ 🕶 墨镜一戴, 谁都不爱

于是乎, 根据上面的配置修改一下代码:

```html
<template>
  <div v-for="(footer, index) of footers" :key="index">
    <a v-if="footer.link" :href="footer.link">{{ footer.label }}</a>
    <span v-else>{{ footer }}</span>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        footers: ['备案号: xxxxxx', { label: 'Ruofee\'s blog', link: 'http://ruofee.cn' }],
      };
    }
  };
</script>
```

这么简单的改动, 爷测都不用测 - . -

## 💥 终究还是出问题了

小T同学用了以下的配置去添加网站的备案号:

```js
{
  // ...省略好多配置
  footers: ['备案号: xxxxxx'],
}
```

但展示的结果却出乎我的意料, 底部栏什么文本都没出现...

爷震惊了!

## 💊 发现原因

经过一番查找, 我发现原因在于:

当 footer 为"备案号: xxxxxx"时, v-if="footer.link" 竟然判定为 true 了, 也就是 footer.link 是存在的

我人都傻了

先把 footer.link 打印出来瞅瞅:

```js
"function link() { [native code] }"
```

 诶, 竟然是个函数, 那看看函数执行会返回什么:

```js
"<a href="undefined">备案号: xxxxxx</a>"
```

footer.link 返回了一个超链接, 链接的 href 为 函数的第一个参数, 看到这里我更懵了, 难道是 vue 封装的时候把这个方法写在变量的原型链上吗, 作为一个通用的方法方便用户生成一个超链接? 

那确实也有可能

...

吧?

A Long Time Later...

好吧我翻了 vue 和 vue-router 的源码, 还是没能找到, 该不会是 vue 的依赖库修改到了吧, 一想到我就脑壳痛, 阿西吧!

突然灵光一现, 该不会是 String 类型本身就有这个方法吧!

一试, 果然是这样, 一切都在我的掌控之中 ⭐️

> **`link()`** 方法创建一个 HTML 元素 [`<a>`](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a) ，用该字符串作为超链接的显示文本，参数作为指向另一个 URL 的超链接。
>
> **已废弃:** 该特性已经从 Web 标准中删除，虽然一些浏览器目前仍然支持它，但也许会在未来的某个时间停止支持，请尽量不要使用该特性。
>
> From [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/link).

是我无知了 =.= 还一度以为是我的 vue 和其他人的不一样, 但这确实是个踩坑点

虽然是我不测试导致的后果 (删掉)

啊? 你问我为什么通过判断 footer 的类型来进行区分? 像这样:

```html
<template>
  <div v-for="(footer, index) of footers" :key="index">
    <span v-if="typeof footer === 'string'">{{ footer }}</span>
    <a v-else :href="footer.link">{{ footer.label }}</a>
  </div>
</template>
```

那肯定是因为`v-if="footer.link"`比 v-if=`"typeof footer === 'string'"`短一些 (逃

## 🍔 后续

我改成用类型进行判断了 @.@

嘻嘻

