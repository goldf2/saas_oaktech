# 软件商店 Casdoor 登录

软件商店通过独立 `software-store-web` Application 使用现有 Casdoor，使用 Authorization Code + S256 PKCE/state，服务器验证 OIDC ID Token 后建立本站加密会话。NextAuth 显式配置 `token_endpoint_auth_method: none`，授权码交换仅提交 client ID 和一次性 code verifier，不使用 Casdoor client secret。

## 生产配置

- 商店：`https://oaktechz.com`，Con01 / 在线商城 / production / `softbank`。
- 当前可用 issuer：`https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me`。2026-09-05 discovery 实测 HTTP 200，AL03 Coolify 显示 Casdoor `Running (healthy)`。
- `https://auth.oaktechz.com` 当前 HTTP 503，未配置到该 Casdoor 服务；不得填为生产 issuer。
- Organization：`oaktech-store`，软件商店账号使用普通业务组织，不放入内置管理组织 `built-in`。
- Application：`software-store-web`，Type 为 Web、Grant Types 仅 `authorization_code`、不共享应用，独立 client ID；应用 client secret 留在 Casdoor，不复制到商店、Con01 或 CI。
- 登录回调：`https://oaktechz.com/api/auth/callback/casdoor`。
- 退出回跳：`https://oaktechz.com/sign-in`，同样加入 Application Redirect URLs。
- scope：`openid`；Token format 使用 `JWT-Custom`，Token fields 仅选择 `id`（后端 User 字段 `Id`），Token attributes 保持为空。必须检查实际 Token 字段名，确认不包含邮箱、电话、地址、头像和完整 User 档案后才启用生产。
- Casdoor v4.1.0 的应用 client secret 可用于管理 API 鉴权，不能依赖关闭 Client Credentials grant 限制该能力。商店使用无需此密钥的 S256 PKCE 流程，机器发布身份另行配置。

Coolify Production Environment Variables：

```dotenv
CASDOOR_AUTH_ENABLED=false
NEXTAUTH_URL=https://oaktechz.com
NEXTAUTH_SECRET=<独立生成的随机会话密钥>
CASDOOR_ISSUER=https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me
CASDOOR_CLIENT_ID=<software-store-web 的客户端 ID>
OAKTECH_ADMIN_SUBJECTS=<已确认商店管理员的精确 sub>
```

这些变量只需运行时生效。`NEXTAUTH_SECRET` 是商店独立生成的会话密钥，仅存 Coolify，不进入仓库、构建参数或日志；它不是 Casdoor 应用密钥。公开下载不依赖 Casdoor；保留原 Supabase 配置以便回滚。

## 上线验收

1. 保存独立业务组织和 Application，核对精确回调 URL、`authorization_code` 与最小 Token 字段；不导出应用 client secret。
2. 配置 Coolify 运行时环境变量，确认不存在 Casdoor 应用密钥，将 `CASDOOR_AUTH_ENABLED` 改为 `true` 后部署。
3. 使用 `oaktech-store` 的普通账户完成 S256 PKCE 真实登录；确认 Token 的 issuer、audience、subject 和字段范围，不记录 Token 值。
4. 核对商店管理员的 subject 映射；Casdoor 模式不沿用邮箱或 Supabase ID 的管理员授权。
5. 验证授权跳转、回调后 Dashboard、页面刷新、退出、匿名 Dashboard 门禁与现有 updater manifests/安装包 Range 请求；此次接入不切换软件发布版本。

回滚：将 `CASDOOR_AUTH_ENABLED=false` 并重新部署，恢复原 Supabase 登录。积分、订阅和支付表仍依赖 Supabase，未在这次登录接入中迁移。

## 参考

- [Casdoor Token format / Token fields](https://casdoor.ai/docs/token/overview/)
- [Casdoor RP-initiated logout](https://casdoor.ai/docs/session/rp-initiated-logout/)
- [Casdoor v4.1.0：S256 PKCE 验证及无 client secret 的授权码交换](https://github.com/casdoor/casdoor/blob/v4.1.0/object/token_oauth.go#L205-L238)
- [Casdoor v4.1.0：应用 client secret 的 API 鉴权](https://github.com/casdoor/casdoor/blob/v4.1.0/routers/base.go#L121-L159)
- [Casdoor v4.1.0：应用身份的管理 API 权限](https://github.com/casdoor/casdoor/blob/v4.1.0/authz/authz.go#L173-L175)
