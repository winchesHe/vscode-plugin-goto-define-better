# Vue2-helper - 为你的 Vue2 开发增添智慧 ✨

🚀 辅助`Vue2`开发中的`Mixins、组件库、Vue-router`的**智能补全、语义高亮、跳转支持、Hover 提示**等，提升`Vue2`开发体验。

## 背景与动机 🌟

在日益复杂的 `Vue2` 开发环境中，代码编写变得越来越具有挑战性。

`Vue2-helper` 应运而生，旨在解决 `Vue2` 开发过程中的种种痛点，让开发者能够专注于业务逻辑，而不必为繁琐的代码细节烦恼。

无论是 `Mixins`、组件库还是 `Vue-router`，我们都致力于提供最智能、最便捷的支持，助你成为更出色的 `Vue2` 开发者！

## 功能特色 ✨

- ✅ 配置式缓存设计：秒级切换体验，让开发如丝般顺滑
- ✅ [跳转 Mixins 定义位置](#跳转到mixins定义)：快速导航，轻松查看 Mixins 定义
- ✅ Mixins 嵌套解析：支持嵌套的 Mixins 使用
- ✅ [Mixins 内容智能补全](#mixins-内容智能补全)：智能补全助你事半功倍
- ✅ [Mixins 内容高亮显示](#mixins-内容高亮显示)：让代码一目了然
- ✅ Mixins 高亮自定义配置：满足个性化的编码需求
- ✅ Ts 支持：无缝集成 TypeScript
- ✅ Vue-class-component 支持：支持使用 .vue 后缀的 Vue-class-component

## 未来计划 📅

- ✅ [Mixins 中引入的 Component 解析并支持跳转](#mixins-components-跳转)
- ✅ Vue-router components 跳转：Js-goto-definition 功能助你快速定位
- ✅ [组件库注册组件引入的 Component 解析并支持跳转](#组件库跳转)
- ✅ [组件库注册组件 Hover 出现文档跳转信息](#组件库-hover-并跳转)
- ✅ [组件库注册组件智能补全提示](#组件库智能补全)
- ✅ 持续升级，成为 Vue2 开发的得力助手

## 跳转到Mixins定义

![在这里插入图片描述](https://img-blog.csdnimg.cn/063e6bc721a84e92bec34ec65e48123a.gif)

## Mixins 内容智能补全

![在这里插入图片描述](https://img-blog.csdnimg.cn/bb45d420f88a4d93b1bf66f5a44c1ded.png)

## Mixins 内容高亮显示

![在这里插入图片描述](https://img-blog.csdnimg.cn/92217f2b993c4f079b6027e81653fe04.png)

## Mixins Components 跳转

![在这里插入图片描述](https://img-blog.csdnimg.cn/b15974cc4f9f43e990c10635dbc175ab.gif)

## 组件库跳转

![在这里插入图片描述](https://img-blog.csdnimg.cn/a07f58d08be4412392490fcc44042992.gif)

## 组件库 Hover 并跳转

![在这里插入图片描述](https://img-blog.csdnimg.cn/70554e75a52c4bd48aca0060bf444e39.gif)

## 组件库智能补全

![在这里插入图片描述](https://img-blog.csdnimg.cn/16485c28e366456a99fcb175d9f70f4e.png)

## 组件库用法

在`settings.json`中添加下面配置，以`element-ui`为例

```json
{
  "mixins-helper.components": {
    "el": {
      "docs": "https://element.eleme.cn/#/zh-CN/component",
      "fileArr": [
        "node_modules/.pnpm/element-ui@2.13.2_vue@2.6.10/node_modules/element-ui/packages"
      ]
    }
  }
}
```

1. 组件库的前缀（Prefix）：
   - el: 这是组件库的前缀，用于标识组件库中的组件。

2. 组件库的文档（Docs）：
   - docs: 这是一个链接，指向组件库的文档页面。你可以通过点击链接查看组件库中各个组件的详细文档和使用示例。

3. 组件库组件在项目内的地址（FileArr）：
   - fileArr: 这是一个文件路径数组，用于指定组件库组件在项目内的位置。在这个例子中，组件库的文件存储在名为"node_modules/.pnpm/element-ui@2.13.2_vue@2.6.10/node_modules/element-ui/packages"的目录中。

## 让我们开始吧！ 🛠️

无论是初学者还是经验丰富的开发者，`Vue2-helper` 都将成为你的得力助手。通过智能的补全、高亮和跳转支持，你可以更轻松地构建出优雅、高效的 `Vue2` 应用。让我们一起开启愉快的 `Vue2` 开发之旅吧！
