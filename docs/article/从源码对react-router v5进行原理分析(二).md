---
title: "从源码对react-router v5进行原理分析(二)"
date: 2020/9/9 00:00:00
banner: /imgs/react
---



## 🤔 写在最前

在看这篇文章之前, 先对 react-router 和 react-router-dom 进行简单的了解;

首先来看官方对两者的描述

> The core of React Router (react-router)
>
> DOM bindings for React Router (react-router-dom)

react-router 是 React Router 的**核心**, 实现了**路由的核心功能**;

react-router-dom 是 React Router 的 DOM 绑定, 提供了浏览器环境下的功能, 比如 `<Link>`, `<BrowserRouter>` 等组件;

可以理解为:

 **react-router-dom 基于 react-router**, 所以安装依赖的时候只需要安装 react-router-dom 就好了;

## 🧗 react-router 结构分析

> 此篇文章默认读者已经掌握 react-router 的 api, 关于 api 的作用就不再一一阐述了;

根据官方文档, 我们使用 react-router-dom 进行路由管理, 首先我们需要选择一个路由模式:

- BrowserRouter: history 模式;
- HashRouter: hash 模式;
- MemoryRouter: 在没有 url 的情况下, 使用 Memory 对路由状态进行保存, 常见在 React Native 中使用, 这里不进行讨论;

history 模式和 hash 模式的区别就自行百度啦, 这里就不讲了 -. -

**以下都以 create-react-app 为例**, 选择 history 模式, 也就是在最外层使用 `<BrowserRouter>` 组件:

**index.tsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);
```

然后在被 `<BrowserHistory>` 组件包裹的组件中可以使用 `<Route>` 进行路由划分:

**App.tsx**

```jsx
import React from 'react';
import { Route } from 'react-router-dom';

const Page1.React.FC = props => <div>Page1</div>;
const Page2.React.FC = props => <div>Page2</div>;

function App() {
  return (
    <div className="App">
      <Route path="/page1" component={Page1}></Route>
      <Route path="/page2" component={Page2}></Route>
    </div>
  );
}

export default App;
```

以上就是 react-router 的大概结构, 下面将对 react-router-dom 的组件进行源码分析;

## ⚙️ BrowserHistory

`<BrowserHistory>` 和 `<HashHistory>` 的代码结构和逻辑相似, 这里只对 `<BrowserHistory>` 作分析;

以下是 `<BrowserHistory>` 核心代码逻辑分析:

#### 先看看 `<BrowserHistory>` 的 prop types

```jsx
import PropTypes from "prop-types";

class BrowserRouter extends React.Component {
  // 此处代码略去
}

BrowserRouter.propTypes = {
  basename: PropTypes.string,
  children: PropTypes.node,
  forceRefresh: PropTypes.bool,
  getUserConfirmation: PropTypes.func,
  keyLength: PropTypes.number
};
```

#### `<BrowserHistory>` 的核心逻辑

使用 history 的 `createBrowserHistory` 方法, 将 props 作为参数, 创建一个 history 实例, 并将 `history` 传入 `Router` 组件中:

```jsx
import { Router } from "react-router";
import { createBrowserHistory as createHistory } from "history";

class BrowserRouter extends React.Component {
  history = createHistory(this.props);

	render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}
```

从源码中可以看出, `<BrowserHistory> `是一个注入了 history 的 `<Router>` 组件; 接着我们看一下 `<Router>`:

## ⚙️ Router

react-router-dom中的 `<Router>` 实际上就是 react-router 的 `Router`, 此处直接对 react-router 的 `<Router>` 进行源码分析:

#### 先看看 `<Router>` 的 prop types

```jsx
import PropTypes from "prop-types";

Router.propTypes = {
  children: PropTypes.node,
  history: PropTypes.object.isRequired,
  staticContext: PropTypes.object
};
```

此处的 `staticContext` 是 `<staticRouter>` 中传入 `<Router>` 的属性, 这里不做分析;

#### `<Router>` 的路由渲染逻辑

`<Router>` 的**构造函数**中, 声明 `this.state.location`, 并注册监听函数, 在 `history.push` 触发时更改 `this.state.location;` 并将 `history.listen` 的返回值赋值给 `this.unlisten`:

```jsx
this.state = {
  location: props.history.location
};

this._isMounted = false;
this._pendingLocation = null;

this.unlisten = props.history.listen(location => {
  if (this._isMounted) {
    this.setState({ location });
  } else {
    this._pendingLocation = location;
  }
});
```

之所以在构造函数中就注册监听函数, 而不是在 `componentDidMount` 中进行监听, 官方是这么解释的:

> This is a bit of a hack. We have to start listening for location changes here in the constructor in case there are any `<Redirect>`s on the initial render. If there are, they will replace/push when they mount and since cDM fires in children before parents, we may get a new location before the `<Router>` is mounted.

大概意思就是, 因为子组件会比父组件更早渲染完成, 以及 `<Redirect>` 的存在, 若是在 `<Router>` 的 `componentDidMount` 生命周期中对 `history.location` 进行监听, 则有可能在监听事件注册之前, `history.location` 已经由于 `<Redirect>` 发生了多次改变, 因此我们需要在 `<Router>` 的 `constructor` 中就注册监听事件;

接下来, 在 `componentWillUnmount` 生命周期中进行移除监听函数操作:

```jsx
componentWillUnmount() {
  if (this.unlisten) {
    this.unlisten();
    this._isMounted = false;
    this._pendingLocation = null;
  }
}
```

#### react-router 中使用 `context` 进行组件通信

 在 `<Router>` 中, 使用 `<RouterContext.Provider>` 进行路由数据传递( history, location, match 以及 staticContext ), 使用 `<HistoryContext.Provider>` 进行 history 数据传递, 子组件( `<Route>` 或是 `<Redirect>` 等)可以通过 `<RouterContext.Consumer>` 以及 `<HistoryContext.Consumer>` 对上层数据进行接收; `HistoryContext` 和 `RouterContext` 都是使用 `mini-create-react-context` 创建的 `context`, 而 `mini-create-react-context` 工具库定义如下:

> (A smaller) Polyfill for the [React context API](https://github.com/reactjs/rfcs/pull/2)

`mini-create-react-context` 是 React context API 的 Polyfill, 因此可以直接将 `mini-create-react-context` 等同于 React 的 context;

```jsx
import React from "react";
import HistoryContext from "./HistoryContext.js";
import RouterContext from "./RouterContext.js";

class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
  }

  render() {
    return (
      <RouterContext.Provider
        value={{
          history: this.props.history,
          location: this.state.location,
          match: Router.computeRootMatch(this.state.location.pathname),
          staticContext: this.props.staticContext
        }}
        >
        <HistoryContext.Provider
          children={this.props.children || null}
          value={this.props.history}
        />
      </RouterContext.Provider>
    );
  }
}
```

## ⚙️ Switch

> `<Switch>` is unique in that it renders a route *exclusively*

**即使有多个路由组件成功匹配, `Switch` 也只展示一个路由**

`<Switch> `必须作为 `<Router>` 的子组件进行使用, 若是脱离 `<Router>`, 则会报错:

```jsx
"You should not use <Switch> outside a <Router>"
```

#### 先看看 `<Switch>` 中传入的 prop types

```jsx
import PropTypes from "prop-types";

Switch.propTypes = {
  children: PropTypes.node,
  location: PropTypes.object
};
```

#### `<Switch> `的渲染逻辑

`<Switch>` 使用 `<RouterContext.Consumer>` 进行路由数据接收; `<Switch> `对路由组件进行顺序匹配, 使用 `React.Children.forEach` 对 `<Switch>` 的子组件进行遍历, 每次遍历逻辑如下:

**使用 `React.isValidElement` 判断子组件是否为有效的 element:**

- 有效: 则进入**下个步骤**;
- 无效: 结束此轮循环, 进行下一轮循环;

**声明 `path:`**

```javascript
const path = child.props.path || child.props.from;
```

注:  `<Route>` 使用 **path** 进行路由地址声明, `<Redirect> `使用 **from** 进行重定向来源地址声明;

接着判断 **path** 是否存在:

- 存在 path: 表示子组件存在路由映射关系, 使用 **matchPath** 对 path 进行匹配, 判断路由组件的路径与当前 `location.pathname` 是否匹配:
  - 若是匹配, 则对子组件进行渲染, 并将 **matchPath** 返回的值作为 `computedMatch` 传递到子组件中, 并且不再对其他组件进行渲染;
  - 若是不匹配, 则直接进行下次循环; 注意: `location `可以是外部传入的 `props.location`, 默认为 `context.location`;
- 不存在 path: 表示子组件不存在路由映射关系, 直接渲染该子组件, 并将 `context.match` 作为 `computedMatch` 传入子组件中;

**matchPath 是 react-router 的一个公共 api, 源码中注释对 `matchPath` 的介绍如下:**

> Public API for matching a URL pathname to a path.

主要用于匹配路由, 匹配成功则返回一个 `match` 对象, 若是匹配失败, 则返回 `null`;

```jsx
import React from 'react';
import RouterContext from "./RouterContext.js";
import matchPath from "./matchPath.js";

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Switch> outside a <Router>");

          const location = this.props.location || context.location;

          let element, match;

          // We use React.Children.forEach instead of React.Children.toArray().find()
          // here because toArray adds keys to all child elements and we do not want
          // to trigger an unmount/remount for two <Route>s that render the same
          // component at different URLs.
          React.Children.forEach(this.props.children, child => {
            if (match == null && React.isValidElement(child)) {
              element = child;

              const path = child.props.path || child.props.from;

              match = path
                ? matchPath(location.pathname, { ...child.props, path })
                : context.match;
            }
          });

          return match
            ? React.cloneElement(element, { location, computedMatch: match })
            : null;
        }}
      </RouterContext.Consumer>
    );
  }
}
```

## ⚙️ Route

> The Route component is perhaps the most important component in React Router to understand and learn to use well. Its most basic responsibility is to render some UI when its `path` matches the current URL

`<Route>`可能是 react-router 中**最重要的组件**, 它最基本的职责是在其路径与当前URL匹配时呈现对应的 UI 组件;

与其他非 `<Router>` 组件一样, 若是不被 `<RouterContext.Provider>` 包裹, 则会报错:

```jsx
"You should not use <Switch> outside a <Router>"
```

#### 先看看 `<Route>` 的 prop types:

```jsx
import PropTypes from "prop-types";

Route.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  component: (props, propName) => {
    if (props[propName] && !isValidElementType(props[propName])) {
      return new Error(
        `Invalid prop 'component' supplied to 'Route': the prop is not a valid React component`
      );
    }
  },
  exact: PropTypes.bool,
  location: PropTypes.object,
  path: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  render: PropTypes.func,
  sensitive: PropTypes.bool,
  strict: PropTypes.bool
};
```

#### `<Route> `的渲染逻辑

与其它路由组件一样, 使用 `<RouterContext.Consumer>` 接收全局路由信息; `<Route> `的逻辑比较简单, 主要判断 `path` 与当前路由是否匹配, 若是匹配则进行渲染对应路由组件, 若是不匹配则不进行渲染, 核心代码如下:

```jsx
const match = this.props.computedMatch
  ? this.props.computedMatch // <Switch> already computed the match for us
  : this.props.path
  ? matchPath(location.pathname, this.props)
  : context.match;

...

<RouterContext.Provider value={props}>
  {
    props.match
    ? children
      ? typeof children === "function"
    	  ? __DEV__
	    	  ? evalChildrenDev(children, props, this.props.path)
		    	: children(props)
	    	: children
  	  : component
    	  ? React.createElement(component, props)
		    : render
    		  ? render(props)
			    : null
    : typeof children === "function"
      ? __DEV__
    	  ? evalChildrenDev(children, props, this.props.path)
		    : children(props)
    	: null
  }
</RouterContext.Provider>
```

注: 根据上面代码, 不论 `props.match` 是否为true, 当 `<Route>` 的 `children` 为函数时都会进行渲染;

## 💻 总结

本篇文章对react-router的部分核心组件进行源码解读; react-router 使用 `<Context.Provider>` 向路由树传递路由信息, `<Route> `等组件通过 `<Context.Consumer>` 接收路由信息, 匹配路径并渲染路由组件, 以及与上篇文章讲到的 history 的紧密配合, 才让 react-router 如此优秀; 下一篇文章将对剩余组件以及 react-router 的 `hooks` 进行源码解读!

