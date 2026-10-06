# AI-Agent — original adapter subset

个人新增的 TypeScript 模型适配器与问题生成路由示例：讯飞星火的 HTTP/签名调用尝试、简化模型调用、离线模拟响应，以及简化的问题生成 route。

此仓库发布六个原创新增源文件，保留原目录结构。它不是完整 Deep Research 应用，也不包含上游研究主流程、状态管理、UI、截图、背景图片、图标、提示词或复制的配置文件。原完整私有项目与历史继续保留。

## 范围与使用

- `src/app/api/deep-research/*caller.ts`：五个调用/模拟示例，导出 `callModel`。
- `src/app/api/generate-questions/simple-route.ts`：简化的问题生成路由。

这些是历史宿主项目的扩展文件，依赖外部提供的 `types`、`constants`、`utils`、`services` 模块，以及 TypeScript/Next.js、AI SDK、Zod 等宿主依赖。此快照不复制那些模块，所以不能单独启动完整应用。集成时需自行具备使用宿主及依赖的权限，在合法持有的宿主中按同一路径放置所需文件，并配置相应的环境变量；不要把 Key 写入源码。

原参考项目：[codebucks27/Deep-Research-AI-Agent](https://github.com/codebucks27/Deep-Research-AI-Agent)。未确认其再分发授权，本仓库只引用该来源，不复制其实现、历史或素材。

此快照只验证 TypeScript 语法与公开内容边界，没有调用模型服务。`mock-model-caller.ts` 返回模拟内容；历史适配器不代表当前服务协议兼容性或生产可用性已经验证。完整复现教程含宿主代码示例，保留在私有归档中。

## 来源与权利

作者已确认这六个新增文件为个人原创，并有权公开。依赖与排除边界见 [THIRD_PARTY.md](THIRD_PARTY.md)。公开展示不自动授予复用许可，本次没有新增开源许可证。
