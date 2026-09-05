# 研发记录

## 2026-09-05T08:33:25+08:00 · PKCE-20260905 · Casdoor 无客户端密钥登录 0.1.14

- 目标：商店使用 S256 PKCE 登录，不接收具有 Casdoor 管理 API 能力的应用 client secret。
- 根因与证据：Casdoor v4.1.0 `object/token_oauth.go` 支持正确 S256 verifier 加空 secret 交换授权码；`routers/base.go` 的直接应用 secret 鉴权不受 Client Credentials grant 开关限制。官方固定版本源码链接见 [接入文档](../casdoor-login.md)。
- 改动：`lib/auth-options.ts` 配置 `token_endpoint_auth_method: none`；`lib/auth-config.ts` 移除应用密钥要求；保留 PKCE/state/openid/ID Token 与商店独立会话密钥。更新 `.env.example`、接入文档、现有认证测试，以及 `package.json`/`package-lock.json` 的 `0.1.14` 版本声明。
- 回归：新增 `tests/auth-pkce.test.ts` 在修改前因缺失应用密钥失败；修改后通过 NextAuth 实际 OIDC client callback 的本地 HTTP 请求确认无 Authorization header/client secret，且提交 client ID、code verifier 和固定回调地址。
- 验证：`npm test` 18/18；`npx tsc --noEmit --incremental false` 通过；`npm run build -- --webpack` 通过；无凭据进入文件或日志。
- 下一步：同步验证后的改动并部署，再完成生产真实登录、退出、管理员映射和匿名公开下载验收。本次记录只证明隔离 worktree 的源码与本地验证，未宣称生产已完成。

## 2026-09-05T08:07:16+08:00 · 软件商店 Casdoor 登录 0.1.13

- 目标：让商店使用现有 Casdoor 登录，保留未提交页面设计改动。
- 实现：从 `a7cd1c5` 隔离提取认证变更；OIDC code/PKCE/state、最小 JWT/session、精确 subject 管理员规则、Dashboard 门禁、Casdoor 退出和公开下载绕过认证代理。
- 验证：17 项测试、无增量 TypeScript 检查、Webpack 生产构建通过；实际 discovery HTTP 200、授权 URL 参数与最小会话 HTTP 检查通过。
- 配置基线：AL03 Casdoor healthy，Con01 `softbank` 仍为 0.1.11，尚无 Casdoor/NEXTAUTH 环境变量。
- 下一步：等待新建独立 Application 与客户端密钥写入 Con01 的确认，再完成真实生产登录验收；未存储任何实际凭据。


## 2026-09-04T12:51:05+08:00 · 生产端点与流水线环境核验

- 生产证据：`POST https://oaktechz.com/api/admin/releases/import` 在无凭据时返回 `401 RELEASE_WRITER_UNAUTHORIZED`，确认新版导入接口已部署并默认拒绝写入。
- GitHub：`goldf2/GitFinder` 已建立 `oaktech-release` Environment，非敏感变量 `OAKTECH_RELEASE_BASE_URL` 已设为 `https://oaktechz.com`。
- 阻塞：Con01 当前 API 凭据对环境变量只有读取权限，创建 `OAKTECH_RELEASE_WRITE_TOKEN` 返回 403；因此没有在 GitHub 侧留下半配置 Secret。
- 下一步：由有权限的管理员在 Coolify 添加生产变量并重部署，然后把同一值录入 GitHub Environment Secret，再做真实 runner 到生产草稿验收。

## 2026-09-04T12:36:28+08:00 · 软件构建发布工作流

- 目标：让 GitFinder CI 自动构建双平台制品并推送 OakTech Release Draft，保留后台人工发布门禁。
- 改动：新增幂等发布描述导入、机器上传鉴权、来源 commit 记录；修正 updater 清单只选择 macOS ZIP 和 Windows NSIS。
- 验证：`npm test` 6/6；`npm run typecheck` 通过；`npm run build` 通过；本地生产服务完成导入、四制品上传、401 拒绝和重复推送跳过验证。
- 未完成：尚未配置生产 Secret，或从 GitHub Runner 推送真实安装包。
