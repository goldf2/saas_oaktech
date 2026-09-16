# 生产商品目录补录：认证工具与缠序

时间：2026-09-16T13:46:53+08:00；源码版本：0.1.24。

## 问题与范围

用户两次反馈认证工具、缠论工具在商城不可见，并提供仅有X与GitFinder卡片的截图。公网0.1.23的中文/英文目录及两个详情路由复核一致：两个目标详情404。此前只新增了后台资料模板与图标修复，没有把两款商品写进已经存在的持久目录，导致模板存在但公开商品仍不存在。

本次目标是补齐两个真实商品记录，而不是在前端重新叠加静态默认数据。用户本轮要求恢复展示，授权范围限定为 `open-play` 与 `chanxu-tradingview` 的商品展示，不包括软件Release发布、安装包上传、current切换或管理员提权。

## 实现

- `scripts/restore-product-listings.mjs`：生产容器启动前的一次性数据迁移。
- `scripts/migrations/20260916-product-listings.json`：两款商品的固定迁移快照，含独立名称、分类、图片和双语介绍。
- `Dockerfile`：以 `node scripts/restore-product-listings.mjs && exec node server.js` 启动，迁移失败不启动新实例。
- `.dockerignore`：排除本地验证产物和GitFinder运行目录，避免把截图、备份混入镜像。

迁移只对配置的 `RELEASE_STORAGE_ROOT/catalog.json` 操作：没有既有目录则跳过，不创建假生产目录；存在记录时保留原id及全部自定义资料，仅恢复指定商品的公开展示；缺失时仅新增这两个商品。`releases` 和所有其他目录字段均保留，不生成历史假版本、不添加安装包。

每次实际迁移在写入前保存原始字节备份，位于 `RELEASE_STORAGE_ROOT/.catalog-migrations/backups/`，权限0600。备份路径、原始SHA-256、两目标变更、前后商品/Release计数和时间与商品变更一起写入 `catalog.json` 的 `dataMigrations`。

固定迁移id为 `20260916-restore-open-play-and-chanxu`。完成标记与数据原子写入，后续重启不会重复执行；管理员以后主动隐藏或删除商品不会被自动恢复。独立迁移锁避免并发重复迁移，保存前再次比对原始字节，发现并发编辑就拒绝覆盖。此机制不是通用多实例事务锁，仍遵守一个目录写入进程的部署边界。

## 验证

- 新增10项专项测试：只补两个商品、版本不变、保留已有自定义资料、重复/损坏数据拒绝、dry-run无写入、原始字节备份、幂等与后续下架保留、并发启动、缺目录跳过、真实启动命令错误退出。
- 独立worktree完整51/51测试、TypeScript检查、生产Webpack构建通过。该worktree不包含主工作区另一个任务正在编写的Open Play下载/自动更新代码。
- `node scripts/verify-product-recovery.mjs` 6组真实浏览器检查通过：以只有X/GitFinder的持久目录启动迁移后变成4个商品，中英文首页、两款独立详情与分类可见，图片正常，没有虚构下载文件，二次启动不再改目录。
- 本地结果：`/Users/tefulong/.agentdock/tmp/oaktech-recovery-results-iZhKba/`，已查看中文目录截图。最终上线情况另写主项目 `.local-verification/0.1.24/product-recovery-deployment.json`，必须以公网卡片和详情实际可见为准。

## 运维与回滚

先检查：

```sh
node scripts/restore-product-listings.mjs --dry-run
```

正常生产启动已自动执行一次性迁移。审计凭据在目录自身 `dataMigrations` 中，精确备份文件路径以对应entry的backupPath为准。回滚代码不自动撤销已完成的数据迁移；需要撤销商品展示时，应在后台只更改这两个商品。禁止在出现后续商品/Release编辑后盲目用旧整库备份覆盖，以免丢失其他工作。

源码提交、镜像部署、迁移运行、公网可见是不同阶段；未取得最终公网证据前不宣称恢复完成。GitHub部署步骤缺凭据与Coolify实际自动部署的状态仍分别记录。
