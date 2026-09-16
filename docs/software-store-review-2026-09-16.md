# 软件商城发布与下载审查 · 2026-09-16

更新时间：2026-09-16T12:19:15+08:00

## 范围与事实来源

- 当前主项目：`/Volumes/project/项目/saas_oaktech`；原始 main 为 `d5994ad`、版本 `0.1.21`，工作区起始干净。
- `oaktools-platform/ARCHIVED.md` 明确已被本项目接替，本轮没有修改旧项目。
- 入口保持不变：`/admin/products` 商品展示资料、`/admin/releases` 版本与文件、`/admin/software` 入口页、`/releases/**` 公开下载。机器导入和分片上传仍只能准备草稿，最终发布仍需管理员。
- 本轮商城代码版本 `0.1.22`，未切换任何生产软件 Release/current，未写生产目录、身份配置或支付数据。

## 修复与对应代码

| 范围 | 已复现的问题 | 修复 |
| --- | --- | --- |
| 商品 | 新建相同 slug 或伪造不存在的编辑 id 会覆盖原商品 | `app/admin/actions.ts` 按 id 编辑、阻止重复 slug、固定已有商品 slug |
| 草稿 | 编辑丢失 source_commit，允许修改归属/版本/渠道导致存储路径错位 | 保留来源与制品，保存后的发布身份固定；说明文字仍可编辑 |
| 版本格式 | 机器接口拒绝已有 Open Play 四段版本号，网页却接受不安全版本 | 共用 `isReleaseVersion`，支持三段/四段版本和预发布/构建后缀 |
| 通用软件 | 非 macOS ZIP/Windows NSIS 不能发布 | 所有软件包均校验大小与 SHA-512；只有兼容包生成 Electron 清单，其余通过版本化 URL 下载 |
| 上传 | 浏览器仍用 16 MiB 分片；异步完成后 event.currentTarget 已失效 | 8 MiB 分片、提前保留 form 引用、确认服务器字节与 SHA-512 后再报成功 |
| 并发与故障 | 同槽位并发上传可写入两份元数据；审计失败误删已登记文件 | 在目录提交内再次验证槽位与草稿；提交后审计失败保留文件并明确返回 committed |
| 发布 | 哈希校验期间草稿变化仍可能公开旧校验快照 | 提交前比较完整草稿快照，变化则要求重新核验 |
| 下载 | HEAD 错误应用 Range；超大数值范围和空文件边界不健壮 | HEAD 忽略 Range，安全整数检查，空文件返回空体，增加 nosniff |
| 后台反馈 | 服务器校验失败无可用反馈，React 自动清空表单 | `AdminActionForm` 提供中文错误、pending 禁用和错误时保留输入；保存后自动展开目标草稿 |

## 实际验证

- 原有 `npm test`：23/23 通过。新增 13 项真实临时文件系统/路由/Action 用例在原代码上出现 12 项失败；修复后完整套件 **36/36 通过**。
- `npm run typecheck` 与 `PUPPETEER_SKIP_DOWNLOAD=true npm run build` 通过。
- `npm run test:store-ui`：**9 组检查通过**。脚本启动隔离本地生产服务、使用临时测试会话和虚构软件包，不对真实 Casdoor 账号登录作出结论。
- 浏览器验证包括：匿名后台/导入拒绝；实际创建商品；重复 slug 返回可见错误且不清空输入；四段版本草稿；9 MiB 文件按 8 MiB + 1 MiB 上传；完整 SHA-512；草稿 404；管理员发布；完整匿名下载、64 字节 Range 206 与 HEAD；390px 页面无溢出；无页面运行时错误。
- 结果与截图：`/Users/tefulong/.agentdock/tmp/oaktech-store-ui-results-JuUJQv/`。已查看桌面商品表单、手机发布后台和手机产品下载页截图。
- 浏览器第一次运行曾发现错误后表单被 React 清空，修复后第二次完整通过；不能只用单元测试代替页面验收。

## 公网基线与未完成验证

部署前 `/api/health` 实测 `0.1.21`；GitFinder 两份当前清单均 HTTP 200、版本仍为 `2.0.0-alpha.86`。对两个安装包 GET Range 的一次采样为 200、无 Content-Range；另一次 macOS HEAD Range 为 206、有正确长度，后续 GET 发生网络连接超时。仅取响应首块并取消，没有下载完整生产安装包。应用/代理/网络层原因尚未完全定位，不能把本地 Range 通过写成公网断点下载已通过。

随后用 `curl -4 --range 0-63` 再次复核：macOS ZIP 与 Windows EXE 均为 HTTP 206、Content-Length 64，Content-Range 分别为 `bytes 0-63/128172299` 与 `bytes 0-63/108914789`，文件头分别为 PK / MZ。该检查发生在源码部署前，不能归功于本次代码修复；Node 直连与 curl 的网络/客户端路径差异仍未定位。

代码发布说明见 `docs/00-handoff/RELEASE_LOG.md`。实际远程 commit、CI 与公网验收结果写入项目本地 `.local-verification/0.1.22/deployment.json`（不入 Git）；截图与浏览器结果也已复制到该目录。以每项实测记录为准。

## 保留的边界与下一步

1. `catalog.json` 的 mutationQueue 只保护单进程；多容器/多进程并发写入需要跨进程锁或事务数据库。本轮没有迁移持久化模型。
2. 失败/中断分片尚缺完整会话绑定、过期清理与可恢复上传协议，重试可能留临时文件。不要把 8 MiB 分片改动称为断线自动续传。
3. 真实 Casdoor 登录、管理员 subject 和 macOS/Windows 旧客户端升级需单独实测；普通版本下载不等于原生 Sparkle/其他更新协议已接入。四段版本可在商城发布，不保证 Electron 客户端接受四段版本。
4. 撤回当前版本不会自动把历史版设为 current；不可变缓存无法远程撤销已缓存安装包，页面已提示。
5. 初始化目录中的 Open Play/缠序有无文件的版本说明；生产目录是否已有文件必须以持久目录和实际下载为准，不因修改源码种子就宣称已可下载。
6. 审计失败后的保存状态仍需运维查看；本轮保证不误删已登记的文件，没有实现跨目录与审计日志事务。
