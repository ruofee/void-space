---
title: "探究: 为什么CSS要在head标签中引入"
date: 2020/10/29 00:00:00
banner: /imgs/wallpaper1
---

## 开头

从开始学习前端时，就一直有着这么一条规则：**CSS要放在Head标签中引入**。

但至于为什么要这么做呢？却找不到一个令人觉得满意的回答，因此这篇文章我们从**性能以及交互方面**来探究一下这个问题。

## 准备

Chrome浏览器的devtool配置有**Performance**功能，可以对网页进行性能分析，并且会将网页解析渲染流程以图形展示出来，这对我们的分析有极大的帮助。

使用方法：**鼠标右键+检查** or **F12**，然后切换到**Performance**一栏，点击左上角的刷新按钮便可以对页面进行分析。

![如何使用Performance工具进行网页分析](https://pic2.zhimg.com/80/v2-945b8b0f0c817e69e02fb3bdf0a1a601_1440w.jpg)

## 开始探究

先找一个外部的css文件：[https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/1.4.0/css/bootstrap.css](https://link.zhihu.com/?target=https%3A//cdn.bootcdn.net/ajax/libs/twitter-bootstrap/1.4.0/css/bootstrap.css)

这是一个bootstrap.css的cdn文件，分别放置在**head标签**中和**body标签尾部：**

#### 1. 放置于head标签中：

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/1.4.0/css/bootstrap.css" rel="stylesheet">
    <p>你好, 小枫</p>
  </body>
</html>
```

浏览器先进行HTML解析工作，生成DOM树；

![](https://pic4.zhimg.com/80/v2-fa7d84a01d67b08807c672dffc7e9f7b_1440w.jpg)

浏览器调用Network线程下载bootstrap.css文件，此时HTML未进行渲染步骤；等到css文件下载完毕之后，开始解析css样式，生成CSSOM树；之后再结合DOM树和CSSOM树生成Layout树（以前称为Render树），开始计算布局，进行绘制步骤（生成Paint树，细节不探究），呈现页面（后面还有一步**Composite**，这里不作探究）。

![](https://pic1.zhimg.com/80/v2-a396667f55533bb216a9dc52641ae168_1440w.jpg)

从上面的步骤可以看出，当外部css在head标签中引入时，HTML的解析步骤正常执行，但渲染步骤会等待css文件下载完毕并解析成功之后再进行，所以可以得出结论：

**当css在head标签中引入时，阻塞HTML的渲染。**

而页面的呈现过程应该如下：**页面呈现一段时间的白屏（白屏时间取决于css文件的下载速度），之后呈现出带有css样式的页面**。为了更能直观地呈现这个过程，我们接着使用万能的Chrome devtool进行弱网环境的模拟：在**Network**中将网络速度设置为**Slow 3G**。

![](https://pic4.zhimg.com/80/v2-aacc7c6626e6e2255ca8acda9844e9ff_1440w.jpg)

刷新页面观察页面; 页面出现长时间白屏状态：

![](https://pic4.zhimg.com/80/v2-d5ba8fd9c684d07266306d548886d49b_1440w.jpg)

一段时间过后，出现带有css样式的文本信息，表示页面渲染完毕：

![](https://pic4.zhimg.com/80/v2-cac7c0b2238cc91ed23927fce7e06ecf_1440w.jpg)

#### 2. 放置于body标签中（这里先放在尾部）：

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <p>你好, 小枫</p>
    <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/1.4.0/css/bootstrap.css" rel="stylesheet">
  </body>
</html>
```

在解析到link标签之前，浏览器自上而下解析HTML生成DOM树，然后与CSSOM树（并非外部引入的CSS）结合生成了Layout树，计算布局之后进行绘制，将页面渲染到浏览器中；

![](https://pic3.zhimg.com/80/v2-80d14441c76217e7eba5da06d11e8dde_1440w.jpg)

浏览器解析到link标签，下载外部css文件；下载完之后开始解析css样式生成CSSOM树，并重新解析HTML生成DOM树；将DOM树和CSSOM树结合生成Layout树，进行计算布局和Paint，完成页面的渲染，这个过程称为**reflow**，也就是回流，是一种消耗性能的现象；

![](https://pic2.zhimg.com/80/v2-32e3a52abd3ece9250917a305a804699_1440w.jpg)

从上面的步骤可以看出，**当外部css在body标签中引入时，不会阻塞HTML的渲染**，所以页面呈现过程应该如下：首先，在css加载完成之前，文本先渲染完成，但未带有css样式，俗称“裸奔”；css加载完成之后，页面中文本样式发生改变；因此会出现“闪一下”甚至长时间“裸奔”的现象，因为页面样式发生了变化：“裸奔”到“有样式”；如上图，页面存在长时间Layout shift现象，这里科普一下**Layout shift：**

> CLS，全称**是**Cumulative**Layout Shift**，中文名**是**累计布局偏移，**是**Google Search Console 额一个核心网页指标，**是**指网页布局在加载期间的偏移量。 得分范围**是**0–1，其中0 表示没有偏移，1 表示最大偏移。

在页面呈现之后，样式发生了变化，导致页面布局与原先布局有了偏移，这是一种非常不好的交互体验，这里附上一篇CLS的文章：[页面视觉稳定性之CLS](https://link.zhihu.com/?target=https%3A//segmentfault.com/a/1190000023732717)，有兴趣可以看看。

我们接着进行**弱网模拟**来更加直观地展示页面的变化：

首先, css未加载完成前，页面出现“裸奔”现象：

![](https://pic1.zhimg.com/80/v2-e7d59c7f3b359caf3d83da25358c2ccc_1440w.jpg)

css加载完成之后，页面重新渲染，文本样式发生变化（font-size有明显的变化）：

![](https://pic2.zhimg.com/80/v2-332d17c7adcca60e24bc0458ab1fce5d_1440w.jpg)

从上面的探究可以知道：css在body中引入时，不会阻塞页面的渲染；**那么会阻塞页面解析吗？**我们接着探究这个问题。

#### 3. 放置于body标签中（这里放在中间）：

```html
<!doctype html>
<html>
  <head>
    <title>钻研精神</title>
  </head>
  <body>
    <p>你好, 小枫</p>
    <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/1.4.0/css/bootstrap.css" rel="stylesheet">
    <p>你好, 小枫</p>
  </body>
</html>
```

使用弱网对页面呈现过程进行分析：

首先, 在css加载未完成时，页面仅展示第一行文本，并且呈“裸奔”状态；

![](https://pic3.zhimg.com/80/v2-6bff90d14527c66a609294aa8812abb2_1440w.jpg)

css加载完毕，页面重新渲染，展示所有文本，并且带有css样式；

![](https://pic1.zhimg.com/80/v2-c93f01c3d90daed2f63989f8d68cadec_1440w.jpg)

可以看出，css在body中引入时，阻塞了HTML的解析，因此在下载外部css文件的过程中，第二行文本信息未能解析渲染出来，所以我们得出结论：

**当css在body标签中引入时，阻塞HTML的解析，但不阻塞HTML的渲染。**

## 总结

1.   **css在head标签中引入时，会阻塞HTML的渲染**，因此页面只有等到css下载并解析完成之后才会进行渲染，所以最终出现的页面是**带有完整样式**的；**这个过程只发生一次解析渲染**：_HTML解析生成DOM树+CSS解析生成CSSOM树+结合生成Layout树+计算布局+绘制_；但也存在缺点：**在css文件下载比较慢时，会出现长时间白屏**，但与出现“裸奔”页面相比，**白屏似乎在体验上显得更加友好**。

2.   **css在body标签中引入时，会阻塞HTML的解析，但不阻塞HTML的渲染**，因此页面在css下载完成之前会将link标签前的HTML先进行解析渲染，并展现在页面，但由于没有css样式，页面会出现“裸奔”现象；等到css下载解析完成之后，页面重新解析渲染，展现出带有样式的HTML，这个过程会导致**reflow或是repaint**；从用户体验方面看：**css在body标签中引入时**，虽然页面可以先展现出来，但由于“裸奔”现象，会导致极差的用户体验；从性能方面看，与**css在head标签中引入**相比，页面在css加载完成后需要**重新解析渲染**，这个过程带来了极大的性能损耗。