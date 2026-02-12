---
title: "从源码对react-router v5进行原理分析(三)"
date: 2020/9/13 00:00:00
banner: /imgs/react
---



本篇文章将对 react-router 中剩余的组件进行源码分析

## ⚙️ `<Redirect>`

和其他的路由组件一样, `<Redirect> `使用 `<RouterContext.Consumer>` 接收路由数据;

#### 首先看看 `<Redirect>` 的 prop types

```js
Redirect.propTypes = {
  push: PropTypes.bool,
  from: PropTypes.string,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
};
```

#### `<Redirect>` 的渲染逻辑

`<Redirect>` 通过传入的 `push` 属性确定跳转方式: push 或是 replace;

```js
const method = push ? history.push : history.replace;
```

接着通过执行 `createLocation` 函数确定跳转的 `location`; 这里的  `createLocation`为 history 库的方法, 根据传入的参数创建一个 `location` 对象:

```js
// to 为 props.to, computedMatch 为 props.computedMatch
const location = createLocation(
  computedMatch
  ? typeof to === "string"
  ? generatePath(to, computedMatch.params)
  : {
    ...to,
    pathname: generatePath(to.pathname, computedMatch.params)
  }
  : to
);
```

注:

1. 当 `<Redirect>` 作为 `<Switch>` 的子组件并被匹配时, `<Switch>` 将会将匹配计算得出的 `computedMatch` 传给 `<Redirect>`; 关于 `computedMatch`, 详细可以查看上一篇文章;
2. `generatePath` 是 react-router 提供的一个api, 用于将 path 和 parameters 组合生成一个 pathname;

接下来就是 `<Redirect>` 跳转逻辑实现:

```js
<Lifecycle
  onMount={() => {
    method(location);
  }}
  onUpdate={(self, prevProps) => {
    const prevLocation = createLocation(prevProps.to);
    if (
      !locationsAreEqual(prevLocation, {
        ...location,
        key: prevLocation.key
      })
    ) {
      method(location);
    }
  }}
  to={to}
/>
```

`<Lifecycle>` 的组件结构非常简单, 支持传入 `onMount`, `onUpdate` 以及 `onUnmount` 三个方法, 分别代表着 `componentDidMount`, `componentDidUpdate` 以及 `componentWillUnmount`;

因此 `<Redirect>` 使用 `Lifecycle` 触发的动作如下:

1. `<Redirect>` 在 `componentDidMount` 生命周期中进行 **push/replace** 跳转;
2. 在 `componentDidUpdate` 生命周期中使用 history 库的 `locationsAreEqual` 方法, 比较上一个 location 和新的 location 是否相同, 若是 location 不相同, 则执行 **push/replace** 跳转事件;

```js
// LifeCycle.js
import React from "react";

class Lifecycle extends React.Component {
  componentDidMount() {
    if (this.props.onMount) this.props.onMount.call(this, this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.onUpdate) this.props.onUpdate.call(this, this, prevProps);
  }

  componentWillUnmount() {
    if (this.props.onUnmount) this.props.onUnmount.call(this, this);
  }

  render() {
    return null;
  }
}

export default Lifecycle;
```

## ⚙️ `<Link>`

`<Link>` 实现了 react-router 中路由跳转;

#### 先看看 `<Link>` 的 prop types

```js
const toType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.object,
  PropTypes.func
]);
const refType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.func,
  PropTypes.shape({ current: PropTypes.any })
]);

Link.displayName = "Link";

Link.propTypes = {
  innerRef: refType,
  onClick: PropTypes.func,
  replace: PropTypes.bool,
  target: PropTypes.string,
  to: toType.isRequired
};
```

实际上 `<Link>` 还有一个 prop: `component`, 但不清楚这里为什么不对 `component` 进行类型声明;

#### `<Link>` 的渲染逻辑

`<Link>` 使用 `<RouterContext.Consumer>` 接收路由信息;

`<Link>` 通过对 `props.to` 进行处理, 得出 `href` 属性, 声明 `props` 对象:

```js
(
	{
    component = LinkAnchor,
    replace,
    to,
    innerRef, // TODO: deprecate
    ...rest
  }
) => {
	//  ... 通过处理props.to得出href
  const props = {
    ...rest,
    href,
    navigate() {
      const location = resolveToLocation(to, context.location);
      const method = replace ? history.replace : history.push;

      method(location);
    }
  };
  
  // ...
}
```

并将上面得出的`props`注入`component`中:

```js
return React.createElement(component, props);
```

从源码可以看到, 此处的 `component` 默认为 `LinkAnchor`, 因此我们来阅读以下`<LinkAnchor>` 的源码:

`LinkAnchor` 的props结构如下:

```js
{
  innerRef, // TODO: deprecate
  navigate,
  onClick,
  ...rest
}
```

**主要是 `navigate` 以及 `onClick`**:

`navigate` 从 `<Link>` 源码中可以看到, 主要是通过传入的 `replace` 属性判断跳转类型, 根据对应跳转类型选择 `history.replace` 或是 `history.push` 进行路由跳转:

```js
navigate() {
  const location = resolveToLocation(to, context.location);
  const method = replace ? history.replace : history.push;

  method(location);
}
```

`onClick` 更好理解, 是 `<Link>` 组件的点击事件声明;

`<LinkAnchor>` 通过传入的 props 生成了一个 `props`, 并返回一个注入了 `props` 的超链接:

```js
let props = {
	// ...
};
return <a {...props} />;
```

主要功能实现在于超链接的 `onClick`, 点击事件中首先判断是否存在 `props.onClick`, 存在的话则立即执行; 接着进行**是否执行 `props.navigate`** 的判断:

是否进行跳转需要满足以下所有条件:

- `event.button === 0`: 点击事件为鼠标左键;

- `!target || target === "_self"`: `_target` 不存在, 或者 `_target` 为 `_self`;

- `!isModifiedEvent(event)`: 点击事件发生时未有其他按键同时按住;

  注: `isModifiedEvent` 用于判断点击事件发生时是否有其他按键同时按住;

```js
if (
  !event.defaultPrevented && // onClick prevented default
  event.button === 0 && // ignore everything but left clicks
  (!target || target === "_self") && // let browser handle "target=_blank" etc.
  !isModifiedEvent(event) // ignore clicks with modifier keys
) {
  // ...
}
```

满足以上所有条件时执行以下代码:

```js
event.preventDefault();
navigate();
```

`event.preventDefault()` 阻止超链接默认事件, 避免点击 `<Link>` 后重新刷新页面;

`navigate()` 使用 `history.push` 或 `history.replace` 进行路由跳转, 并触发 `<Router>` 中声明的 `history` 监听事件, 重新渲染路由组件!

## ⚙️ `withRouter`

#### 先看看 `withRouter` 的 prop types

`wrappedComponentRef` 使得高阶组件能够访问到它包裹组件的 `ref`;

```js
C.propTypes = {
  wrappedComponentRef: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ])
};
```

#### `withRouter` 的渲染逻辑

`withRouter` 是一个高阶组件, 支持传入一个组件, 返回一个能访问路由数据的**路由组件**, 实质上是将组件作为 `<RouterContext.Consumer>` 的子组件, 并将 `context` 的路由信息作为 `props` 注入组件中;

```js
const C = props => {
  // ...返回组件
  const { wrappedComponentRef, ...remainingProps } = props;

    return (
      <RouterContext.Consumer>
				{context => {
          return (
            <Component
              {...remainingProps}
              {...context}
              ref={wrappedComponentRef}
            />
          );
        }}
      </RouterContext.Consumer>
    );
};

return hoistStatics(C, Component);
```

`hoistStatics` 是三方库 hoist-non-react-statics, 用于解决高阶组件中原组件 static 丢失的问题; 同时使用支持传入props: `wrappedComponentRef`, `wrappedComponentRef` 绑定原组件的 `ref`, 因此可以通过`wrappedComponentRef`访问到原组件; 需要注意的是, 函数式组件没有 `ref`, 因为函数式组件并没有实例, 所以使用 `withRouter` 包裹函数式组件时, 不支持使用 `wrappedComponentRef` 访问原组件!

## ⚙️ Hooks

> React Router ships with a few [hooks](https://reactjs.org/docs/hooks-intro.html) that let you access the state of the router and perform navigation from inside your components.
>
> Please note: You need to be using React >= 16.8 in order to use any of these hooks!

react-router 提供了一些 hooks, 让我们可以在组件中获取到路由的状态并且执行导航; 如果需要使用这些钩子, 我们需要使用 `React >= 16.8`;

react-router 的 hooks 实际上是利用 React 提供的 hooks: `useContext`, 让我们可以在组件中访问到 `HistoryContext` 以及 `RouterContext` 中的数据;

#### useHistory

```js
import React from 'react';
import HistoryContext from "./HistoryContext.js";

const useContext = React.useContext;

export function useHistory() {
  return useContext(HistoryContext);
};
```

#### useLocation

```js
import React from 'react';
import RouterContext from "./RouterContext.js";

const useContext = React.useContext;

export function useLocation() {
	return useContext(RouterContext).location;
};
```

#### useParams

```js
import React from 'react';
import RouterContext from "./RouterContext.js";

const useContext = React.useContext;

export function useParams() {
  const match = useContext(RouterContext).match;
	return match ? match.params : {};
};
```

#### useRouteMatch

```js
import React from 'react';
import RouterContext from "./RouterContext.js";
import matchPath from "./matchPath.js";

const useContext = React.useContext;

export function useRouteMatch(path) {
  const location = useLocation();
  const match = useContext(RouterContext).match;
  return path ? matchPath(location.pathname, path) : match;
}
```

注:

- useRouteMatch 使用hook: `useLocation`, 去获取 `location`;
- matchPath 是 react-router 的一个公共api, 支持传入一个 `pathname` 以及 `path`, 若是 `path` 与 `pathname` 匹配则返回一个 `match` 对象, 不匹配则返回一个 `null`;

## 💻 结尾

**从源码对 react-router v5 进行原理分析**系列到此结束, 实际上还有一些比较冷的组件没有进行源码阅读(挖个坑, 以后有空可以填);

仔细想想, 这还是第一次系统性地去阅读一个高星的库, 这次源码阅读让我觉得受益匪浅, 对比一下自己写的库, 不管是从设计还是总体封装都是差了十万八千里(笑, 还得努努力;

作者之前是偏向 vue, 因为最近开始系统性地学 React, 所以想趁着学习的热情, 把 React 一些高星的库挖挖, 看看能不能从源码中理解到一些 React 开发中的小技巧或是设计思想, 所以目的是达到了;

感慨一下: ReacR的生态是真的繁荣, 基础库也是多到眼花缭乱, 其实在我看来这也算个小缺点, 因为工具的多样化有可能会出现以下问题: 因为开发过程中没沟通好, 导致项目中引入多个相同的库, 目前维护的平台确实有这种问题, 以前的开发也是百花齐放呢(怒;

在这里抛出一个问题呀:

在 React 中, 我可以通过这么写去覆盖组件的 props:

```js
const props = {
  title: '新标题'
};
<Component title="旧标题" {...props}></Component>
```

而在 vue 中用以下的写法却不能覆盖之前组件的 props:

```html
<template>
  <Component title="旧标题" v-bind="{title: '新标题'}"></Component>
</template>
```

有看过 vue 源码的兄台来解答一下疑惑吗? 那么接下来的目标就是去看看 vue 的源码啦!