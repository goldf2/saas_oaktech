# 当前状态

更新时间：2026-09-05T08:33:25+08:00

- 当前源代码版本：`0.1.14`。2026-09-05 上线前基线为 Con01 `softbank` / `a7cd1c5` / `0.1.11`。
- 软件商城以持久卷中的 `catalog.json` 管理产品、Release Draft、Published Release 和制品元数据；认证代码已支持 Casdoor OIDC；生产配置未切换前仍使用 Supabase 登录。
- 已提供发布描述导入接口和机器分片上传入口。机器身份只能准备草稿，最终公开仍需管理员在 `/admin/releases` 确认。
- 发布时服务端重新计算制品 SHA-512，并且只使用 macOS ZIP 与 Windows NSIS 生成 electron-updater 清单。
- 本地验证：6 项测试通过、TypeScript 检查通过、Next.js 生产构建通过；本地真实 HTTP 导入、四制品上传和幂等重试通过。
- Con01 生产站点已提供 `/api/admin/releases/import`；2026-09-04 未授权 POST 实测返回 `401 RELEASE_WRITER_UNAUTHORIZED`，证明新接口已部署且默认拒绝写入。
- 待验证：生产密钥配置，以及 GitHub Actions 到生产草稿的真实推送。当前 GitFinder 缓存中的 Con01 API 凭据可读但无环境变量写权限，创建配置返回 403。

## Casdoor 登录接入（2026-09-05）

- 软件商店使用独立 `software-store-web` Application。现有 Casdoor issuer 为 `https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me`，discovery HTTP 200、AL03 Coolify 显示 healthy；`auth.oaktechz.com` 尚未绑定到该服务，当前 HTTP 503。
- Authorization Code + S256 PKCE/state、本站 JWT 会话、Dashboard 门禁、管理员精确 subject 授权和 Casdoor 退出代码已完成；会话不保留姓名、邮箱、头像、access token 或 ID token。`0.1.14` 显式使用 `token_endpoint_auth_method: none`，不读取或传递 Casdoor client secret；本站仍需独立 `NEXTAUTH_SECRET`。
- 18 项测试、`npx tsc --noEmit --incremental false` 和 `npm run build -- --webpack` 通过。新增回归通过 NextAuth 的实际 OIDC 客户端验证 token 请求携带 code verifier，且无 client secret 或 Authorization header；此前已验证授权 URL、最小会话和未登录门禁。
- 生产配置及真实登录仍待验收。Casdoor v4.1.0 应用 client secret 具有管理 API 鉴权能力，不能复制到 Con01 商店；先前等待保存该密钥的指引已撤销。代码保持显式开关，配置验收完成前不启用。
- 配置、回调、验收与回滚步骤：[Casdoor 登录](../casdoor-login.md)。
