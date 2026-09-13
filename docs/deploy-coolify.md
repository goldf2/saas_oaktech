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
CASDOOR_AUTH_ENABLED=false
NEXTAUTH_URL=https://你的域名
NEXTAUTH_SECRET=至少32字符的随机值
CASDOOR_ISSUER=https://你的Casdoor域名
CASDOOR_CLIENT_ID=Casdoor中的软件商店Application客户端ID

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

CREEM_TEST_MODE=true
CREEM_WEBHOOK_SECRET=xxx
CREEM_API_KEY=creem_test_xxx
CREEM_API_URL=https://test-api.creem.io/v1

BASE_URL=https://你的域名
CREEM_SUCCESS_URL=https://你的域名/dashboard

RELEASE_STORAGE_ROOT=/app/data/releases
OAKTECH_ADMIN_SUBJECTS=Casdoor管理员用户的sub，多个值用逗号分隔
OAKTECH_ADMIN_USER_IDS=管理员的Supabase用户ID
OAKTECH_ADMIN_EMAILS=管理员邮箱
OAKTECH_RELEASE_WRITE_TOKEN=至少32字符的随机发布机器凭据
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
- `NEXTAUTH_URL`、`NEXTAUTH_SECRET`、`CASDOOR_ISSUER`、`CASDOOR_CLIENT_ID`、`CASDOOR_AUTH_ENABLED`：只需要 Runtime Variable。会话密钥不得写入仓库或构建日志；不要配置 `CASDOOR_CLIENT_SECRET`，本应用通过 S256 PKCE 兑换授权码。
- `OAKTECH_RELEASE_WRITE_TOKEN`：只需要 Runtime Variable，禁止显示在构建日志或写入仓库；GitFinder GitHub Environment 保存同一值。
- `CREEM_TEST_MODE`、`CREEM_API_URL`、`CREEM_SUCCESS_URL`：Runtime Variable 即可。

## 4. 配置登录回调

Casdoor：

1. 为软件商店新建独立 Application；可与其他产品复用同一套 Casdoor 技术栈，但不要求复用同一组织或账户空间。
2. Redirect URI 精确添加：

```text
https://你的域名/api/auth/callback/casdoor
```

3. 先保持 `CASDOOR_AUTH_ENABLED=false` 部署并验证公开下载；配置完成后再切为 `true`。
4. 管理员授权使用不可变的 OIDC `sub` 写入 `OAKTECH_ADMIN_SUBJECTS`，不要只依赖可修改的显示名称。

Supabase 回滚登录：

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

更新器清单和安装包位于 `/releases/**`，不经过 Supabase 或 Casdoor 会话中间件。部署后还应分别验证 GET、HEAD 和带 Range 请求的下载。

当前积分、订阅和支付表仍以 Supabase `auth.uid()` 为身份键。启用 Casdoor 的第一阶段只替换网站登录和软件商店管理员身份；迁移这些业务数据前必须保留 Supabase Auth 表、外键、触发器和 RLS，以便回滚。

## 6. 标准 Web CI/CD

仓库中的 `.github/workflows/ci-deploy.yml` 固定执行：

1. Pull Request 和 `main` 推送均运行测试、TypeScript 与 Next.js 生产构建。
2. 只有 `main` 验证通过后才调用 Coolify 的 authenticated Deploy Webhook。
3. 工作流等待 `/api/health` 返回与 `package.json` 一致的版本，再检查两个公开 updater manifest。

GitHub `production` Environment 需要配置：

- Secrets：`COOLIFY_WEBHOOK`、`COOLIFY_TOKEN`。
- Variables：`PUBLIC_BASE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`。

Coolify 应关闭“push 即自动部署”，避免代码在 CI 未通过时抢先上线；正式部署只由该工作流调用 Deploy Webhook。当前仍由 Coolify 从 Git 构建 Dockerfile，后续如改为 GitHub 构建 GHCR 镜像，Coolify 也必须同步改为部署该预构建镜像，不能同时保留两种不一致的制品来源。

## 商品与发布后台持久化

`/admin/products` 用于创建、编辑和发布商品；`/admin/releases` 用于创建版本草稿、分片上传安装包、校验 SHA-512、发布或回退历史版本。生产环境必须把 `RELEASE_STORAGE_ROOT` 挂载到 Coolify 持久卷，例如 `/app/data/releases`，禁止使用容器临时目录。

建议 Coolify 配置：

- `/app/data/releases`：持久卷，保存 `catalog.json`、审计日志、历史安装包和更新清单。
- `RELEASE_STORAGE_ROOT=/app/data/releases`：运行时变量。
- 公开下载路由只读发布目录；后台写入必须经过 Casdoor/Supabase 管理员权限。
- 部署前后保留同一持久卷，禁止使用 `emptyDir` 或随容器销毁的临时目录。
- 定期将 `/app/data/releases` 备份到对象存储；容器镜像只保存代码和页面模板。

发布流程：创建商品 → 创建版本草稿 → 上传安装包 → 服务端重新计算 SHA-512 → Verify and publish → 公开产品页和更新清单同步切换。下架或回退只改变目录元数据，不删除历史安装包。
