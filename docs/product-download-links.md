# 商品下载地址与 GitHub 来源（0.1.48）

## 行为

商品页把本站软件包与 GitHub 来源分开。本站卡片来自已公开的软件版本，显示平台、处理器、实际版本和完整地址，支持复制；浏览器拒绝剪贴板时选中地址并提示手动复制，不谎报成功。当前公开版本仅含更新清单时，仍提供较早已公开版本的安装包，并明确标注其版本；公开目录下载计数使用相同资格。更新清单（含 updates.json）、未发布草稿不当安装包展示。

商品资料新增可选 `github_url`，随商品草稿保存、预览和独立发布。公开模型为 `githubUrl`。预览仅显示来源文本，不开放下载或外部跳转。仅接受无凭据、查询参数、片段的 HTTPS GitHub 仓库/发布页地址；服务端验证，不能仅依赖输入框。旧客户端省略字段保留已有草稿值，明确空字符串则移除链接。MCP 商品写入也接受该字段，并走相同权限及验证。

旧商品没有该字段时，为四个已核实公开仓库提供可覆盖默认来源：open-play → goldf2/open-play-releases；gitfinder-2 → goldf2/GitFinder；video-prompt-workbench → goldf2/video-prompt-workbench-releases；x-tweet-extractor → goldf2/x-tweet-extractor。此映射不新增商品、不生成安装包、也不保证仓库已有 Release。未知商品不推测来源。

## 生产数据边界

本次仅发布商城代码，不自动发布历史商品/软件草稿，不改变 current、不写入生产安装包或权限。Open Play 原公开页已实际观察到没有本站下载。软件包缺失时明确提示，并提供已核实的 GitHub 来源，而不是伪造本站 URL。真实安装包须经现有管理员导入、上传、校验和发布流程；对应真实发布与原生升级继续归 REL-01/REL-02。

## 验证

`npm test`、`npm run typecheck`、默认 `npm run build`；专项 `npm run test:download-links` 使用隔离临时目录、测试会话和真实测试字节，不访问生产管理数据。覆盖中英文 1440/390/320px、地址复制及拒绝时反馈、真实 GET/HEAD/Range、草稿文件 404、GitHub 保存/重新打开/发布/移除及软件数据不变。结果以 `docs/00-handoff/evidence/2026-10-01-download-links.json` 和 `.local-verification/download-links/` 收据为准，未完成验证不引用历史成功数代替。
