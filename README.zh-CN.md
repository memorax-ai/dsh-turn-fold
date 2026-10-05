# dsh-turn-fold

[English](README.md) | 简体中文

[![Powered by Harmony](https://memorax-ai.github.io/dsh-harmony/harmony-powered.svg)](https://memorax-ai.github.io/dsh-harmony/)

一个基于 [dsh-harmony](https://github.com/memorax-ai/dsh-harmony) 的 Provider，为 DSH WebUI 对话添加 Codex Desktop 风格的回合折叠。

https://github.com/user-attachments/assets/3c9dfdcf-a454-4750-9edf-76771ed5a9a6

回合进行期间，摘要栏保持可见，原生思考、说明、命令和工具调用继续流式输出。从第二项开始，连续的推理、上下文注入和工具活动会合并为一个紧凑分组。回合结束后，包括上下文注入在内的已知 Agent 活动会收进最终答复前方的折叠栏。摘要指标可以配置，默认显示耗时、工具调用次数以及输入/输出 token；只有当已加载的回合包含足够数据、无需猜测即可计算时才会展示对应指标。

最终答复通过 `turn-tail.closing.finalNode` 定位，不依赖 `finish_reason` 或 DOM 位置。正常完成、已停止和已中断的回合都会折叠，后两者显示不同的状态标签。当 DSH 将结束分支标记为不可用、结束答复之后仍有节点，或者用户的键盘焦点或文本选择位于活动内容中时，回合会保持展开。失败、达到最大 token、缺少结束节点以及仍在进行的回合也会保持展开，避免隐藏错误或未完成的工作。

展开后仍然使用原生节点渲染器，因此工具详情、复制功能和文件链接都能继续工作。WebUI 保持加载期间，每个会话和回合的展开状态都会被记住。折叠控件提供键盘可见焦点、无障碍状态与操作标签、响应式换行、减少动态效果支持，以及关闭后再卸载活动内容的短暂开合动画。

## 工作原理

三个带形状校验的 Source Patch 会在内存中修改编译后的浏览器包：DSH `0.1.0-rc.8` 至 `0.1.1-rc.2` 使用 `@deepseek-ai/dsh-client-ui-conversation`，DSH `0.1.2-alpha.5` 至 `0.1.7` 版本线（含预发布版）则跟随渲染器迁移到 `@deepseek-ai/dsh-client-ui-chat`。它们不会修改已安装的 DSH 文件。每条选择器仍必须恰好命中一次，因此遇到不兼容的编译形状时会停止应用，而不会修改不确定的目标。

| Patch | 选择器（预期命中 1 次） | 作用 |
| --- | --- | --- |
| `inject-turn-fold-runtime` | `FunctionDeclaration[name.name="ChatView"], VariableStatement:has(VariableDeclaration[name.name="ChatView"])` | 向原生或已装饰的 `ChatView` 注入折叠渲染器和折叠 UI |
| `rewrite-node-render-loop` | 旧版 `order.map(...)` / 0.1.2 `ChatNodeList` 调用 | 将对应版本的原生节点列表接缝替换为按回合渲染器 |
| `install-turn-fold-services` | `VariableStatement:has(VariableDeclaration[name.name="t"][initializer.expression.name.name="bind"])` | 通过 DSH 原生语言服务注册内置的中英文词典，并绑定原生设置作用域 |

## 安装

```sh
dsh plugin --profile web add github:memorax-ai/dsh-turn-fold
dsh harmony status --profile web   # 三个 Patch 都必须为 `bound`
```

## 测试

```sh
node test/run.cjs
```

`npm install` 会安装测试工具所需的依赖。测试套件会对两种受支持的编译形状分别在内存中应用三个 Patch、解析最终浏览器包，并覆盖已完成回合、分段活动、结束后活动、部分历史、失败、中断、进行中、无障碍、本地化、设置和状态保留等行为。目标缺失或选择器不匹配会使测试失败，不会被报告为跳过后通过。

## CI 与发布

GitHub Actions 会在每个 Pull Request 和每次推送到 `main` 时运行测试套件及
包内容预检。版本标签通过 Trusted Publishing（OIDC）发布到 npm，无需保存
长期 npm Token。

首次使用时配置一次 npm 可信发布者：

```sh
npx npm@^11.15.0 trust github @ch4acko3/dsh-turn-fold \
  --repo ch4acko3/dsh-turn-fold \
  --file release.yml \
  --allow-publish
```

之后创建与 `package.json` 版本一致的标签并推送：

```sh
npm version patch
git push --follow-tags
```

已使用真实 `0.1.5-rc.2`、`0.1.6-alpha.2` 和 `0.1.7-rc.2` 包验证。设置 `DSH_TURN_FOLD_UPSTREAM_ROOT` 指向隔离的 DSH 安装后运行 `npm test`，可对该版本的聊天包执行测试。选择器仍要求精确命中。

另明确支持 DSH `0.2.0-rc.2`：该版本使用 `configForms`、插件设置标签页、可实时修改的配置字段及新版原生图标。渲染器没有局部时间线变量时，Turn Fold 通过原生聊天 hook 读取时间线，并适配原生时长格式化函数返回的数字与单位分段。Windows 浏览器检查覆盖与 Bites 组合启动、编辑摘要指标、Host 重启后设置持久化，以及通过原生会话持久化写入的两轮合成历史回放：回退时隐藏后续轮次，回放期间禁用输入，退出后恢复输入。尚未覆盖真实模型调用或 macOS/Linux 浏览器交互。`0.2` 的兼容范围仅包含这个已验证版本。
