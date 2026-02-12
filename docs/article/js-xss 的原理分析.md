---
title: "js-xss 原理分析"
date: 2024/8/23 19:09:00
banner: /imgs/wallpaper1
---


## 什么是 js-xss？

js-xss 是一个用于对用户输入内容进行过滤，防止 XSS 攻击的 JavaScript 库。

何为 XSS 攻击，以及具体的 XSS 预防措施，可以查看美团的[技术文章](https://tech.meituan.com/2018/09/27/fe-security.html)，虽然是 2018 年的文章了，但看完还是受益匪浅。

本文将从源码出发，解析一下 js-xss 库的大致原理。

## 原理

js-xss 的仓库地址：[https://github.com/leizongmin/js-xss](https://github.com/leizongmin/js-xss)

HTML 结构大致可以分为三个部分，举个例子，`<div id="ruofee">内容</div>`可以切分为：

1. 标签：`<div></div>`；
2. 文本内容：`内容`；
3. 属性：`id="ruofee"`；

js-xss 大致原理便是将 HTML 字符串切分成这三个部分，再各自进行过滤处理，因此主要功能分为：

1. HTML 切分；
2. 文本内容过滤处理；
3. 标签解析；
4. 属性解析；

### HTML 切分

js-xss 遍历字符串，通过匹配 `<` 和 `>`，将 HTML 切分为两个部分：

1. 标签 + 属性：`<div id="ruofee">`、`</div>`；
2. 文本内容：`内容`；

核心代码如下：

```js
// lib/parser.js
function parseTag(html, onTag, escapeHtml) {
  "use strict";

  var rethtml = "";
  var lastPos = 0;
  var tagStart = false;
  var quoteStart = false;
  var currentPos = 0;
  var len = html.length;
  var currentTagName = "";
  var currentHtml = "";

  chariterator: for (currentPos = 0; currentPos < len; currentPos++) {
    var c = html.charAt(currentPos);
    if (tagStart === false) {
      if (c === "<") {
        tagStart = currentPos;
        continue;
      }
    } else {
      if (quoteStart === false) {
        if (c === "<") {
          rethtml += escapeHtml(html.slice(lastPos, currentPos));
          tagStart = currentPos;
          lastPos = currentPos;
          continue;
        }
        if (c === ">" || currentPos === len - 1) {
          rethtml += escapeHtml(html.slice(lastPos, tagStart));
          currentHtml = html.slice(tagStart, currentPos + 1);
          currentTagName = getTagName(currentHtml);
          // 这部分为标签属性的相关处理
          rethtml += onTag(
            tagStart,
            rethtml.length,
            currentTagName,
            currentHtml,
            isClosing(currentHtml)
          );
          lastPos = currentPos + 1;
          tagStart = false;
          continue;
        }
        if (c === '"' || c === "'") {
          var i = 1;
          var ic = html.charAt(currentPos - i);

          while (ic.trim() === "" || ic === "=") {
            if (ic === "=") {
              quoteStart = c;
              continue chariterator;
            }
            ic = html.charAt(currentPos - ++i);
          }
        }
      } else {
        if (c === quoteStart) {
          quoteStart = false;
          continue;
        }
      }
    }
  }
  if (lastPos < len) {
    rethtml += escapeHtml(html.slice(lastPos));
  }

  return rethtml;
}
```

> 小知识：其中 `chariterator:` 是标签语法，主要用于多个 for 循环中执行 continue 定位的，具体可以查看：[https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/label](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/label)
> 
> （实在是孤陋寡闻了，之前都没见过这个语法 =.=

### 文本内容过滤处理

js-xss 对 HTML 切分后得到的**文本内容**进行过滤处理：

```js
rethtml += escapeHtml(html.slice(lastPos, tagStart));
```

主要是对内容进行 `escapeHtml` 处理，默认的 `escapeHtml` 会将 `>` 和 `<` 替换为**转义字符**：

```js
function escapeHtml(html) {
  return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
```

### 标签解析

js-xss 对 HTML 切分后得到的**标签 + 属性**进行解析，获取标签名：

```js
function getTagName(html) {
  var i = _.spaceIndex(html);
  var tagName;
  if (i === -1) {
    tagName = html.slice(1, -1);
  } else {
    tagName = html.slice(1, i + 1);
  }
  tagName = _.trim(tagName).toLowerCase();
  if (tagName.slice(0, 1) === "/") tagName = tagName.slice(1);
  if (tagName.slice(-1) === "/") tagName = tagName.slice(0, -1);
  return tagName;
}
```

比如 `<div id="ruofee">`，解析后得出 `div`。再判断标签是否在白名单列表中，若不在列表中，则直接执行 `escapeHtml` 进行过滤处理，比如 `script` 标签便不在默认列表中，因此会被过滤得到：`&lt;script&gt;`。

若是标签为闭合标签，比如：`</div>`，则不需要进行属性处理，执行以下代码：

```js
if (info.isClosing) {
  return "</" + tag + ">";
}
```

若是标签为非闭合标签，则需要进行属性解析处理。

### 属性解析

js-xss 先提取标签中的属性部分：

```js
// lib/xss.js
function getAttrs(html) {
  var i = _.spaceIndex(html);
  if (i === -1) {
    return {
      html: "",
      closing: html[html.length - 2] === "/",
    };
  }
  html = _.trim(html.slice(i + 1, -1));
  var isClosing = html[html.length - 1] === "/";
  if (isClosing) html = _.trim(html.slice(0, -1));
  return {
    html: html,
    closing: isClosing,
  };
}
```

例如 `<div id="ruofee" class="people">` 中的属性部分则为 `id="ruofee" class="people"`。再对属性部分进行解析：

```js
// lib/parser.js
function parseAttr(html, onAttr) {
  "use strict";

  var lastPos = 0;
  var lastMarkPos = 0;
  var retAttrs = [];
  var tmpName = false;
  var len = html.length;

  function addAttr(name, value) {
    name = _.trim(name);
    name = name.replace(REGEXP_ILLEGAL_ATTR_NAME, "").toLowerCase();
    if (name.length < 1) return;
    var ret = onAttr(name, value || "");
    if (ret) retAttrs.push(ret);
  }

  // 逐个分析字符
  for (var i = 0; i < len; i++) {
    var c = html.charAt(i);
    var v, j;
    if (tmpName === false && c === "=") {
      tmpName = html.slice(lastPos, i);
      lastPos = i + 1;
      lastMarkPos = html.charAt(lastPos) === '"' || html.charAt(lastPos) === "'" ? lastPos : findNextQuotationMark(html, i + 1);
      continue;
    }
    if (tmpName !== false) {
      if (
        i === lastMarkPos
      ) {
        j = html.indexOf(c, i + 1);
        if (j === -1) {
          break;
        } else {
          v = _.trim(html.slice(lastMarkPos + 1, j));
          addAttr(tmpName, v);
          tmpName = false;
          i = j;
          lastPos = i + 1;
          continue;
        }
      }
    }
  }
  // ...省略很多代码
  return _.trim(retAttrs.join(" "));
}
```

核心代码如上，大致过程就是对字符串进行遍历，当遍历完一个属性时，就将属性的 `name` 和 `value` 传入 `onAttr` 函数中进行处理：

```js
function onAttr (name, value) {
  // call `onTagAttr()`
  var isWhiteAttr = _.indexOf(whiteAttrList, name) !== -1;
  var ret = onTagAttr(tag, name, value, isWhiteAttr);
  if (!isNull(ret)) return ret;

  if (isWhiteAttr) {
    // call `safeAttrValue()`
    value = safeAttrValue(tag, name, value, cssFilter);
    if (value) {
      return name + '=' + attributeWrapSign + value + attributeWrapSign;
    } else {
      return name;
    }
  } else {
    // call `onIgnoreTagAttr()`
    ret = onIgnoreTagAttr(tag, name, value, isWhiteAttr);
    if (!isNull(ret)) return ret;
    return;
  }
}
```

`onAttr` 函数判断属性是否在白名单中，若是不存在则直接忽略（可以通过设置 `onIgnoreTagAttr` API 进行保留），若是存在则进行 `safeAttrValue` 处理，最终返回结果。

默认的 `safeAttrValue` 函数会做一些安全的判断，举个例子，当属性为 `href` 或是 `src` 时，会判断属性值是否符合规范：

```js
!(
    value.substr(0, 7) === "http://" ||
    value.substr(0, 8) === "https://" ||
    value.substr(0, 7) === "mailto:" ||
    value.substr(0, 4) === "tel:" ||
    value.substr(0, 11) === "data:image/" ||
    value.substr(0, 6) === "ftp://" ||
    value.substr(0, 2) === "./" ||
    value.substr(0, 3) === "../" ||
    value[0] === "#" ||
    value[0] === "/"
)
```

最终将符合要求的属性值拼接成字符串并返回结果。

## 总结

js-xss 是一个精简的 XSS 过滤库，使用字符串遍历解析的方式进行 XSS 过滤，和**正则**的过滤方式对比，性能更占优势。
