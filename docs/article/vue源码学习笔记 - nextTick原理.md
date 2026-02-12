---
title: "vue源码学习笔记 - nextTick原理"
date: 2021/02/26 00:00:01
banner: /imgs/vue
---

## ⛽ 用法

> [官方文档](https://cn.vuejs.org/v2/api/index.html#Vue-nextTick): 在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM。

举个例子:

```html
<template>
  <div>
    <div ref="i">{{i}}</div>
    <button @click="add">点击</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      i: 0
    };
  },
  methods: {
    add() {
      this.i++;
      console.log(this.$refs.i.innerText);
    }
  }
}
</script>
```

在 add 方法中, 执行 this.i++ , 并获取此时的 this.$refs.i.innerText , 打印出来的结果为 0 ; 这并不符合我们的预期, this.i++ 之后 this.i 应该等于 1 才对; 但事实上, 在 vue 中, dom 的更新是异步行为, 也就是说会在当前事件循环结束后才执行 dom 的更新, 因此 this.$refs.i.innerText 获取到的值仍然是 0 ;

> [官方文档](https://cn.vuejs.org/v2/guide/reactivity.html#异步更新队列): 当你设置 vm.someData = 'new value'，该组件不会立即重新渲染。当刷新队列时，组件会在下一个事件循环“tick”中更新。多数情况我们不需要关心这个过程，但是如果你想基于更新后的 DOM 状态来做点什么，这就可能会有些棘手。虽然 Vue.js 通常鼓励开发人员使用“数据驱动”的方式思考，避免直接接触 DOM，但是有时我们必须要这么做。为了在数据变化之后等待 Vue 完成更新 DOM，可以在数据变化之后立即使用Vue.nextTick(callback)。这样回调函数将在 DOM 更新完成后被调用。

vue 提供了 Vue.nextTick 的方法, 让回调函数在 dom 更新完毕后调用, 再给出例子:

```html
<template>
  <div>
    <div ref="i">{{i}}</div>
    <button @click="add">点击</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      i: 0
    };
  },
  methods: {
    add() {
      this.i++;
      this.$nextTick(() => {
        console.log(this.$refs.i.innerText);
      });
    }
  }
}
</script>
```

使用 this.$nextTick , 在 dom 更新完成之后访问 this.$refs.i.innerText , 打印出的结果是 1 ;

## 🔍 源码解析

注意: 文章使用的是 vue 版本为 2.6 ;

首先大概了解一下 vue dom 的更新原理: 

1.  Observer 对 data 进行数据劫持, 视图在渲染时获取 data 的属性, 触发 data 属性的 get 方法, 属性对应的 dep 进行依赖收集, 将渲染 watcher 加入该 dep 的 subs 中;
2. 当 data 的属性发生变化时, 触发属性的 set 方法, 执行对应 dep 的 notify 方法, 通知 subs 所有的 watcher , 执行 watcher.update 方法, 触发视图更新;

而 nextTick 便和视图更新原理中的第二步有关, 我们开始阅读源码吧! 从 [dep.notify](https://github.com/vuejs/vue/blob/2.6/src/core/observer/dep.js#L37) 看起:

```js
notify () {
  // stabilize the subscriber list first
  const subs = this.subs.slice()
  if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
  }
  for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
  }
}
```

对 dep.subs 进行遍历, 执行 subs[i].update 方法, 也就是 [watcher.update](https://github.com/vuejs/vue/blob/2.6/src/core/observer/watcher.js#L164) :

```js
update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true
  } else if (this.sync) {
    this.run()
  } else {
    queueWatcher(this)
  }
}
```

渲染 watcher 的 lazy 参数为 false , sync 参数也为 false , 直接执行 [queueWatcher](https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/src/core/observer/scheduler.js#L130) 方法:

```js
function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
```

大概便是, 将渲染 watcher 推入队列 queue 中, 然后调用 nextTick(flushSchedulerQueue) 函数; 到这里 nextTick 已经出场了, 但我们先来看看 [flushSchedulerQueue](https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/src/core/observer/scheduler.js#L38) 做了什么:

```js
function flushSchedulerQueue () {
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id)

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    watcher.run()
    // 省略大量warning代码
  }
  // 省略大量warning代码
}
```

首先是对 queue 进行排序, 这么做的目的在代码中已经做好注释了:

> Sort queue before flush. This ensures that: 1. Components are updated from parent to child. (because parent is always created before the child) 2. A component's user watchers are run before its render watcher (because user watchers are created before the render watcher) 3. If a component is destroyed during a parent component's watcher run, its watchers can be skipped.

接着遍历 queue , 执行 [watcher.run](https://github.com/vuejs/vue/blob/2.6/src/core/observer/watcher.js#L179) 方法, 进行 dom 更新操作;

好的, 可以看出 [flushSchedulerQueue](https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/src/core/observer/scheduler.js#L38) 就是实现 dom 的更新, 那么我们现在来剖析 [nextTick](https://github.com/vuejs/vue/blob/2.6/src/core/util/next-tick.js#L83) :

```js
const callbacks = []
let pending = false
function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```

在 nextTick 中, 将 cb 函数推入 callbacks 数组中, 执行 [timerFunc](https://github.com/vuejs/vue/blob/2.6/src/core/util/next-tick.js#L31) 函数:

```js
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

timerFunc 会根据环境的不同声明为不同的异步方法, 优先级为 Promise > MutationObserver > setImmediate > setTimeout , 除了 setTimeout , 其它的异步方法执行得到的都是微任务, 在迫不得已的情况下使用 setTimeout 做异步任务; 在注释中说道, MutationObserver拥有更加广泛的使用, 但在 iOS >= 9.3.3 UIWebView 中的touch事件处理程序中触发 MutationObserver 时存在非常严重的 bug , 因此如果本地支持 Promise 时, 我们将会优先考虑 Promise ; timerFunc 的作用非常简单, 便是异步执行 [flushCallbacks](https://github.com/vuejs/vue/blob/2.6/src/core/util/next-tick.js#L11) 函数:

```js
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
```

flushCallbacks 函数中, 遍历 callbacks , 执行每个成员函数, 更新 dom ;

以上便是 nextTick 的原理啦, 当我们直接调用 nextTick 方法时, 便是将回调函数推入 callbacks 中, 利用 timerFunc 执行异步操作, 在下一次事件循环"tick"时调用 flushCallbacks , 顺序遍历 callbacks 并执行成员函数, 在 dom 更新后执行 nextTick 回调函数; 这里抛出一个问题, 为什么要异步更新 dom 呢? 原因很简单, 如果我们同步更新 dom , 那在一个事件循环内, 若是对同一个 dom 多次更新, 或是同时对不同的 dom 进行更新, 都会消耗大量不必要的性能, 因此我们利用异步任务会在下一次事件循环"tick"执行的特性, 将所有 dom 更新收集起来, 一次性更新, 是一种非常节省性能的做法!

## 💻 总结

总结使用官网的原话吧:

> Vue 在更新 DOM 时是**异步**执行的。只要侦听到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作。Vue 在内部对异步队列尝试使用原生的Promise.then、MutationObserver和setImmediate，如果执行环境不支持，则会采用setTimeout(fn, 0)代替。

谢谢大家, 拜托点个赞吧(*￣︶￣)