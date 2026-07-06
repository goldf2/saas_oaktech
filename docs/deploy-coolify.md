# Coolify 部署说明

这个项目可以在 Coolify 里按 Dockerfile 部署。Dockerfile 使用 Next.js standalone 输出，运行端口是 `3000`。

## 1. 准备代码仓库

1. 把项目推送到你的 GitHub/GitLab 仓库。
2. 确认仓库里包含这些文件：
   - `Dockerfile`
   - `.dockerignore`
   - `next.config.ts`
   - `package-lock.json`

## 2. 在 Coolify 创建应用

1. 新建 Resource，选择 Application。
2. 选择你的 Git 仓库和分支。
3. Build Pack 选择 `Dockerfile`。
4. Port/Exposed Port 填 `3000`。
5. Domain 填你的正式域名，例如 `https://example.com`。

## 3. 配置环境变量

在 Coolify 的 Environment Variables 里添加下面这些变量。不要把真实密钥提交到 Git。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

CREEM_TEST_MODE=true
CREEM_WEBHOOK_SECRET=xxx
CREEM_API_KEY=creem_test_xxx
CREEM_API_URL=https://test-api.creem.io/v1

BASE_URL=https://你的域名
CREEM_SUCCESS_URL=https://你的域名/dashboard
```

生产收款时改成：

```bash
CREEM_TEST_MODE=false
CREEM_API_URL=https://api.creem.io
```

注意：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`BASE_URL` 会参与 Next.js 构建。Coolify 部署前要确保这些变量在构建阶段可用。

建议在 Coolify 的 Normal view 里检查变量开关：

- `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`BASE_URL`：保留 Build Variable 和 Runtime Variable。
- `SUPABASE_SERVICE_ROLE_KEY`、`CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`：只需要 Runtime Variable，建议关闭 Build Variable。
- `CREEM_TEST_MODE`、`CREEM_API_URL`、`CREEM_SUCCESS_URL`：Runtime Variable 即可。

## 4. 更新第三方回调

Supabase:

1. Authentication > URL Configuration。
2. Site URL 填 `https://你的域名/`。
3. Redirect URLs 添加：

```text
https://你的域名/auth/callback
```

Creem:

1. Developers > API & Webhooks。
2. Webhook URL 填：

```text
https://你的域名/api/webhooks/creem
```

3. 把 webhook secret 更新到 Coolify 的 `CREEM_WEBHOOK_SECRET`。

## 5. 部署后检查

1. 打开首页，确认页面可访问。
2. 测试注册、登录、退出。
3. 测试进入 dashboard。
4. 在 Creem 测试模式触发一次支付，确认 webhook 能写入 Supabase。
5. 在 Coolify Logs 里确认没有 `Missing environment variable`、`401`、`403` 或 webhook signature 错误。
