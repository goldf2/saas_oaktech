# 软件商店 Casdoor 登录

软件商店通过独立 `software-store-web` Application 使用现有 Casdoor，使用 Authorization Code + PKCE/state，服务器验证 OIDC ID Token 后建立本站加密会话。

## 生产配置

- 商店：`https://oaktechz.com`，Con01 / 在线商城 / production / `softbank`。
- 当前可用 issuer：`https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me`。2026-09-05 discovery 实测 HTTP 200，AL03 Coolify 显示 Casdoor `Running (healthy)`。
- `https://auth.oaktechz.com` 当前 HTTP 503，未配置到该 Casdoor 服务；不得填为生产 issuer。
- Application：`software-store-web`，独立 client ID 和 client secret，不复制其他应用凭据。
- 登录回调：`https://oaktechz.com/api/auth/callback/casdoor`。
- 退出回跳：`https://oaktechz.com/sign-in`，同样加入 Application Redirect URLs。
- scope：`openid`；Token format 使用 `JWT-Custom`，Token fields 限制为身份标识所需字段。必须检查实际 Token 字段名，确认不包含邮箱、电话、地址、头像和完整 User 档案后才启用生产。
- 不授予此 Application Casdoor 管理 API 或机器发布权限。

Coolify Production Environment Variables：

```dotenv
CASDOOR_AUTH_ENABLED=false
NEXTAUTH_URL=https://oaktechz.com
NEXTAUTH_SECRET=<独立生成的随机会话密钥>
CASDOOR_ISSUER=https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me
CASDOOR_CLIENT_ID=<software-store-web 的客户端 ID>
CASDOOR_CLIENT_SECRET=<software-store-web 的客户端密钥>
OAKTECH_ADMIN_SUBJECTS=<已确认商店管理员的精确 sub>
```

这些变量只需运行时生效。实际密钥仅存 Coolify，不进入仓库、构建参数或日志。公开下载不依赖 Casdoor；保留原 Supabase 配置以便回滚。

## 上线验收

1. 保存独立 Application，核对精确回调 URL 与 Token 字段范围。
2. 配置 Coolify 环境变量，完成一次真实登录并确认 Token 的 issuer、audience、subject 和字段范围；不得记录 Token 值。
3. 确认商店管理员的 subject 映射；Casdoor 模式不沿用邮箱或 Supabase ID 的管理员授权。
4. 将 `CASDOOR_AUTH_ENABLED` 改为 `true` 后重新部署。验证登录跳转、回调后 Dashboard、页面刷新、退出和匿名 Dashboard 门禁。
5. 验证现有公开 updater manifests 与安装包 Range 请求；此次接入不切换软件发布版本。

回滚：将 `CASDOOR_AUTH_ENABLED=false` 并重新部署，恢复原 Supabase 登录。积分、订阅和支付表仍依赖 Supabase，未在这次登录接入中迁移。

## 参考

- [Casdoor Token format / Token fields](https://casdoor.ai/docs/token/overview/)
- [Casdoor RP-initiated logout](https://casdoor.ai/docs/session/rp-initiated-logout/)
