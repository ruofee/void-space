---
title: "Husky 和 Git Hooks"
date: 2022/12/2
banner: /imgs/code
---

> 注意，文章中使用的 Husky 版本为 8.0.2 版本

## 什么是 Husky

在了解 Husky 之前，我们需要先了解一下 Git Hooks，官网对于 Git Hooks 的描述如下：

Hooks are programs you can place in a hooks directory to trigger actions at certain points in git’s execution.

大致意思是，Git Hooks 提供了许多的钩子，每个钩子对应一个生命周期，会在特定的时点触发。比如，我们可以利用 pre-commit hook 在代码提交之前执行脚本：

修改 .git/hooks 路径下的 pre-commit 文件：

```bash
echo "Hello world"
```

我们可以利用 Git Hooks 做很多事情，比如提交代码前的规范校验，以及单元测试的执行，但 Git Hooks 也存在无法共享的问题：.git 目录不会被上传到 Git 仓库，因此你的 Git Hooks 只能在本地生效。

而 Husky 的出现简化了 Git Hooks 的使用，并解决了 Git Hooks 无法被共享的问题！

## Husky 的实现原理

为了更加透彻地了解 Husky 到底做了什么，我们重新安装一遍 Husky：

根据官方文档中的推荐，我们执行以下命令进行初始化：

```bash
npx husky-init && npm install
```

执行完以上命令后，项目出现了以下的几个变化：

package.json 发生了变动，新增了 husky 依赖，以及一段 prepare 脚本：

```base
+  "devDependencies": {
+    "husky": "^8.0.2"
+  },
+  "scripts": {
+    "prepare": "husky install"
+  }
```

项目中新增了 .husky 文件夹，目录结构如下：

```
.husky
|--pre-commit
|--_
  |--husky.sh
```

此时执行 `git commit` 进行代码提交，pre-commit 脚本在代码提交之前执行了，也就是说，Git Hooks 被触发了，此时我们进入 .git/hooks 文件中，发现并没有 pre-commit hook。

我们接着将 .husky 文件夹以及 package.json 的改动提交到 Git 服务器，新建一个文件夹并拉取代码库，执行 `npm install` 安装依赖，再随便修改代码内容，执行 `git commit` 进行代码提交，此时 pre-commit 脚本在代码提交之前执行了，这说明我们的 hooks 能够进行共享了！

为了搞清楚发生了什么，我们先从 `npx husky-init` 入手分析，也就是 husky-init：

此处就不展示源码了，感兴趣的朋友可以直接访问以下的地址进行阅读：https://github.com/typicode/husky-init

husky-init 脚本的作用如下：

1. 在 package.json 中新增 husky 依赖：`"husky": "^8.0.0"`，并在 package.json 的 scripts 中新增脚本：`"prepare": "husky install"`；
2. 生成 .husky/_/.husky.sh 文件，以及一个简单的 hooks demo（pre-commit）；
3. 执行脚本：`git config core.hooksPath .husky`；

其中 .husky.sh 对执行没有实质性的作用，可以忽略。核心在于第三步，`git config core.hooksPath .husky` 的作用是将 Git Hooks 的文件夹修改成 .husky 文件夹，因此 ./husky/pre-commit 文件将会被当成 pre-commit hook，此时执行 `git commit` 将会触发 Git Hooks！

![初始化步骤](/imgs/1669966201265.jpg)

但仍然存在一个问题，当项目被重新拉取到本地时，此时 husky 设置的 Git Hooks 应该如何才能生效呢？我们不会再重新执行一遍 `npx husky-init`，更不会手动去执行 `git config core.hooksPath .husky`。此时，prepare 脚本发挥出它应有的作用！husky-init 在 package.json 的 scripts 中新增脚本：

```bash
+  "scripts": {
+    "prepare": "husky install"
+  }
```

prepare 将会在执行完 `npm install` 之后触发，以下是 npm install 的生命周期顺序：

- preinstall
- install
- postinstall
- prepublish
- preprepare
- prepare
- postprepare

而 `husky install` 做的事情和 husky-init 的第二步和第三步一致，当然，由于此时已经存在 .husky 文件夹了，只执行 `git config core.hooksPath .husky`。

因此，在重新拉取项目之后，我们一旦执行安装依赖的操作，便会将 .husky 文件夹作为 Git Hooks 文件夹~ 完美实现 Git Hooks 的共享。

![安装依赖](/imgs/1669966329813.jpg)

## 总结

以上是实现 Git Hooks 共享的一种思路，主要是利用 package-script 实现安装项目依赖时触发脚本，执行 `git config core.hooksPath new_path` 将 Git Hooks 的目标文件夹修改成其他文件夹。

除此之外，还有其他的 Git Hooks 共享思路，比如将 Git Hooks 存放在其他文件夹中，再利用 package-script 触发脚本，在每次安装依赖时将这个文件夹复制到 .git/hooks 中，老版本的 Husky 大概就是这个思路。
