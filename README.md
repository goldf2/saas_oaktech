# OakTech 软件商城 · saas_oaktech

商品发布、软件版本管理和已发布文件下载中心。GitHub仓库：`goldf2/saas_oaktech`；当前主站：`oaktechz.com`。旧oaktools-platform已封存。

## 人员 / AI 接续从这里开始

**先读 [AGENTS.md](AGENTS.md)，再看 [当前状态](docs/00-handoff/CURRENT_STATE.md) 与 [开发进度](docs/00-handoff/PROGRESS.md)。**

[详细开发方案](docs/00-handoff/DEVELOPMENT_PLAN.md) · [下一位接续单](docs/00-handoff/HANDOFF.md) · [运行手册](docs/00-handoff/RUNBOOK.md) · [测试矩阵](docs/00-handoff/TEST_MATRIX.md) · [全部交接文档](docs/00-handoff/README.md)

当前首要待实现功能是“一次性初始化超管＋后台管理其他管理员”。容器化标准已确认，但当前商城仍用环境白名单；不能把有后台页面、已写方案或站点版本更新当作超管已配置。

## 现有业务入口

| 入口 | 职责 |
| --- | --- |
| `/admin`、`/admin/products/new`、`/admin/products` | 后台总览、新增与编辑商品，仍受服务端权限控制 |
| `/admin/releases` | 版本草稿、文件上传、校验与人工发布 |
| `/releases/**` | 已发布制品与兼容更新清单 |
| `/updates/open-play/**`、`/downloads/open-play/**` | 原生更新与下载兼容；真实软件包是否已发布需单独核验 |

open play是Auth认证配置工具；缠序是TradingView缠论研究工具，各自商品资料独立。公开商品目录与已发布安装包是两个不同层级。

## 本地命令

Node版本与锁文件对齐，开发/验证说明以[RUNBOOK](docs/00-handoff/RUNBOOK.md)为准。

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm ci
# 仅在本地配置不存在时复制；按运行手册设置测试环境
test -e .env.local || cp .env.example .env.local
npm run dev

npm run handoff:render
npm run handoff:check
npm test
npm run typecheck
npm run build
```

`TASKS.json`是进度的唯一编辑源；`PROGRESS.md`生成后提交。每次开发检查点和交接必须更新任务、事实与证据，不依赖聊天窗口。未认领的任务不会在后台自行开发。

## 部署与历史

[Coolify运行说明](docs/deploy-coolify.md) · [CI/CD约定](docs/cicd-web-coolify.md) · [发布记录](docs/00-handoff/RELEASE_LOG.md) · [采用的标准](docs/standards/README.md)

代码部署不自动授予管理员，也不自动公开软件草稿。当前商品目录是一份持久JSON目录；新增角色权限需另行满足事务存储、初始化及迁移标准。

本项目源自Simple Saas Starter Kit；原始README已[归档保留](docs/00-handoff/archive/2026-09-16-original-starter-README.md)，其中旧仓库、Node18、Vercel、支付模板步骤不再是本商城当前操作手册。遗留Supabase/Creem源码不在本次权限改造中迁移。
