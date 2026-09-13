# Casdoor 首次登录案例

## 目的

记录 OakTech 软件商店第一次接入 Casdoor 后，从注册到登录 Dashboard 的可复用流程。

## 配置要点

- Casdoor 组织：`oaktech-store`
- Casdoor 应用：`software-store-web`
- OIDC issuer：`https://casdoor.xiangshu.me`
- 回调地址：`https://oaktechz.com/api/auth/callback/casdoor`
- 授权方式：Authorization Code + S256 PKCE

## 用户操作

1. 打开 `https://oaktechz.com/sign-up`。
2. 点击 Casdoor 注册入口。
3. 用户名仅使用字母、数字、连字符或下划线；不能连续使用连接符，也不能以连接符开头或结尾。
4. 完成注册后回到 Casdoor 授权页并继续授权。
5. 成功回调到 `https://oaktechz.com/dashboard`。

## 验收结果

2026-09-08，已完成真实注册、登录并进入 Dashboard，确认登录链路正常。

## 排障提示

若出现 503 或跳转到旧域名，检查 OakTech 的 `CASDOOR_ISSUER` 与 Casdoor Compose 的 `origin` 是否都为 `https://casdoor.xiangshu.me`，保存后重启 Casdoor 并重新部署 OakTech。

