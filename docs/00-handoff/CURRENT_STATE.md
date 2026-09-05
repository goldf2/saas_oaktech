# 当前状态

更新时间：2026-09-05T08:07:16+08:00

- 当前源代码版本：`0.1.13`。2026-09-05 上线前基线为 Con01 `softbank` / `a7cd1c5` / `0.1.11`。
- 软件商城以持久卷中的 `catalog.json` 管理产品、Release Draft、Published Release 和制品元数据；认证代码已支持 Casdoor OIDC；生产配置未切换前仍使用 Supabase 登录。
- 已提供发布描述导入接口和机器分片上传入口。机器身份只能准备草稿，最终公开仍需管理员在 `/admin/releases` 确认。
- 发布时服务端重新计算制品 SHA-512，并且只使用 macOS ZIP 与 Windows NSIS 生成 electron-updater 清单。
- 本地验证：6 项测试通过、TypeScript 检查通过、Next.js 生产构建通过；本地真实 HTTP 导入、四制品上传和幂等重试通过。
- Con01 生产站点已提供 `/api/admin/releases/import`；2026-09-04 未授权 POST 实测返回 `401 RELEASE_WRITER_UNAUTHORIZED`，证明新接口已部署且默认拒绝写入。
- 待验证：生产密钥配置，以及 GitHub Actions 到生产草稿的真实推送。当前 GitFinder 缓存中的 Con01 API 凭据可读但无环境变量写权限，创建配置返回 403。

## Casdoor 登录接入（2026-09-05）

- 软件商店使用独立 `software-store-web` Application。现有 Casdoor issuer 为 `https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me`，discovery HTTP 200、AL03 Coolify 显示 healthy；`auth.oaktechz.com` 尚未绑定到该服务，当前 HTTP 503。
- Authorization Code + PKCE/state、本站 JWT 会话、Dashboard 门禁、管理员精确 subject 授权和 Casdoor 退出代码已完成；会话不保留姓名、邮箱、头像、access token 或 ID token。
- 17 项测试、TypeScript 检查和 Webpack 生产构建通过，已验证授权 URL、最小会话和未登录门禁。
- 生产软件商店尚无 Casdoor/NEXTAUTH 变量；新建独立应用及保存客户端密钥等待用户确认。代码保持显式开关，配置验收完成前不启用。
- 配置、回调、验收与回滚步骤：[Casdoor 登录](../casdoor-login.md)。
