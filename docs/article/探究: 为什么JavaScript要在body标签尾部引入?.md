---
title: "探究: 为什么JavaScript要在body标签尾部引入?"
date: 2020/10/23 00:00:00
banner: /imgs/code
---



## 🍁 故事起因

某天, 小枫在网上浏览**前端性能优化**的相关文章, 文章中指出: **要将 JavaScript 的引入置于 body 标签的尾部**;

似乎从开始学习前端之时, 就一直受到这样的指导, 那么问题来了, 为什么要这样做呢?

小枫思索了一会, 整个人陷入自闭的状态... 于是乎, 接着上网查阅资料; 查了一圈之后发现, 网上普遍的观点如下:

> JavaScript 执行会阻塞 HTML 的渲染, 因此将 JavaScript 的引入置于 body 标签尾部, 可以使页面先呈现出来, 避免 JavaScript 的执行导致页面白屏;

talk is cheap, show me the code, 出于钻研的精神, 小枫决定自己来验证这个结论;

## 👨‍🦽 动手验证

#### 准备工作

大家都知道, chrome (文章使用的是版本为: 86.0.4240.80) 是个神器, 自带性能调优工具, 可以记录分析网页的渲染流程: 按 F12 或是 鼠标右键+检查 便可以打开控制台, 选择 **Performance**, 如下图;

![](https://pic3.zhimg.com/80/v2-52f8f242f869efd84b9246e26bb6d45e_1440w.jpg)

我们先新建一个简单的HTML文件, 使用 **Performance** 分析一下页面的渲染流程:

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <p>你好, 小枫</p>
  </body>
</html>
```

![](https://pic1.zhimg.com/80/v2-c079ce4e29760c796f930b8ccf32617c_1440w.jpg)

从上图可以看出, 网页的渲染流程大致如下:

1.  **Parse HTML** 该阶段生成了 DOM Tree 和 CSSOM Tree;
2.  **Layout** 该阶段将 DOM Tree 结合 CSSOM Tree, 生成 Layout Tree (又称Render Tree), 计算每个元素的尺寸和位置;
3.  **Update Layout Tree** 该阶段更新 Layout Tree;
4.  **Paint** 该阶段生成 PaintLayout Tree 记录元素绘制顺序;
5.  **Composite** 该阶段合成视图, 输出到屏幕;

#### 验证过程

简单理解网页渲染流程之后, 我们来对问题进行验证, 列举以下两种情况:

1.  script 标签置于 head 标签中;
2.  script 标签置于 body 标签尾部;

首先来看第一种情况, **script 标签置于 head 标签中:**

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
    <script>
      for (let i = 0; i < 100000; i++) {
        for (let j = 0; j < 100000; j++) {}
      }
    </script>
  </head>
  <body>
    <p>你好, 小枫</p>
  </body>
</html>
```

在上面的 html 文件中, script 标签里是一段**计算量很大**的 JavaScript, **值得注意的是**, 这里的 JavaScript 是以嵌入的形式存在于 HTML 中, 并非使用 src 属性进行外部引入; 接着在浏览器打开该 html 文件, 使用 **Performance** 进行分析:

![](https://pic1.zhimg.com/80/v2-8f5f575494a6d9ce0b7b43592ab03458_1440w.jpg)

如上图所示, **ParseHTML **阶段一直呈阻塞状态, 直到 **Evalute Script** 阶段结束才重新开始 **ParseHTML**, 接着进行 **Layout** 以及 **Paint** 等渲染页面流程; 在这个过程中, 页面一直呈现白屏状态, 直到 JavaScript 加载完成才有内容展示; 可以看出, JavaScript 的执行阻塞了 HTML 的解析和渲染;

接着看第二种情况, **script 标签置于 body 标签尾部:**

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <p>你好, 小枫</p>
    <script>
      for (let i = 0; i < 100000; i++) {
        for (let j = 0; j < 100000; j++) {}
      }
    </script>
  </body>
</html>
```

此处的 JavaScript 同样为一段**计算量很大**的代码, 并且也以嵌入的形式引入; 使用 **Performance** 进行分析:

![](https://pic4.zhimg.com/80/v2-20098cabb029fe73db4bf48186791083_1440w.jpg)

如上图所示, 由于 JavaScript 的执行, **ParseHTML **阶段同样一直呈阻塞状态, 但不一样的是, 当 **Evalute Script** 阶段结束时, 直接进行 **Layout** 和 **Paint** 等渲染网页流程; 这个过程页面同样一直白屏, 直到 JavaScript 执行完成; 我们可以这么理解: HTML 自上往下执行, 因此在执行 JavaScript 之前 **ParseHTML** 流程正常执行: **当 script 标签放在 body 标签尾部时**, 浏览器会先解析 HTML, 之后遇到 **script标签**, 开始执行 JavaScript, 这个过程将会阻塞 HTML 的解析渲染, 也就是 **Layout** 和 **Paint** 这两个阶段, 所以页面才会一直呈现白屏状态直到 JavaScript 执行完毕;

从上面两种情况可以看出: **当 JavaScript 以 script 标签嵌入的方式执行时, 不管 script 标签置于 head 标签中或是置于 body 标签尾部, 都会因为 JavaScript 阻塞了 HTML 解析渲染的原因, 导致页面白屏, 直到 JavaScript 加载完毕;**

所以这可以证明网上搜索到的观点是错误的吗?

**"达咩, 达咩, 达咩哟!"**

因为 JavaScript 的引入方式并非这一种, 还有另外一种更为常见的形式: **使用 script 标签的 src 属性引入外部 JavaScript**; So, 以 script 标签引入外部 JavaScript 的形式, 开启下一轮验证:

第一种情况, **script 标签置于 head 标签中:**

将计算量很大的代码移至 js 文件中:

// index.js

```js
for (let i = 0; i < 100000; i++) {
    for (let j = 0; j < 100000; j++) {}
} 
```

并在html中引入该 js 文件:

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
    <script src="./index.js"></script>
  </head>
  <body>
    <p>你好, 小枫</p>
  </body>
</html>
```

接着, 使用 **Performance** 对网页进行分析:

![](https://pic3.zhimg.com/80/v2-3e3ecf2154f11c55c5d0a4df5e882872_1440w.jpg)

如上图, 浏览器先调用 **Network 线程**下载 HTML 文件, 之后对 HTML 进行自上往下解析工作, 直到遇到 **head 标签**中的 **script 标签**, 由于 **script 标签** 引入的是外部 js 文件, 浏览器接着调用 **Network 线程**下载目标 js 文件; 可以看到, 这一过程中并没有进行 **ParseHTML;**

![](https://pic1.zhimg.com/80/v2-61f93fcbf1e0b620070ecb5f5934a024_1440w.jpg)

下载完 js 文件之后, 浏览器开始执行 JavaScript, 等待代码执行完毕之后, 再开始进入 **ParseHTML**, **Layout** 以及 **Paint** 等网页解析渲染操作; 整个流程, 网页一直呈现白屏状态, 直到 JavaScript 执行完毕, 也就是说, 当外部引入 js 文件时, 且**script标签** 置于**head 标签**中时, **Network 线程**下载 js 文件将会阻塞 HTML 的解析, 导致页面在 JavaScript 下载并执行完之前一直呈现白屏状态;

第二种情况, **script 标签置于 body 标签尾部:**

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <p>你好, 小枫</p>
    <script src="./index.js"></script>
  </body>
</html>
```

接着使用 **Performance** 进行网页分析:

![](https://pic2.zhimg.com/80/v2-4092eef2ec70d449965e40172346f90d_1440w.jpg)

如图所示, HTML 自上而下解析, 进行 **ParseHTML**, 遇到引入外部 js 的 **script标签**, **Network 线程**开始下载 js 文件, 网页的渲染同时进行, 直到 js 文件下载完成, 开始执行 JavaScript; 整个过程中, 网页在 JavaScript 执行完毕前先呈现出内容, 因为在 js 文件下载之前, 浏览器已经完成 HTML 的解析工作, 而在 js 文件下载过程中, 网页的渲染并没有因此阻塞, 对比第一种情况, 我们可以得出结论:

**当使用 script 标签引入外部 js 文件时, js 文件下载会阻塞 HTML 的解析, 但不会阻塞网页的渲染;**

为了充分验证上述结论, 我们在 script 标签后加多一个元素:

```text
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <p>你好, 小枫</p>
    <script src="./index.js"></script>
    <p>你好, 小枫</p>
  </body>
</html>
```

观察页面变化并使用 **Performance** 分析网页:

![](https://pic2.zhimg.com/80/v2-8b29e3762cce13ce303397aed50407b9_1440w.jpg)

如上图, 网页先展示出第一行文本, 第二行文本并未出现, 此时 script 标签仍出于下载外部js文件阶段, 说 **Network 线程**下载 js 文件的过程阻塞第二行文本的解析, 而第一行文本能正常呈现出来, 说明这一过程并没有阻塞网页的渲染;

![](https://pic1.zhimg.com/80/v2-4efcde736559d608f63081c6a91e3d60_1440w.jpg)

![](https://pic1.zhimg.com/80/v2-aacaa4b2ac7edd991d4a917db11deb2c_1440w.jpg)

一段时间过后, JavaScript 下载并执行完毕, 此时第二行文字也显示出来;

💻 总结
--

结合上面的验证, 可以得出结论:

*   **JavaScript 的执行**会阻塞HTML的解析渲染;
*   当使用 script 标签引入外部js文件时, **Network 线程**会阻塞 HTML 的解析, 但不会阻塞 HTML 的渲染;

因此网上大部分的观点是错误的, JavaScript 执行确实会阻塞 HTML 的解析渲染, 若是以**嵌入的方式**引入 JavaScript, 不管 **script标签** 是放在 **head标签中** 或是 **body标签尾部**, 页面都会由于 JavaScript 的执行而持续白屏; 而在 **引入外部 js 文件** 的情况, 由于 **Network 线程**下载外部 js 文件仅阻塞 HTML 的解析而不会阻塞 HTML 的渲染, **script 标签**置于 **body 标签尾部**可以避免由于 js 文件下载时间太长导致的页面持续白屏!

