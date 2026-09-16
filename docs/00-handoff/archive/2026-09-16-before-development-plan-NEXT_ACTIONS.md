# 下一步

## P0 · 0.1.23 商品与后台入口

1. 以 `.local-verification/0.1.23/deployment.json` 确认远程与公网版本，检查/admin和/admin/products/new可进入权限提示页。
2. 用户通过真实账号打开商品后台；若未授权，核对管理员subject白名单，不自动给所有已登录用户开放权限。
3. 缠序/Auth需分别使用对应草稿模板录入生产目录；管理员确认资料后再公开，不依赖静态卡片或自动补种子。


## P0 · 2026-09-16 发布链路审查后续

1. `0.1.22` 本地36项测试、类型检查、生产构建和9组浏览器检查均通过；完成源码推送后，以 CI/Coolify 和公网 `/api/health` 分别验证部署。
2. 公网安装包 GET Range 经 curl 复核双平台206与64字节文件头；Node直连曾200/超时，继续定位客户端/网络路径差异，不称所有网络下完整断点续传均已验收。
3. 持久目录只允许一个写入进程；多实例部署前增加跨进程锁或迁移到事务数据库。
4. 补齐上传会话绑定、失败分片回收与恢复协议；保留机器只能准备草稿、管理员最终发布的边界。
5. 真实管理员登录及各客户端原生更新协议另行验收，本轮没有公开生产新版本。

以下保留此前各独立工作的待办，不代表本轮已重新核验或完成。

## P1 · OakTech 公共存储

1. 只读复核 `oaktech-public`、`oaktechz-public-read` 等相近 Bucket 的区域、ACL、对象和匿名 GET，将 `oaktech-public` 确认为正式桶，其他仅在明确清理前保留。
2. 在 `oaktech-public` 中使用 `apps/gitfinder-desktop/brand/` 前缀上传 Logo，再为 `assets.oaktechz.com` 配置 CDN 或稳定公开域名，更新 Casdoor 应用 Logo。
3. 对公开内容增加版本化路径和发布写权限；用户数据保持在私有存储。

## P0 · 软件商店 Casdoor 登录上线

1. `0.1.14` / `7442de3` 已部署并启用 Casdoor；组织、应用、精确回调、最小字段及五项仅运行变量已保存，授权跳转已验证。等待用户在已打开的商店注册页创建账号，然后从本站发起真实登录，验证回调、会话刷新、Dashboard 和退出。
2. 使用 `oaktech-store` 业务组织的账号确认管理员精确 `sub`，再配置 `OAKTECH_ADMIN_SUBJECTS` 并验收后台门禁；Casdoor 模式不接受旧邮箱/Supabase ID allowlist。不要把内置全局管理员账号作为普通商店身份。
3. 保持商店与 Casdoor 服务 `origin`、discovery issuer 一致，统一使用 `https://casdoor.xiangshu.me`；Casdoor client secret 具有管理 API 鉴权能力，不得复制到商店；授权码使用无需此密钥的 S256 PKCE。
4. 保留 Supabase 业务表及回滚配置，未来业务迁移按 `issuer + subject` 做身份映射；本次不迁移积分、订阅和支付数据。
5. 正式域名迁移、跨产品共享账户及机器 Client Credentials 作为后续独立工作。
6. 独立复核 DOWNLOAD-20260905-01：公网 macOS ZIP Range 返回 200，而 manifest Range 为 206；需要 Con01 容器直连对照定位应用/代理/CDN，不得声称断点下载已通过。

## 软件发布闭环

1. 为 GitFinder 发布任务创建独立 Casdoor 机器 Application 和最小发布权限，使用 Client Credentials 替代长期共享 Bearer Token。
2. 当前目标改为 GitFinder alpha.93。Actions `33930396752` 已完成双平台构建与四制品上传，用户本轮已要求补齐公开发布。等待 Chrome「📦 GitFinder 发布」的现有管理员登录后，在 `/admin/releases` 核对 alpha.93 来源提交 `1d7704e` 和四个制品，执行 Verify and publish。
3. 发布后核验 `latest.yml`、`latest-mac.yml`、中英文产品页、历史下载和二进制 URL 都指向 alpha.93，且旧版保留。可运行 `/Volumes/project/临时文件/gitfinder-publication-alpha93.ws2T7c/verify-publication.cjs`，参数为该次 CI 的 `descriptor/store-release.json`，它检查 Range、全量字节和 SHA-512。
4. 在已安装旧版本的 macOS 与 Windows 两端完成更新检查、取消、下载、安装和用户数据保留验收。
5. 8 MiB 分片已在 alpha.93 的 Actions `33930396752` 全量上传成功，不再把该次历史上传失败当作当前阻塞。

当前过渡令牌仅用于机器创建草稿和上传制品，不能直接公开版本；Casdoor Client Credentials 验收后轮换并移除它。
