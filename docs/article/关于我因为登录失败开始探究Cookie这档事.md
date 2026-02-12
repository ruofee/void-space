---
title: "关于我因为登录失败开始探究Cookie这档事"
date: 2020/11/04 00:00:00
banner: /imgs/chrome
---



## 写在前面

最近在工作时遇到一个问题，经过几天的思索和探究终于找到了问题所在，觉得有点价值便写了这篇文章记录下来，分享给热爱学习、乐于思考的各位，希望每个遇到相同情况的人可以通过阅读这篇文章得到解答。

话不多说，开始吧！

## 问题

最近在开发一个平台，这里统称为 **A 平台**；A 平台由两个部分构成：

*   前端部分
*   后端部分

可以看出，这是前后端分离开发的模式，前端和后端的正式环境都为：`bin.ruofee.cn`;
题外话：SN 战队很棒了，希望明年再度捧起 LPL 的荣光。
PS：本篇文章中的域名都是虚构的，如有雷同，纯属巧合。（-.-）

因为公司还有许多平台，考虑到用户信息的安全性，需要登录平台统一进行登录状态管理，因此也有个**统一登录平台**：`login.ruofee.cn`，这里统称为 **Login 平台**。

![](https://pic1.zhimg.com/80/v2-1eb2cbbc38fb703c0016fa9a263ef014_1440w.jpg)

注意, 上图中 cookie 的 domain 写错了, 应该为: `.ruofee.cn`; `ruofee.cn` 和 `.ruofee.cn` 在于, domain 设置为 `ruofee.cn` 的 cookie, 仅在 `ruofee.cn` 的请求中可以自动携带上, 而 domain 为 `.ruofee.cn` 的 cookie, 在 `ruofee.cn` 和 `ruofee.cn` 的子域名的接口都会自动携带上;

**平台的登录流程如下：**

1.  浏览器打开 A 平台，首先进行用户状态判断：判断是否存在 **auth_token**（auth_token 是 Login 平台设置到浏览器中的 cookie，用于登录状态保持），如果 auth_token 不存在则表示 A 平台未进行登录操作（也有可能是: 进行过登录操作，但 cookie 已经过期），通知浏览器跳转到 Login 平台进行账号密码登录，如(4)；如果 auth_token 存在则表示 A 平台已经进行过登录操作，进行下一步操作；
2.  A 平台后端接口根据业务提供了一个接口：`bin.ruofee.cn/api/validate`，用于验证 auth_token 是否有效，如果有效则返回用户的个人信息，如果无效则通知浏览器跳转 Login 平台重新登录，如 (3) **。/validate** 接口的逻辑很简单，直接访问 Login 平台提供的验证接口 **`login.ruofee.cn/auth` 进行 auth_token 验证。
3.  浏览器不存在 auth_token 或者 auth_token 失效时都会跳转到 Login 平台进行账号密码登录，登录成功时 Login 平台会将新的 auth_token 设置为 cookie，保存在浏览器中，用于保持当前的登录状态；

以上就是平台登录的大致流程，可以看出，平台如果想接入统一登录服务，关键的点在于 **A 平台前端在访问 A 平台后端时，是否可以自动带上 Login 平台设置的 cookie（auth_token），从而进行后面的 auth_token 校验流程**。

**那么来进行简单的分析：**

Login 平台在登录成功时，浏览器通过 Response Headers 中的 Set-Cookie 进行 cookie 设置：

```text
# Login 平台登录成功时设置 cookie

Set-Cookie: auth_token=xxx; domain=.ruofee.cn; path=/; 
```

从 Set-Cookie 的结构可以看出：

*   auth_token 的 domain 为 `.ruofee.cn`，而不是 `login.ruofee.cn`;
*   path为 `/`;

因为 auth_token 设置的 domain 为 `.ruofee.cn`，所以访问 `ruofee.cn` 或是 `ruofee.cn` 的子域名时都将会自动带上 auth_token。但由于同源策略对 cookie 的限制，**分为以下两种情况**：

1.  **同源**：请求将会自动带上对应的 cookie，无需做其他设置；

2. **非同源**：需要做跨域处理，在 Response Headers 做以下配置：

```text
# Response Header

Access-Control-Allow-Origin: 前端Origin # 注意，这里不能为*，如果设置为*将不会带上cookie
Access-Control-Allow-Headers: 允许接收的Request Headers # 根据需要进行设置
Access-Control-Allow-Credentials: true 
```

Ajax中需要把 withCredentials 设置为 true，如下：

```js
var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://example.com/', true);
xhr.withCredentials = true;
xhr.send(null); 
```

MDN 中对 [Access-Control-Allow-Credentials](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) 的解释如下：

> `Access-Control-Allow-Credentials` 头工作中与 `XMLHttpRequest.withCredentials` 或 Fetch API 中的 `Request()` 构造器中的 `credentials` 选项结合使用。Credentials必须在前后端都被配置（即the `Access-Control-Allow-Credentials` header 和 XHR 或 Fetch request 中都要配置）才能使带 credentials 的CORS请求成功。

进行以上设置之后便可以自动带上 cookie 了！


| 地址 | 协议 | Host | Port |
| --- | --- | --- | --- |
| http://bin.ruofee.cn | HTTP | bin.ruofee.cn | 80 |
| http://bin.ruofee.cn/api | HTTP | bin.ruofee.cn | 80 |


从上表可以看出，A 平台前端和后端属于第一种情况：满足同源策略；因此从理论上来说，A 平台前端请求 A 平台后端接口时，会自动带上 cookie（auth_token）。而事实上确实也成功了，因此决定吃一顿麦当劳奖励一下自己。(^__^)

为了方便开发，将平台前端部署到本地（总不能在服务器上开发吧），开启服务：localhost:8080。

| 地址 | 协议 | Host | Port |
| --- | --- | --- | --- |
| http://localhost:8080 | HTTP | localhost | 8080 |
| http://bin.ruofee.cn/api | HTTP | bin.ruofee.cn | 80 |


从上表可以知道，本地开启的前端服务与线上的后端服务存在跨域，因此需要参考上面讲的**非同源**情况，设置跨域相关 Headers；在全部设置完毕之后，本地开发一切正常，cookie 能顺利带上;

这时候读者肯定就郁闷了，**说好的问题呢？**莫急，接下来进入正题！

就在 2020 年 5 月份的某一天，如往常一样, 打开本地的前端服务，准备开始一天的忙碌，却突然一直重复登录；打开 chrome 的 devtools 查看 http 请求发送情况才发现，本地前端请求接口时 (`bin.ruofee.cn/api/validate`)，auth_token 没有自动带上，因此后端判断前端平台为未登录状态，于是重定向到 Login 平台进行登录，Login 平台登录成功跳转回本地前端，再次访问接口(`bin.ruofee.cn/api/validate`)，auth_token 又没有自动带上，于是再次重定向到 Login 平台进行登录...

枫枫挠头, "你搁这搁这呢"

于是, 开始一步一步进行检查，发现问题卡在流程中的 (5)，虽然登录成功了，返回的 Response Headers 如下：

```text
Set-Cookie: auth_token=xxx; domain=.ruofee.cn; path=/; 
```

Response Headers 很正常，但是请求后端接口时没有自动带上 cookie，我陷入思考，发现有两种可能：

1.  cookie 没有设置到浏览器中；
2.  cookie 设置成功，但因为一些原因未在接口请求时自动带上；

为了先验证 cookie 是否成功设置到浏览器中，先清除掉 chrome 中所有的 cookie，在本地进行登录操作，此时平台一直重复登录，接着打开线上的 A 平台，发现 A 平台并未跳转到 Login 平台，说明此时 Login 平台的 auth_token 已经设置到浏览器中。所以可以得出结论：**cookie 设置成功，但因为一些原因未在接口请求时自动带上**。从这个方向出发进行思索和探究，终于找到了原因！

这里我们先科普 cookie 的几个属性：


| 属性 | 描述 | 值 | 默认值 |
| --- | --- | --- | --- |
| domain | Domain 指定了哪些主机可以接受 Cookie。如果不指定，默认为 origin，不包含子域名。如果指定了Domain，则一般包含子域名 | 当前 origin 或者父 origin | 当前 origin |
| path | Path 标识指定了主机下的哪些路径可以接受 Cookie | 任意值 | 当前路径 |
| SameSite | SameSite Cookie 允许服务器要求某个 cookie 在跨站请求时不会被发送，（其中 Site 由可注册域定义），从而可以阻止跨站请求伪造攻击（CSRF）。 | 1. None。浏览器会在同站请求、跨站请求下继续发送 cookies，设置为 None 时需要 Secure 同时设置为 true 才生效； 2. Strict。浏览器将只在访问相同站点时发送 cookie；3. Lax。与 Strict 类似，但用户从外部站点导航至URL时（例如通过链接）除外。 在新版本浏览器中，为默认选项，Same-site cookies 将会为一些跨站子请求保留，如图片加载或者 frames 的调用，但只有当用户从外部站点导航到 URL 时才会发送。如 link 链接| 默认为空，但部分浏览器为 Lax |
| Expires/Max-Age | cookie 的生命周期 |  | session |
| Secure | 标记为 Secure 的 Cookie 只应通过被 HTTPS 协议加密过的请求发送给服务端 | true/false | 默认为空 |
| HttpOnly | JavaScript 中的 Document.cookie API 无法访问带有 HttpOnly 属性的 cookie；此类 Cookie 仅作用于服务器 | true/false | 默认为空 |

看了上面的 Cookie 属性表，聪明的同学应该已经知道原因了~原因就出在 SameSite：

当 **SameSite 为 Strict 或是 Lax**时，通过 Ajax 进行 **cross-site** 的接口请求时，将不会自动带上 cookie；SameSite 的值默认为空，但部分浏览器默认为 ”SameSite=Lax“, 通过上网查阅资料，终于在 **Chrome 80** 版本的更新日志中找到原因：

> [Chrome 80: February 4, 2020](http://link.zhihu.com/?target=https%3A//support.google.com/chrome/a/answer/7679408%2380) Updates to cookies with SameSite
> Starting in Chrome 80, cookies that don’t specify a SameSite attribute will be treated as if they were SameSite=Lax. Cookies that still need to be delivered in a cross-site context can explicitly request SameSite=None. Cookies with SameSite=None must also be marked Secure and delivered over HTTPS. To reduce disruption, the updates will be enabled gradually, so different users will see it at different times. We recommend that you test critical sites using the instructions for testing.

中文翻译为：

> [Chrome 80: February 4, 2020](http://link.zhihu.com/?target=https%3A//support.google.com/chrome/a/answer/7679408%2380) 更新Cookie的SameSite
> 从 Chrome 80 开始，未指定SameSite属性的Cookie将被视为 SameSite = Lax。仍然需要在跨站点中传递的 Cookie 可以设置为 SameSite = None。具有 SameSite = None 的 Cookie 也必须设置为 Secure，并通过 HTTPS 传送。为了减少中断，将逐步启用更新，因此不同的用户将在不同的时间看到它。我们建议您按照测试说明来测试关键站点。

所以在2020年5月之前跨站的 cookie 仍能正常携带，而在2020年5月之后 Chrome 更新之后，Chrome 80 将 Cookie 的 SameSite 默认设置为 Lax，因此本地部署的平台在访问跨站的线上后端接口时，cookie 将不再可以自动在 Headers 中带上。

这里再贴一下 SameSite=Lax 的作用：

> 当 SameSite=Lax 时，浏览器只在访问相同站点时发送 cookie，但用户从外部站点导航至URL时（例如通过链接）除外。 在新版本浏览器中，为默认选项，Same-site cookies 将会为一些跨站子请求保留，如图片加载或者 frames 的调用，但只有当用户从外部站点导航到 URL 时才会发送。如 link 链接

事实上，如果是**跨站点设置 cookie，Chrome 甚至会阻拦 Set-Cookie 生效**：

使用 Express 在线上服务器搭建一个简单的 Node 服务器，并提供一个设置 cookie 的接口：

```js
app.use('/cookie', (req, res) => {
  res.append('Set-Cookie', 'cookie=test_cookie; domain=ruofee.cn; path=/;');
  res.send('success');
}); 
```

在解决了跨域问题之后，在本地搭建的前端平台访问该线上接口 `bin.ruofee.cn/api/cookie`，从 chrome 的 devtools - network 中查看 Response Headers 的 Set-Cookie，发现有着这么一段话：

> This Set-Cookie didn't specify a "SameSite" attribute and was defaulted to "SameSite=Lax" and was blocked because it came from a cross-site response which not the response to a top-level navigation. The Set-Cookie had to have been set with "SameSite=None" to enable cross-site usage.

中文翻译为：

> 当 Set-Cookie 中的 ”SameSite“ 没有设置值时，默认为 ”SameSite=Lax“，并且因为 Set-Cookie 来自于一个跨站点的响应，导致 Set-Cookie 被阻拦。如果需要跨站点设置 cookie，Set-Cookie 必须设置为 ”SameSite=None“。

![](https://pic4.zhimg.com/80/v2-7cca8481371ad86abbcf89836f977d87_1440w.jpg)

chrome 浏览器提示

这里再科普一下 cross-site 和 cross-origin 的区别：

*   cross-site，意为跨站；site 指的是 ETLD+1（有效顶级域名左边加一个子域名，例如 `ruofee.cn` 即为一个 ETLD+1），若是两个 url 的 site 不同，则表示跨站；
*   cross-origin，意为跨域；origin 是协议头、主机名、端口的合并，因此若是两个 url 协议头、主机名、端口中有一个不相同则表示跨域；

贴一篇总结 cross-site、cross-origin 的文章：

[Understanding "same-site" and "same-origin"​web.dev](http://link.zhihu.com/?target=https%3A//web.dev/same-site-same-origin/)

> 更新一个 Chrome 的点, 在 94 的版本中, Chrome 将 http 和 https 认为是两个站点, 也就是 `http://ruofee.cn` 和 `https://ruofee.cn` 相当于两个不同的站点了;
>
> 更新于 2021/10/15 15:53:00

总结
--

这次遇到的**本地环境重复登录**的根本原因在于：**Chrome 80 将 SameSite 的默认值修改为 Lax，导致 cookie 无法在跨站的情况下发送。**而 Chrome 之所以对 cookie 作出调整是出于安全性的考量，具体可以参考这篇文章： [back2wild：即将到来的Chrome新的Cookie策略​](https://zhuanlan.zhihu.com/p/103420328);

**SameSite=Strict/Lax** 使用户基本杜绝 CSRF 攻击，并且避免因为 cookie 可以跨站发送而导致用户行为被追踪。

总而言之，Cookie 默认设置 ”SameSite=Lax“ 是浏览器的行为，是 Chrome 80 的一次更新；**Chrome 以推动者的身份进行这项改动，或许在今后，所有的浏览器都将会跟进，并完善 web 安全，让用户真正拥有隐私，又或许在今后，Chrome 从屠龙少年变成恶龙，走上 IE 的道路……**

解决方案
----

1.  **通过代理或是修改 Host 文件的方式，将本地前端地址的 ETLD+1 修改为 `ruofee.cn`**；cookie 设置为 ”SameSite=Lax“ 时不能跨站发送 Cookie，因此只要避免跨站即可解决问题；
2.  **本地搭建一个转发服务器，将本地前端发送的请求转发到线上后端服务；**同样避免跨站，本地的转发服务器和本地前端平台的 site 都是 `localhost`，因此不存在跨站现象；
3.  **更换浏览器；**当前只有 Chrome 80 默认修改了 SameSite 的值，其他浏览器仍然保持原样，因此不存在 cookie 不能跨站发送的情况；

**结尾**
------

**完美撒花，感谢大家的阅读。**

**”长按点赞可以一键三连哦！“**

**(**^__^**)**