---
title: "vue源码学习笔记 - watch原理"
date: 2021/02/26
banner: /imgs/banner/banner13.png
description: 深入 Vue 2.6 源码,剖析 watch 侦听器的实现原理。从 initWatch 到 Watcher 类,详细解析依赖收集、响应式触发、深度监听和回调执行的完整流程。
tags: Vue,源码分析
---

## 🤔 介绍

watch 是 vue 提供的侦听器，用于监听属性的变化；

> Vue 通过 watch 选项提供了一个更通用的方法，来响应数据的变化。当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的;
> 
> 来自 [官方文档](https://cn.vuejs.org/v2/guide/computed.html#%E4%BE%A6%E5%90%AC%E5%99%A8)

## ⛽ 用法

```html
<template>
  <div>
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
  watch: {
    i(newVal, oldVal) {
      console.log(newVal, oldVal);
    }
  },
  methods: {
    add() {
      this.i++;
    }
  }
}
</script>
```

上面的例子，使用 watch 监听 data.i 的变化：当 data.i 被修改时，则会触发 watch 的回调函数。

还有许多种用法，例子来自[官方文档](https://cn.vuejs.org/v2/api/#watch)：

````
watch: {
  // 函数
  a: function (val, oldVal) {
    console.log('new: %s, old: %s', val, oldVal)
  },
  // 方法名
  b: 'someMethod',
  // 该回调会在任何被侦听的对象的 property 改变时被调用，不论其被嵌套多深
  c: {
    handler: function (val, oldVal) { /* ... */ },
    deep: true
  },
  // 该回调将会在侦听开始之后被立即调用
  d: {
    handler: 'someMethod',
    immediate: true
  },
  // 你可以传入回调数组，它们会被逐一调用
  e: [
    'handle1',
    function handle2 (val, oldVal) { /* ... */ },
    {
      handler: function handle3 (val, oldVal) { /* ... */ },
      /* ... */
     }
  ],
  // watch vm.e.f's value: {g: 5}
  'e.f': function (val, oldVal) { /* ... */ }
}
````

## 🔍 源码解析

> 注意：本文章使用的 vue 版本为 2.6

vue 在初始化时执行 [initWatch](https://github.com/vuejs/vue/blob/2.6/src/core/instance/state.js#L60) 方法，注册 watch：

```js
function initState (vm: Component) {
  // 省略很多代码
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

initWatch 函数代码大致如下：

```js
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
```

在 initWatch 函数中，遍历 watch 对象，当对象属性为数组时，则遍历数组并执行 createWatcher 方法；如果对象属性不为数组，则直接执行 [createWatcher](https://github.com/vuejs/vue/blob/2.6/src/core/instance/state.js#L303) 方法：

```js
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
```

判断传入的 handler 是否为对象或字符串，实际上是兼容两种 watch 的写法：

```js
{
  watch: {
    name: {
      handler() {}
    },
    age: 'handler'
  }
}
```

最终 handler 被设置为 watch 的回调函数；createWatcher 最后返回了 `vm.$watch` 函数，接着追踪 `$watch` ：

```js
Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
```

可以看到 `$watch` 是 vue 原型链上的一个方法：设置 option.user 为 true，并创建一个观察者实例 Watcher，接着，若是 options.immediate 为 true，则执行回调函数，这也就是 watch 回调函数立即执行的原理。

观察者 Watcher 用于订阅响应式数据的变化，主要源码如下：

```js
// 省略了无关紧要的代码
constructor (
  vm: Component,
  expOrFn: string | Function,
  cb: Function,
  options?: ?Object,
  isRenderWatcher?: boolean
) {
  this.vm = vm
  // options
  if (options) {
    this.deep = !!options.deep
    this.user = !!options.user
  }
  this.cb = cb
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn
  } else {
    this.getter = parsePath(expOrFn)
    if (!this.getter) {
      this.getter = noop
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get()
}
```

分别将 options 的 deep 和 user 属性赋值给 Watcher 的 deep 和 user 属性，将 cb 回调函数赋值给 Watcher 的 cb 属性；再判断 expOrFn 是否为函数，此时 expOrFn 为 watch 的属性名，因此为字符串类型，因此将会执行 `this.getter = parsePath(expOrFn)`，下面是 [parsePath](https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/src/core/util/lang.js#L34) 的源码：

```js
const unicodeLetters = 'a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD'
const bailRE = new RegExp(`[^${unicodeLetters}.$_\\d]`)
function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
```

parsePath 的逻辑非常简单，使用字符串的 split 方法，以 . 作为分割点，对 path 进行切割，并生成属性数组，最终返回函数，当函数执行时，便会对传入的对象进行深度层级访问，并返回最终的属性值；举个简单的例子，假设 path 为 “a.b”，那么函数执行时会先访问 obj.a，再访问 obj.a.b~

回到 Watcher 构造函数，此时 this.getter 的值为 parsePath 生成的函数，接着往下看：

```js
this.value = this.lazy
  ? undefined
  : this.get()
```

this.lazy 为 false，于是执行 this.get 函数，并将返回值缓存到 this.value 中：

```js
get () {
  pushTarget(this)
  let value
  const vm = this.vm
  try {
    value = this.getter.call(vm, vm)
  } catch (e) {
    if (this.user) {
      handleError(e, vm, `getter for watcher "${this.expression}"`)
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value)
    }
    popTarget()
    this.cleanupDeps()
  }
  return value
}
```

get 函数便是关键了，首先执行 `pushTarget(this)` 将当前的观察者 Watcher 设置为 Dep.target，Dep.target 是一个用于存储 Watcher 的全局变量；接着执行 this.getter 方法，对监听属性进行层级访问，触发各级属性的 get 方法，将当前 Dep.target 收集到对应属性的 dep.subs 数组中，实现依赖收集；而若是 this.deep 为 true，则会执行 traverse 方法，对 value 进行深度访问，触发 value 所有属性的 get 方法，实现深度监听；

当监听属性发生变化时，便会触发相应数据的 set 方法，执行属性的 dep.notify 方法，通知 dep.subs 中收集到的所有观察者，并执行 watcher.update 方法：

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

lazy 和 sync 都为 false，因此直接执行 queueWatcher 函数：

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

queueWatcher 函数执行时，先将观察者推入 queue 队列中，再执行 `nextTick(flushSchedulerQueue)`，nextTick 会在当前事件循环结束后调用 flushSchedulerQueue，因此我们简单看看 flushSchedulerQueue 方法做了什么：

```js
function flushSchedulerQueue () {
  // ...省略
  queue.sort((a, b) => a.id - b.id)
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    watcher.run()
  }
  // ...省略
}
```

函数调用了 watcher.run 方法：

```js
run () {
  if (this.active) {
    const value = this.get()
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      const oldValue = this.value
      this.value = value
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue)
        } catch (e) {
          handleError(e, this.vm, `callback for watcher "${this.expression}"`)
        }
      } else {
        this.cb.call(this.vm, value, oldValue)
      }
    }
  }
}
```

通过执行 this.get() 获取监听属性的值，再判断值和缓存的值是否相等，不同的话执行 this.cb.call(this.vm, value, oldValue)，也就是 watch 设置的回调函数！

以上就是 watch 实现监听的原理啦~

## 💻 总结

vue 中 watch 对数据进行监听的原理为：

1. 遍历 watch，给每个 watch 属性创建一个观察者 watcher；
2. watcher 初始化时会获取监听属性的值，并将值保存在缓存中，也因此触发监听属性的 get 方法，被属性的 dep 收集；
3. 当监听属性发生变化时，触发 set 方法，执行属性的 dep.notify 方法，通知所有被收集的观察者，触发 watcher.update，执行 watch 回调函数；

多谢观看~请点个赞o(￣▽￣)ｄ