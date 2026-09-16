# Debug 记录

## DOWNLOAD-20260905-01 · 公网大制品 Range 返回 200

- 状态：待定位，2026-09-05T08:49:05+08:00 复现。
- 现象：`/releases/gitfinder-2/alpha/2.0.0-alpha.86/GitFinder-2-2.0.0-alpha.86-arm64-mac.zip` 的 GET/HEAD `Range: bytes=0-1023` 均 HTTP 200，缺少 Content-Range/Content-Length/Accept-Ranges；GET 为 chunked。请求带 Accept-Encoding: identity，无重定向、无 Content-Encoding；Cloudflare 为 BYPASS。
- 对照：本站 `latest-mac.yml` 的 `Range: bytes=0-31` 返回 HTTP 206、Content-Range bytes 0-31/426、Content-Length 32；两份完整 manifest 均 HTTP 200 且 current alpha.86。
- 范围：请求都限制到 1024/2048 字节，未全量下载或修改发布记录。`a7cd1c5` 到 `7442de3` 下载 route/resolvePublicDownload/storage/next.config 无变化；proxy 变更仅将匹配限定于 Dashboard。
- 假设：大制品的应用/代理/CDN 路径需要对照；未锁定根因，未证实发生于本次部署之前。
- 下一步：在 Con01 容器内对同一 ZIP 发起直连 Range 请求，对照源站与公网响应头后再决定修改位置。

## STORE-20260916-01 · 发布链路与后台反馈

- 时间：2026-09-16T12:19:15+08:00。
- 证据：`tests/store-workflows.test.ts` 原代码13项中12项失败，修复后13/13；完整36/36。根因与逐项修复见 [审查报告](../software-store-review-2026-09-16.md)。
- 真实页面补充：`scripts/verify-store-ui.mjs` 首次发现 React Action 返回验证错误后重置表单；`AdminActionForm` 在错误结果时取消 reset，复测9/9通过。
- 尚未结案：公网下载Range对照、多进程写入锁、分片清理与恢复、真实账号/旧客户端端到端升级。未将本轮本地测试写为生产发布验证。

- 2026-09-16T12:20:50+08:00 补充：部署前 curl IPv4 实测双平台安装包 Range 206/64字节且 PK/MZ 文件头正确；Node 直连异常仍未定位，不将其直接归因为商城故障。实际部署收据保存在 `.local-verification/0.1.22/deployment.json`。

## 2026-09-16T13:12:53+08:00 · STORE-20260916-02 · 商品素材混用和后台不可发现

- 用户截图来自Dashboard；缠序/auth图标原字节相同，Dashboard静态beta列表与生产目录不同步；手机菜单无后台入口且无权限返回404。
- 修复：缠序专用字标、实时公开商品、独立新增页/admin/products/new、/admin总览、多入口和权限说明、两个独立草稿模板。未修改管理员权限或生产目录。
- 回归：原3项测试全部失败，当前完整41项通过；浏览器覆盖真实新增/反馈/数据源/移动导航/角色门禁，最终结果写入.local-verification/0.1.23。
- 事实修正：本轮开始公网为0.1.22，不再沿用上轮尚未部署状态；两个商品公开页仍404，不能以旧Dashboard卡片代替上架事实。
- 详见 `../store-product-admin-fix-2026-09-16.md`。

## 2026-09-16T13:46:53+08:00 · 0.1.24 · PRODUCT-RECOVERY-20260916

- 用户截图确认两目标商品仍不可见；此前只修模板/素材，没有补生产catalog。
- 实施仅针对open-play和chanxu-tradingview的一次性启动迁移，原始备份与完成标记，保留全部软件Release、其他商品和权限。详见 `../product-listings-recovery-2026-09-16.md`。
- 独立工作区51/51测试、类型/构建和6组浏览器验证通过；主工作区并行Auth代码未覆盖。
- 生产是否已恢复以 `.local-verification/0.1.24/product-recovery-deployment.json` 的公网首页/详情证据为准，代码推送本身不代表恢复成功。
