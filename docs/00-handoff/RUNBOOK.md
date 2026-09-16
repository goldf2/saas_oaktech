# 项目运行与交接手册

命令从仓库根目录执行。**本页第一部分是实际存在的命令；后面的管理员实施命令尚未交付，不可照抄执行。**

## 1. 已存在的开发与验证入口

本地基线Node 24.17.0；当前CI选择Node 24；Dockerfile仍使用Node 22镜像。版本差异需要在依赖或数据库驱动引入时评估，本轮未升级运行时。新设备优先对齐项目CI大版本并使用lockfile，不以旧starter README的Node 18作为现行基线。

```bash
# 安装；不触碰运行中的服务
PUPPETEER_SKIP_DOWNLOAD=true npm ci

# 本地开发：仅在本地文件不存在时创建配置，绝不覆盖现有.env.local
test -e .env.local || cp .env.example .env.local
npm run dev

# 进度更新/校验
npm run handoff:render
npm run handoff:check

# 回归与生产构建
npm test
npm run typecheck
PUPPETEER_SKIP_DOWNLOAD=true npm run build

# 构建完成后：隔离浏览器商品发布回归
npm run test:store-ui
# 隔离持久目录的一次性商品恢复回归
node scripts/verify-product-recovery.mjs
```

浏览器脚本需要实际Chrome或Puppeteer浏览器，使用测试会话和临时目录，不是生产账号验收。Node全套测试也不能代替Linux容器及真实身份服务验收。本轮文档变更的验证结果见 [交付证据](evidence/2026-09-16-plan-validation.json)。

生产已有商品目录恢复脚本 `scripts/restore-product-listings.mjs` 会在Docker启动路径执行一次性迁移，不能当成管理员初始化脚本；完成标记确保不反复上架。不要为了测试清掉生产迁移标记。

## 2. 当前授权模式

当前`lib/store/admin.ts`读取旧环境名单；Casdoor精确匹配subject。超管初始化与角色库尚未实现。已有登录、商品后台和公开下载路由，不代表`/setup/admin`或`/admin/users`已经存在。运行时添加新bootstrap变量目前无业务效果。

新机制的技术契约见 [开发方案](DEVELOPMENT_PLAN.md)，实施进度见 [生成视图](PROGRESS.md)。不要删除旧配置让现有管理入口突然失效，必须经过ADM-10迁移。

## 3. 拟新增命令（均待实现）

`admin:preflight`、`admin:migrate-legacy`、`admin:recover` 和新的管理员浏览器验收命令是待交付物，尚未登记为npm可执行脚本。实现者完成命令、帮助、dry-run、真实测试后，再移动到本页第一节。当前不能执行一个编造的恢复命令，不能通过重开初始化或清空库恢复。

拟新增配置、schema与秘密文件示例保存在开发方案，不混进当前可用 `.env.example`。不得生成固定默认超管密码。

## 4. 提交、部署与回滚

```bash
git status --short
git diff --check
npm run handoff:check
# 按本次授权范围显式git add具体文件；不要git add .收走并行工作。
# 推送前同步递增package.json及package-lock.json；不自动发布软件Release。
```

当前工作流见 [ci-deploy.yml](../../.github/workflows/ci-deploy.yml)：main测试构建后部署，Pull Request不部署。已有历史运行在部署凭据检查失败，而公网仍随后更新；这不证明全部CI成功，也不证明具体自动触发来源。OPS-01负责查清。正式上线需对照提交/镜像/健康版本与业务结果。

只读公网检查：

```bash
curl --fail --show-error --max-time 15 https://oaktechz.com/api/health
curl --silent --show-error --max-time 15 -o /dev/null -w '%{http_code}\n' https://oaktechz.com/setup/admin
```

404只表明该次匿名路径的HTTP结果；结合当前源码判断尚未实现。新增角色功能部署后还必须有真实登录绑定与权限变更证据，不只检查health。

回滚必须同时审查权限数据：旧镜像可能重新采用旧白名单，恢复了后来被撤销的权限。授权库引入后，禁止未经名单对账的旧镜像回退。商品/安装包目录是独立持久数据，回滚源码不得删除它们。

## 5. 证据放哪里

小型脱敏且需多人接续的摘要放 `docs/00-handoff/evidence/` 并加入Git；任务引用真实相对路径。大日志、截图和部署后收据放 `.local-verification/<version>/`，不入Git、不混进镜像。原始秘密、身份凭证和公开链接中的临时签名参数不得写进可分发资料。

每项证据注明观察时间、版本/commit、执行环境、命令/HTTP结果与限制。历史“63项测试通过”只属于当时对应源码；每次更改重新执行记录真实测试总数。
