# Web 平台 CI/CD：GitHub Actions → Coolify

本文定义 OakTech Web 项目的标准发布路径。目标是让“提交代码”“验证通过”“生产部署”“公网验收”成为可追踪的四个阶段，任何一个阶段失败都不能被误报为发布成功。

## 1. 适用范围与原则

- 适用于 Next.js、Node.js API 和其他由 Coolify 承载的 Web 服务。
- Git 仓库是源代码事实来源；生产运行版本以 `/api/health` 返回值为准。
- Pull Request 只验证，不部署生产。
- `main` 通过全部 CI 后，GitHub Actions 才能调用 Coolify Deploy Webhook。
- Coolify 负责生产运行、环境变量、持久卷、域名、TLS、日志和镜像回滚。
- 数据库迁移、持久卷写入和公开版本切换必须与普通代码部署分开评估。

```mermaid
flowchart LR
  A[功能分支] --> B[Pull Request]
  B --> C[测试/类型检查/生产构建]
  C -->|通过| D[合并 main]
  D --> E[再次验证]
  E -->|通过| F[Coolify Deploy Webhook]
  F --> G[Coolify 构建并启动]
  G --> H[/api/health 版本验收]
  H --> I[关键公网路由验收]
```

## 2. 唯一版本与制品来源

- 应用版本只在项目主清单维护，例如 `package.json`；锁文件中的版本同步更新。
- `/api/health` 必须至少返回：

```json
{
  "status": "ok",
  "service": "oaktech-software-store",
  "version": "0.1.12"
}
```

- 当前阶段由 Coolify 从已通过 CI 的 Git commit 构建 Dockerfile。
- 不允许同一生产应用同时存在“Coolify 从源码构建”和“GitHub 构建另一份镜像”两个制品来源。
- 未来改为 GHCR 预构建镜像时，GitHub Actions 应使用 commit SHA 作为不可变 tag，Coolify 改为只拉取该镜像。

## 3. 分支、触发器与保护规则

| 事件 | 执行内容 | 是否部署 |
| --- | --- | --- |
| Pull Request | 安装、测试、类型检查、生产构建 | 否 |
| Push to `main` | 完整验证、触发 Coolify、生产验收 | 是 |
| `workflow_dispatch` | 人工重跑当前 commit | 仅 `main` |

GitHub 建议开启：

- `main` 禁止 force push 和删除。
- 合并前要求 `Test and build` 成功。
- 生产部署使用 `production` Environment；需要更强控制时增加人工 reviewer。
- 禁止把 Pull Request 来源分支的代码与 production secrets 放在同一不受控步骤运行。

## 4. GitHub 配置

`production` Environment 的 Secrets：

| 名称 | 用途 |
| --- | --- |
| `COOLIFY_WEBHOOK` | 目标应用的 authenticated Deploy Webhook |
| `COOLIFY_TOKEN` | 仅含 Deploy 权限的 Coolify API Token |

Repository/Environment Variables：

| 名称 | 用途 |
| --- | --- |
| `PUBLIC_BASE_URL` | 生产站点根 URL，例如 `https://oaktechz.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js 构建时公开配置 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js 构建时公开 anon key |

真实密钥只存放在 GitHub/Coolify 的密钥设施中。不得提交 `.env.local`、Token、Cookie、数据库 URL 中的密码或 OAuth Client Secret。

## 5. Coolify 配置

1. 应用绑定 `main` 和项目 Dockerfile，运行端口为项目声明端口。
2. 配置域名、TLS、健康检查、持久卷和 Runtime Variables。
3. 复制 Configuration → Webhooks → Deploy Webhook。
4. 创建只含 Deploy 权限的 API Token。
5. 把二者保存到 GitHub `production` Environment。
6. 关闭“push 即自动部署”，避免 CI 未完成时提前上线；正式部署只接受 GitHub Actions 的 authenticated webhook。
7. 保留至少一个已验证镜像，便于快速回滚。

## 6. 标准流水线阶段

仓库实现位于 `.github/workflows/ci-deploy.yml`。

### Verify

1. `actions/checkout` 获取精确 commit。
2. 固定 Node 大版本并使用 lockfile 执行 `npm ci`。
3. 运行单元/契约测试。
4. 运行 TypeScript 检查。
5. 运行 Next.js 生产构建。
6. 任一步失败即终止，不调用 Coolify。

### Deploy

1. 仅允许 `main` 且 Verify 成功。
2. 校验 Deploy Webhook 与 Token 均已配置。
3. 调用 Coolify authenticated webhook。
4. 等待生产 `/api/health` 返回与当前 `package.json` 一致的版本。
5. 验证关键匿名路由、受保护路由和下载路由。

### OakTech 软件商店专项验收

- 首页 GET 返回 200。
- `/api/health` 返回目标版本。
- `/releases/gitfinder-2/alpha/latest-mac.yml` 与 `latest.yml` 的 GET/HEAD 正常。
- 安装包 Range 请求返回 206；这些路由不访问 Supabase 或 Casdoor。
- 未登录 Dashboard 被重定向；管理员 Server Action/API 仍执行服务端权限判断。
- 启用 Casdoor 时完成真实登录、回调、退出；身份服务不可用不影响公开下载。

## 7. 数据库与持久卷

- 代码部署不得自动删除数据库表、用户、Release 或持久卷文件。
- destructive migration 必须单独审批、先备份、提供前后计数和回滚方案。
- 软件制品先写临时文件，服务端校验大小/哈希后再提升到持久目录。
- `catalog.json`、不可变版本 manifest 与制品必须位于持久卷，不依赖容器可写层。
- 回滚应用镜像不会自动回滚持久数据；两者必须分别记录。

## 8. 失败处理

| 失败位置 | 处理方式 |
| --- | --- |
| `npm ci` | 检查 lockfile、Node 版本、registry；禁止改用非锁定安装掩盖问题 |
| 测试/类型/构建 | 修复源代码后重新提交；不得跳过门禁直接部署 |
| Webhook 401/403 | 检查 Token 权限与 Secret 是否对应当前 Coolify 实例 |
| Coolify 构建失败 | 查看 deployment log，生产保持上一健康镜像 |
| 健康版本未收敛 | 比对部署 commit、缓存、镜像 tag 和 health 响应；不标记成功 |
| 公网 5xx/404 | 检查域名路由、容器端口、反向代理和健康检查 |
| 登录失败 | 可切回旧认证模式；公开下载和健康检查必须继续工作 |

## 9. 回滚

1. 在 Coolify 选择上一已验证 deployment/image。
2. 回滚后再次检查 `/api/health`、首页和关键 API。
3. 若本次包含 additive migration，保留新增字段/表通常比逆向删除更安全。
4. 不因代码回滚自动删除新上传的制品、Release 草稿或用户数据。
5. 在项目 `RELEASE_LOG.md` 记录触发原因、版本、commit、验证和遗留数据。

## 10. 每次发布完成标准

- GitHub CI 全绿。
- Coolify deployment 显示成功。
- 公网 health 返回目标版本与 service 名称。
- 关键用户路径从公网实际验证。
- 公开下载不依赖认证服务。
- 版本、commit、环境、迁移、验证和回滚点已写入项目发布记录。

只满足“代码已 push”或“Coolify 容器已启动”都不算发布完成。
