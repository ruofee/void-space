---
title: "Vue 3.x 模板编译优化"
date: 2026/3/8
banner: /imgs/banner/banner11.png
description: 记录关于 Vue 3.x 模板编译过程中的优化
tags: vue,源码分析
draft: true
---

Vue 3.x 中对模板进行

## 静态提升

```vue {2-3}
<div>
  <div>foo</div> <!-- cached -->
  <div>bar</div> <!-- cached -->
  <div>{{ dynamic }}</div>
</div>
```

以上的 template 经过编译之后转换成下面的样子：

```javascript {5-7}
import { createElementVNode as _createElementVNode, createCommentVNode as _createCommentVNode, toDisplayString as _toDisplayString, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", null, [
    _cache[0] || (_cache[0] = _createElementVNode("div", null, "foo", -1 /* CACHED */)),
    _createCommentVNode(" cached "),
    _cache[1] || (_cache[1] = _createElementVNode("div", null, "bar", -1 /* CACHED */)),
    _createCommentVNode(" cached "),
    _createElementVNode("div", null, _toDisplayString(_ctx.dynamic), 1 /* TEXT */)
  ]))
}
```

静态的节点在第一次 render 的时候调用函数生成 VNode，然后存入到 _cache 中，后续重新生成 vnode 的时候就不需要再次调用函数，从而节省重复创建的开销。

其实在 Vue 2.x 中也有这种类似的模板优化，如果节点中所有子节点都是静态，便会将这个节点标记为 Static，render 的时候会将静态节点保存到 staticRenderFns 数组中：

```vue
<div>
  <div>123</div>
  <div>
    <div>456</div>
    <div>789</div>
  </div>
</div>
```

上面的模板，vue-template-complier 将其编译成：

```javascript
// Render
function render() {
  with(this){return _m(0)}
}

// StaticRenderFns
[0] function() {
  with(this){return _c('div',[_c('div',[_v("123")]),_v(" "),_c('div',[_c('div',[_v("456")]),_v(" "),_c('div',[_v("789")])])])}
}
```

但 Vue 2.x 的优化过于“克制”，只要子节点一旦出现一个动态内容（比如变量），便会放弃优化，比如以下的模板：

```vue
<div>
  <div>123</div>
  <div>
    <div>456</div>
    <div>{{ name }}</div>
  </div>
</div>
```

上面的模板，vue-template-complier 将其编译成：

```javascript
// Render
function render() {
  with(this){return _c('div',[_c('div',[_v("123")]),_v(" "),_c('div',[_c('div',[_v("456")]),_v(" "),_c('div',[_v(_s(name))])])])}
}
```

可以看到，并没有 StaticRenderFns~

值得一提的是，在 Vue 3.x 中，当连续的静态节点足够多的时候，会将其“压缩”成一个静态 node，比如：

```vue {2-10}
<div>
  <div>
    <div>foo</div> <!-- cached -->
    <div>foo</div> <!-- cached -->
    <div>foo</div> <!-- cached -->
    <div>foo</div> <!-- cached -->
    <div>foo</div> <!-- cached -->
    <div>foo</div> <!-- cached -->
    <div>foo</div> <!-- cached -->
  </div>
  <div>{{ dynamic }}</div>
</div>
```

会转换成：

```javascript {5}
import { createElementVNode as _createElementVNode, createCommentVNode as _createCommentVNode, toDisplayString as _toDisplayString, createStaticVNode as _createStaticVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", null, [
    _cache[0] || (_cache[0] = _createStaticVNode("<div><div>foo</div><!-- cached --><div>foo</div><!-- cached --><div>foo</div><!-- cached --><div>foo</div><!-- cached --><div>foo</div><!-- cached --><div>foo</div><!-- cached --><div>foo</div><!-- cached --></div>", 1)),
    _createElementVNode("div", null, _toDisplayString(_ctx.dynamic), 1 /* TEXT */)
  ]))
}
```

## 更新类型标记

“更新类型标记”也称 Patch Flag，编译过程可以获取到大量的信息，比如每个节点的更新类型：可能是 text，也可能是 class……也可能是 text + class。

于是，Vue 3.x 在编译模板的过程中，给生成的 VNode Render 函数中添加上了更新类型的 Patch Flag，比如：

```javascript
createElementVNode("div", {
  class: _normalizeClass({ active: _ctx.active })
}, null, 2 /* CLASS */)
```

2 表示这个节点上只有 Class 是动态的。

详细的 PatchFlags 如下：

```javascript
export enum PatchFlags {
  /**
   * Indicates an element with dynamic textContent (children fast path)
   */
  TEXT = 1,

  /**
   * Indicates an element with dynamic class binding.
   */
  CLASS = 1 << 1,

  /**
   * Indicates an element with dynamic style
   * The compiler pre-compiles static string styles into static objects
   * + detects and hoists inline static objects
   * e.g. `style="color: red"` and `:style="{ color: 'red' }"` both get hoisted
   * as:
   * ```js
   * const style = { color: 'red' }
   * render() { return e('div', { style }) }
   * ```
   */
  STYLE = 1 << 2,

  /**
   * Indicates an element that has non-class/style dynamic props.
   * Can also be on a component that has any dynamic props (includes
   * class/style). when this flag is present, the vnode also has a dynamicProps
   * array that contains the keys of the props that may change so the runtime
   * can diff them faster (without having to worry about removed props)
   */
  PROPS = 1 << 3,

  /**
   * Indicates an element with props with dynamic keys. When keys change, a full
   * diff is always needed to remove the old key. This flag is mutually
   * exclusive with CLASS, STYLE and PROPS.
   */
  FULL_PROPS = 1 << 4,

  /**
   * Indicates an element that requires props hydration
   * (but not necessarily patching)
   * e.g. event listeners & v-bind with prop modifier
   */
  NEED_HYDRATION = 1 << 5,

  /**
   * Indicates a fragment whose children order doesn't change.
   */
  STABLE_FRAGMENT = 1 << 6,

  /**
   * Indicates a fragment with keyed or partially keyed children
   */
  KEYED_FRAGMENT = 1 << 7,

  /**
   * Indicates a fragment with unkeyed children.
   */
  UNKEYED_FRAGMENT = 1 << 8,

  /**
   * Indicates an element that only needs non-props patching, e.g. ref or
   * directives (onVnodeXXX hooks). since every patched vnode checks for refs
   * and onVnodeXXX hooks, it simply marks the vnode so that a parent block
   * will track it.
   */
  NEED_PATCH = 1 << 9,

  /**
   * Indicates a component with dynamic slots (e.g. slot that references a v-for
   * iterated value, or dynamic slot names).
   * Components with this flag are always force updated.
   */
  DYNAMIC_SLOTS = 1 << 10,

  /**
   * Indicates a fragment that was created only because the user has placed
   * comments at the root level of a template. This is a dev-only flag since
   * comments are stripped in production.
   */
  DEV_ROOT_FRAGMENT = 1 << 11,

  /**
   * SPECIAL FLAGS -------------------------------------------------------------
   * Special flags are negative integers. They are never matched against using
   * bitwise operators (bitwise matching should only happen in branches where
   * patchFlag > 0), and are mutually exclusive. When checking for a special
   * flag, simply check patchFlag === FLAG.
   */

  /**
   * Indicates a cached static vnode. This is also a hint for hydration to skip
   * the entire sub tree since static content never needs to be updated.
   */
  CACHED = -1,
  /**
   * A special flag that indicates that the diffing algorithm should bail out
   * of optimized mode. For example, on block fragments created by renderSlot()
   * when encountering non-compiler generated slots (i.e. manually written
   * render functions, which should always be fully diffed)
   * OR manually cloneVNodes
   */
  BAIL = -2,
}
```

而当节点存在多个动态类型的时候，比如 text + class：

```JavaScript
import { toDisplayString as _toDisplayString, normalizeClass as _normalizeClass, createElementVNode as _createElementVNode, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", null, [
    _createElementVNode("div", {
      class: _normalizeClass(_ctx.class)
    }, _toDisplayString(_ctx.dynamic), 3 /* TEXT, CLASS */)
  ]))
}
```

具体运算规则是：

text 是 00000001，class 是 00000010，如果同时存在 text + class，就是：00000011，也就是：3。

渲染过程中，渲染器会通过位运算来检查节点的 Patch Flag，从而直接定位到需要判断是否变化的节点属性，不再需要遍历节点上的所有属性了。而位运算是非常迅速的，这也在非常大的程度上提升了性能。

## 树结构打平

“树结构打平”也称 Tree Block，当数据发生更新时，通常需要对前后两个 VNode Tree 进行 Diff，即使是 VNode Tree 有静态节点也会被进行对比。而 Tree Block 
