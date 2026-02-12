---
title: "奇怪的 axios 拦截器"
date: 2022/10/27 10:34:00
banner: /imgs/wallpaper1
---



## 💣 事情经过

这是一个工作中发现的问题，简单描述一下场景：后端 api 接口返回格式大致如下：

```js
{
  code: 200, // 200 表示接口返回正常，非 200 则为异常
  data: {}, // 返回的数据
  message: '', // 接口报错时的错误信息
}
```

- 当 code 字段为 200 时，则表示接口正常，这时候我们正常取数据就行；
- 当 code 为非 200 时，表示接口异常，此时我们需要把对应的错误信息进行弹窗报错；

这属于一个通用的处理，因此我们可以利用 axios 返回拦截器进行处理：

```js
import axios from 'axios';

const handleRes = config => {
  if (config.data.code !== 200) {
    throw config;
  }
  return config;
};

const handleErr = error => {
  // 把错误信息进行弹窗
};

axios.interceptors.response.use(handleRes, handleErr);
```

=.= 这就是我的直觉写法，handleRes 函数对响应体进行处理，对返回数据的 code 进行判断，如果不为 200 则抛出一个错误，并由 handleErr 函数捕获，然后再进行弹窗处理。

## 💥 终究还是出问题了

想法很美好，但其实 handleErr 是不生效的……

贴个官网的示例：

```js
// Add a response interceptor
axios.interceptors.response.use(function (response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  return response;
}, function (error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error);
});
```

> 只要状态码超过 2xx 便会触发这个函数

也就是说，它只会在请求异常时触发，也就是接口 http code 不为 2xx 时。

## 💊 发现原因

解决问题，首先要研究源码 =.=

```js
const responseInterceptorChain = [];
this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
  responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
});

// ...省略一大段代码

try {
  promise = dispatchRequest.call(this, newConfig);
} catch (error) {
  return Promise.reject(error);
}

i = 0;
len = responseInterceptorChain.length;

while (i < len) {
  promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
}
```

可以看出拦截器中的参数最终会作为 Promise.prototype.then 的参数，也就是说我们的代码可以等同于：

```js
promise.then(handleRes, handleErr);
```

而 handleErr 函数只捕获 promise 变量的错误，不捕获 handleRes 函数中的错误，如果需要捕获，应该在后面使用 catch 或是 then 函数：

```js
promise.then(handleRes, handleErr).catch(err => {});
promise.then(handleRes, handleErr).then(undefined, err => {});
```

换成拦截器的语法，也就是再新增一个响应拦截器，定义一个错误捕获函数：

```js
import axios from 'axios';

const handleRes = config => {
  if (config.data.code !== 200) {
    throw config;
  }
  return config;
};

const handleErr = error => {
  // 把错误信息进行弹窗
};

axios.interceptors.response.use(handleRes);
axios.interceptors.response.use(undefined, handleErr);
```

# 🍔 后续

谢谢观看，希望可以帮到你！
