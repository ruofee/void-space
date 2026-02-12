---
title: "从源码对react-router v5进行原理分析(一)"
date: 2020/8/31 00:00:00
banner: /imgs/react
---



## 😕 何为 react-router

> Declarative routing for [React](https://facebook.github.io/react)
>
> from [react-router 代码仓库](https://github.com/ReactTraining/react-router)

react-router 的 Github 仓库中的描述写道: "为 React 声明路由";

> Components are the heart of React's powerful, declarative programming model. React Router is a collection of navigational components that compose declaratively with your application. Whether you want to have bookmarkable URLs for your web app or a composable way to navigate in React Native, React Router works wherever React is rendering--so take your pick!
>
> 来自 [react-router官方文档](https://reactrouter.com/)

官方文档中对 react-router 的介绍是: 组件是 React 强大的声明式编程模型的核心; React Router 是一组以声明方式与你的应用程序组合起来的导航组件集合, 不管你是否想要为你的 web 应用添加可保存为书签的 URL, 或是在 React Native 中添加一个可组合的导航方式, React Router 都能在 React 渲染的地方工作, 因此你可以选择它!

简而言之, react-router 为 React 提供了路由能力, 不管是 web 应用或是 React Native 应用, 都可以使用 react-router 进行路由管理;

**注意: 这里只对 web 应用的路由原理进行分析!**

## 🧗 react-router 路由跳转原理

#### 源码分析react-router路由跳转

在引入了 react-router 的 React 应用中, 我们通常使用 react-router-dom 提供的 `Link` 组件进行路由跳转; 在 `Link` 组件中, 路由跳转相关代码如下:

```jsx
const method = replace ? history.replace : history.push;

method(location);
```

`replace` 表示是否替换当前路由, `location` 表示跳转的路由;

可以看出,  react-router 实现路由跳转主要使用了 `history.replace` 以及 `history.push`, 往上层探究后发现, 这里的 `history` 是 `react-router` 开发者实现的一个库, 对 `window.history` 进行封装, 利用 `window.history.pushState` 和 `window.history.replaceState` 两个 api, 实现页面可以在不重新加载的情况下进行 url 跳转;

#### 模拟react-router路由跳转

下面使用 create-react-app (react ^16.13.1)写了一个小栗子🌰, 简单实现了一下 history 路由跳转的原理:

**History.ts**

```typescript
interface Listener {
  (url: string): void
};

interface History {
  listeners: Array<Listener>,
  listen: (fn: Listener) => (() => void),
  push: (url: string, state?: { [propsName: string]: any } | null) => void
};

const createHistory = (): History => {
  const globalHistory = window.history;
  const _history: History = {
    listeners: [],
    listen(fn) {
      this.listeners.push(fn);
      return () => {
        let i = this.listeners.findIndex((listener, index) => listener === fn);

        if (i !== -1) {
          this.listeners.splice(i, 1);
        }
      };
    },
    push(url, state) {
      globalHistory.pushState(state, '', url);
      this.listeners.forEach(listener => {
        listener(url);
      });
    }
  };
  return _history;
};

export default createHistory;
```

上面是一个简单的 history 库, 只实现了 `push` 的功能, 主要分为三个部分:

1. **`listeners`**: 数组类型, 当 `history.push` 调用时, 依次执行 `listeners` 中的函数;
2. **`listen`**: 函数类型, 接受一个函数 `listener` 作参数, 并将 `listener` 加到 `listeners` 中, 等待 `history.push` 执行; 返回一个函数 `unlisten`, 执行时将当前的`listener` 从 `listeners` 中移除;
3. **`push`**: 函数类型, 接收一个 `url` 作为参数, 执行 `globalHistory.pushState` (此处的 `globalHistory` 为 `window.history` ), 并依次执行 `listeners` 中所有函数;

从上面代码可以看出, history 库主要用了 **订阅-发布 **的思想;

**App.ts**

```jsx
import React, { useEffect, useState } from 'react';
import createHistory from './history';

const history = createHistory();

const Page1: React.FC = props => <div>Page1</div>;
const Page2: React.FC = props => <div>Page2</div>;

const App: React.FC = props => {
  const [location, setLocation] = useState<string>(window.location.pathname);
  const pushHistory = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, url: string): void => {
    event.preventDefault();
    history.push(url);
  };
  const renderComponent = (): ReactElement => {
    switch (location) {
      case '/page1': {
        return <Page1 />;
      }
      case '/page2': {
        return <Page2 />;
      }
      default: {
        return <Page1 />;
      }
    }
  };

  useEffect(() => {
    // 页面首次渲染完成后执行
    history.listen(url => {
      setLocation(url);
    });
  }, []);

  return (
    <div>
      <div className="nav">
        <a href="/page1" onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => pushHistory(event, '/page1')}>page1</a>
        <a href="/page2" onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => pushHistory(event, '/page2')}>page2</a>
      </div>
      <div>{renderComponent()}</div>
    </div>
  );
};

export default App;
```

上面的代码生成的页面结构分为:

- 导航部分: 阻止超链接的默认事件, 避免刷新页面, 并绑定新的点击事件, 触发 `history.push` 进行路由跳转;
- 路由组件渲染部分: 通过 `location` 变量渲染对应的路由组件;

代码逻辑结构如下:

1. 创建一个 `history` 实例;
2. 执行 `renderComponent` 函数, 渲染出当前路由对应组件;
3. `App` 首次渲染完成时使用 `history.listen` 注册一个监听事件, 事件调用时使用 `setLocation` 将 `location` 设置为 `url` 参数; 并将 `history.listen` 返回的函数赋值给变量 `unlisten`;
4. 点击超链接, 执行 `history.push` 跳转路由, 执行 `history.listen` 中的回调函数, 执行 `setLocation` 修改 `location` 变量的值, 导致组件重新渲染, `renderComponent` 函数重新执行, 路由组件成功渲染;
5. 退出页面时, 执行 `unlisten` 函数, 销毁当前监听事件;

## 💻 总结

这篇文章主要是对 react-router 中路由跳转原理的分析, 并自行实现了一个简单的 history 库, 当然真正的 history 库更为复杂, 这里并不深究;

如果喜欢请点个赞吧, 下一篇文章将会接着对 react-router 的组件进行源码分析, 冲!