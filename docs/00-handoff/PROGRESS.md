# 开发进度（由TASKS.json生成）

> 不要直接编辑本文件。修改TASKS.json后运行 `npm run handoff:render`。

账本revision：40；更新时间：2026-09-19T08:19:10.491931+08:00；计划版本：1.0.0。

**权限主线任务完成：1/14。这是任务计数，不是代码完成百分比；PLAN-01文档不计入。**

生产超管状态：`not_implemented`；唯一下一任务：**ADM-02**。

| 任务 | 阶段/类型 | 优先级 | 状态 | 负责人 | 依赖 |
| --- | --- | --- | --- | --- | --- |
| PLAN-01 · 详细开发方案与进度接续机制 | M0 / documentation | P0 | 完成 | ChatGPT / 本轮计划任务 | 无 |
| ADM-01 · 授权存储与跨存储一致性PoC | M1 / feature | P0 | 完成 | ChatGPT / tsk_7b03b14c3ddbfb43 | PLAN-01 |
| ADM-02 · 身份、角色、安装状态与审计schema | M1 / feature | P0 | 阻塞 | ChatGPT / tsk_3177f42a860aa7cd | ADM-01 |
| ADM-03 · 服务端身份登记与近期认证证据 | M1 / feature | P0 | 待开发 | 未认领 | ADM-02 |
| ADM-04 · 一次性初始化凭据与持久有效期 | M1 / feature | P0 | 待开发 | 未认领 | ADM-02 |
| ADM-05 · 原子首位超管认领服务 | M2 / feature | P0 | 待开发 | 未认领 | ADM-03, ADM-04 |
| ADM-06 · 初始化页面与状态引导 | M2 / feature | P0 | 待开发 | 未认领 | ADM-05 |
| ADM-07 · 角色授权撤销与最后超管保护 | M2 / feature | P0 | 待开发 | 未认领 | ADM-03, ADM-05 |
| ADM-08 · 用户权限与授权审计页面 | M2 / feature | P0 | 待开发 | 未认领 | ADM-07 |
| ADM-09 · 全管理门禁接入与最终写授权 | M3 / feature | P0 | 待开发 | 未认领 | ADM-07 |
| ADM-10 · 旧白名单迁移和受控恢复 | M3 / feature | P0 | 待开发 | 未认领 | ADM-05, ADM-07, ADM-09 |
| ADM-11 · 容器持久化、私密配置和恢复演练 | M3 / feature | P0 | 待开发 | 未认领 | ADM-09, ADM-10 |
| ADM-12 · 安全并发及浏览器完整回归 | M4 / regression | P0 | 待开发 | 未认领 | ADM-06, ADM-08, ADM-09, ADM-10, ADM-11 |
| ADM-13 · 预生产真实身份授权闭环 | M4 / operations | P0 | 待开发 | 未认领 | ADM-12 |
| ADM-14 · 生产部署与负责人首位超管绑定 | M4 / operations | P0 | 待开发 | 未认领 | ADM-13 |
| OPS-01 · 核对CI与实际Coolify部署通道 | OPS / operations | P0 | 阻塞 | 未认领 | 无 |
| REL-01 · Open Play官网真实制品与公开发布 | REL / operations | P1 | 阻塞 | 未认领 | 无 |
| REL-02 · Mac和Windows旧客户端真实升级 | REL / regression | P1 | 待开发 | 未认领 | REL-01 |
| REL-03 · GitFinder历史候选复核及新发布决定 | REL / operations | P2 | 暂缓 | 未认领 | 无 |
| HARD-01 · 商品JSON目录跨进程写一致性 | HARD / feature | P1 | 暂缓 | 未认领 | 无 |
| HARD-02 · 分片会话绑定、恢复与过期清理 | HARD / feature | P1 | 暂缓 | 未认领 | 无 |
| STORE-01 · 商品内图文、版本、预览和统一发布工作台 | STORE / feature | P0 | 完成 | ChatGPT / tsk_5a4be4c4b63f215d | 无 |
| STORE-02 · 发布流程可发现性、批量上传与校验预览 | STORE / feature | P0 | 完成 | ChatGPT / tsk_b02c9763689e79dc | STORE-01 |
| VIDEO-01 · 商品介绍视频源、按需嵌入与三组编辑页 | STORE / feature | P0 | 完成 | ChatGPT / tsk_6e89bb30274d3e30 | STORE-01 |
| STORE-03 · 商品发布页面紧凑布局 | STORE / feature | P1 | 完成 | ChatGPT / tsk_df0424b2b9310843 | STORE-02, VIDEO-01 |
| PUB-01 · 商品资料与软件版本独立发布 | STORE / feature | P0 | 完成 | ChatGPT / tsk_73ee7c135620db1b | STORE-02, VIDEO-01 |
| DASH-01 · Dashboard与商品管理统一工作台 | STORE / feature | P0 | 完成 | ChatGPT / tsk_b677b669147495db | 无 |
| DASH-02 · 软件目录与商品管理合为单一商品列表 | STORE / feature | P0 | 完成 | ChatGPT / tsk_bc34f6eb218684af | DASH-01 |
| LANG-01 · 恢复浏览器语言检测与手动偏好 | STORE / feature | P0 | 完成 | ChatGPT / tsk_5ef8f47aca946698 | 无 |
| PUB-02 · 商品图文视频发布可发现性与结果核验 | STORE / feature | P0 | 完成 | ChatGPT / tsk_d66259b906c7a92b | PUB-01 |
| LAYOUT-01 · 商品编辑整页重排与发布操作清晰化 | STORE / feature | P0 | 完成 | ChatGPT / tsk_5c35347895781361 | 无 |
| STORE-04 · 应用商店式展示与平台预置多选 | STORE / feature | P0 | 完成 | ChatGPT / tsk_eaf097a0ba893bd8 | PUB-02, LAYOUT-01 |

## 任务详情与接续动作

### PLAN-01 · 详细开发方案与进度接续机制

状态：完成；负责人：ChatGPT / 本轮计划任务；实施：documentation_only；部署：not_applicable。

下一动作：已验收文档与工具；下一开发从ADM-01认领，不计为超管业务完成

验收条件：
- 标准快照、方案、任务、测试矩阵随仓库可访问
- 进度视图由账本生成，检查能发现状态、依赖、链接及标准漂移
- 方案完成与业务未实现明确分开，其他AI可独立接续

计划文件（可能尚未创建）：`AGENTS.md`、`docs/00-handoff/DEVELOPMENT_PLAN.md`、`docs/00-handoff/TASKS.json`、`scripts/check-handoff.mjs`

证据：
- documentation / passed：`docs/00-handoff/DEVELOPMENT_PLAN.md`
- verification / passed：`docs/00-handoff/evidence/2026-09-16-plan-validation.json`

### ADM-01 · 授权存储与跨存储一致性PoC

状态：完成；负责人：ChatGPT / tsk_7b03b14c3ddbfb43；实施：isolated_postgresql_prototype_verified；部署：not_applicable。

下一动作：工程PoC与ADR已验收；继续ADM-02正式schema/安装状态/迁移。生产连接/卷/投影尚未配置，不代表超管功能已可用。

验收条件：
- 验证PostgreSQL事务锁路线并明确部署落点、网络和副本数
- 说明JSON目录单写者与撤权提交竞态的可验证解决方案
- 记录技术ADR，不使用JSON或内存角色库回退

计划文件（可能尚未创建）：`docs/adr/ADR-0001-admin-storage.md`、`scripts/admin-poc/schema.sql`、`scripts/admin-poc/store.mjs`、`scripts/admin-poc/run.mjs`、`tests/admin-poc/storage.test.mjs`、`tests/admin-storage-boundary.test.ts`

证据：
- implementation / passed：`scripts/admin-poc/store.mjs`
- verification / passed：`docs/00-handoff/evidence/2026-09-16-admin-storage-poc.json`

### ADM-02 · 身份、角色、安装状态与审计schema

状态：阻塞；负责人：ChatGPT / tsk_3177f42a860aa7cd；实施：partial_unintegrated；部署：not_started。

下一动作：先恢复允许的接入操作并审查lib/admin三个未接入草稿；执行真实数据库与浏览器验证后才提交部署。真实超管认领仍未开始。

验收条件：
- 唯一身份、角色约束、单例installation和授权审计可事务提交
- schema和安装ID对账；缺卷、错库、损坏不被视为新安装
- 故障注入无半状态，并发锁顺序固定

计划文件（可能尚未创建）：`lib/admin/schema.mjs`、`lib/admin/config.mjs`、`lib/admin/backend.mjs`

阻塞：
- 认证/授权和后台接入写入被工具安全检查拦截，未执行；恢复允许的操作通道后才继续，不改用其他工具绕过。
- 生产专用权限数据库及该商城Coolify可操作页面当前未配置/不可访问；部署负责人需提供已授权入口，秘密仅在部署平台填写。

证据：
- observation / partial：`docs/00-handoff/evidence/2026-09-17-admin-setup-attempt.json`

### ADM-03 · 服务端身份登记与近期认证证据

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：实现最小principal登记、身份隔离和认证时间测试

验收条件：
- 只根据已验证issuer+subject登记最小身份，默认user
- 候选账号可辨识，不使用邮箱/姓名授权或复制完整身份档案
- JWT刷新不能成为近期认证；真实OIDC证据单独核验

计划文件（可能尚未创建）：`lib/admin/identity.ts`、`lib/auth-options.ts`、`lib/auth.ts`

证据：尚无该任务完成证据。

### ADM-04 · 一次性初始化凭据与持久有效期

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：实现配置预检与凭据生命周期测试，不配置生产秘密

验收条件：
- 运行时token/token_file互斥，无原始秘密进入日志或前端
- 首次登记60分钟到期；重启、A/B/A轮换不延长旧指纹寿命
- 完成后永不再次开放，无凭据/异常存储拒绝认领

计划文件（可能尚未创建）：`lib/admin/bootstrap-config.ts`、`scripts/admin/preflight.mjs`

证据：尚无该任务完成证据。

### ADM-05 · 原子首位超管认领服务

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：先写服务端并发和故障用例，再实现认领

验收条件：
- 正常会话、口令、确认、同源/CSRF与跨实例限速均通过才绑定当前账号
- 角色、消费、完成标记和审计同事务，多个账号并发只有一次首次成功
- 伪造目标身份无效，GET无特权副作用，重试幂等

计划文件（可能尚未创建）：`lib/admin/bootstrap.ts`、`app/setup/admin/actions.ts`

证据：尚无该任务完成证据。

### ADM-06 · 初始化页面与状态引导

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：围绕服务端状态契约实现页面，不造假成功提示

验收条件：
- 区分未登录、未配置、可认领、已完成、存储异常
- 无需手工抄subject；秘密不回显、不入URL或浏览器持久存储
- 390px、键盘、确认、错误及重复提交的浏览器验收通过

计划文件（可能尚未创建）：`app/setup/admin/page.tsx`、`components/admin/bootstrap-form.tsx`、`components/admin/access-notice.tsx`

证据：尚无该任务完成证据。

### ADM-07 · 角色授权撤销与最后超管保护

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：实现权限矩阵和真实数据库并发测试

验收条件：
- 仅super_admin可改角色；目标、revision、幂等请求均校验
- 角色/版本/审计同事务；并发操作不移除最后有效超管
- 下一请求使用新权限，机器无角色管理权，超管转交需近期认证

计划文件（可能尚未创建）：`lib/admin/authorization.ts`、`lib/admin/roles.ts`、`lib/admin/audit.ts`

证据：尚无该任务完成证据。

### ADM-08 · 用户权限与授权审计页面

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：隔离账号跑用户选择、授权、撤权和审计闭环

验收条件：
- 只列本应用已登记身份，超管可授予/撤销管理员
- 普通管理员直接请求不能读写用户/审计管理内容
- 分页、空状态、冲突、停用与转交确认通过

计划文件（可能尚未创建）：`app/admin/users/page.tsx`、`app/admin/users/actions.ts`、`app/admin/audit/page.tsx`

证据：尚无该任务完成证据。

### ADM-09 · 全管理门禁接入与最终写授权

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：落实ADM-01的一致性方案并复现撤权/文件提交竞争

验收条件：
- 枚举全部Server Action/API与页面，统一角色库门禁且无名单旁路
- 解决SQL角色/JSON目录最终提交竞态，断连和并发撤权不通过不得上线
- 角色库故障特权失败关闭，匿名下载和机器草稿范围保持

计划文件（可能尚未创建）：`lib/store/admin.ts`、`app/admin/actions.ts`、`app/api/admin/releases/upload/route.ts`、`app/layout.tsx`

证据：尚无该任务完成证据。

### ADM-10 · 旧白名单迁移和受控恢复

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：实现dry-run、迁移、恢复与审计测试，不直接改生产权限

验收条件：
- 迁移前备份和身份盘点，只把明确认领者设为super_admin
- 切换后旧名单不覆盖撤权，回滚不能静默恢复旧角色
- 恢复核验目标/安装且独立审计，不清空永久完成标记

计划文件（可能尚未创建）：`scripts/admin/migrate-legacy.mjs`、`scripts/admin/recover.mjs`、`docs/admin-migration-runbook.md`

证据：尚无该任务完成证据。

### ADM-11 · 容器持久化、私密配置和恢复演练

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：交付实际可执行命令和隔离容器恢复报告

验收条件：
- 明确数据库/私有安装标识/运行时秘密与单写者拓扑
- 重建容器和删除口令保留角色，空卷/坏库不重开认领
- 备份恢复对账角色/完成标记/会话，镜像和bundle不含秘密

计划文件（可能尚未创建）：`Dockerfile`、`docs/deploy-coolify.md`、`docs/admin-container-example.md`

证据：尚无该任务完成证据。

### ADM-12 · 安全并发及浏览器完整回归

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：锁定测试commit并执行隔离安全矩阵，标清合成身份范围

验收条件：
- TEST_MATRIX适用U/I/B逐项执行且有真实命令/报告
- 两个独立进程验证初始化、最后超管、撤权和故障恢复
- 已有商品、上传、签名及公开下载回归不破坏

计划文件（可能尚未创建）：`tests/admin-bootstrap.test.ts`、`tests/admin-roles.test.ts`、`tests/admin-migration.test.ts`、`scripts/verify-admin-ui.mjs`

证据：尚无该任务完成证据。

### ADM-13 · 预生产真实身份授权闭环

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：准备授权的预生产环境和操作者，不索取密码或Cookie

验收条件：
- 真实Casdoor登录、MFA和近期认证能力验证
- 认领→其他账号登记→授权→业务草稿保存→撤权→旧会话拒绝
- 删口令/重启后角色保留，不使用合成Cookie替代真实账号

计划文件（可能尚未创建）：`docs/00-handoff/evidence/admin-staging-acceptance.json`

证据：尚无该任务完成证据。

### ADM-14 · 生产部署与负责人首位超管绑定

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：安排明确生产窗口和真实负责人操作，不能自动签发生产用户会话

验收条件：
- 部署commit、镜像、迁移备份与真实入口分别核验
- 负责人认领成功，删除运行时初始化秘密后权限仍有效
- 另一账号授权/撤权与公开下载回归通过才称已配置好

计划文件（可能尚未创建）：`docs/00-handoff/evidence/admin-production-acceptance.json`、`docs/00-handoff/RELEASE_LOG.md`

证据：尚无该任务完成证据。

### OPS-01 · 核对CI与实际Coolify部署通道

状态：阻塞；负责人：未认领；实施：requires_reverification；部署：blocked。

下一动作：先只读确认既有授权部署入口；缺少秘密则由运维在目标应用配置

验收条件：
- 确认实际部署触发来源与变量配置，不输出秘密
- 测试失败不部署；成功CI与实际提交/镜像/health可关联
- 执行一次可追踪发布并保留失败回滚证据

计划文件（可能尚未创建）：`.github/workflows/ci-deploy.yml`、`docs/cicd-web-coolify.md`

阻塞：
- 历史CI的Require deployment credentials失败；实际health会更新，但触发来源尚未确认。需重新核对合法部署入口与配置。

证据：
- observation / partial：`docs/00-handoff/evidence/2026-09-16-baseline.json`

### REL-01 · Open Play官网真实制品与公开发布

状态：阻塞；负责人：未认领；实施：requires_reverification；部署：blocked。

下一动作：取得实际管理员授权后单独确认官网发布，不能以商品可见替代软件发布

验收条件：
- 由真实授权管理员确认目标版本、来源提交和制品
- 签名和哈希校验后人工公开版本，不能只上传元数据
- 官网清单、HEAD/Range、完整下载和旧版保留验证

计划文件（可能尚未创建）：`app/admin/releases/page.tsx`、`docs/open-play-update-compatibility.md`

阻塞：
- 当前账号超管绑定未完成；0.1.25历史收据记载官网制品未上传/未发布，本轮两个公开feed复测404。

证据：
- observation / partial：`docs/00-handoff/evidence/2026-09-16-baseline.json`

### REL-02 · Mac和Windows旧客户端真实升级

状态：待开发；负责人：未认领；实施：requires_reverification；部署：not_started。

下一动作：使用两端可用测试设备和脱敏测试配置完成升级闭环

验收条件：
- 两端实际旧客户端检查、下载、安装、重启和版本核验
- 测试账号数据保留、取消/失败恢复和签名拒绝
- 不以网页或合成客户端请求替代原生升级

计划文件（可能尚未创建）：`docs/00-handoff/evidence/open-play-client-acceptance.json`

证据：尚无该任务完成证据。

### REL-03 · GitFinder历史候选复核及新发布决定

状态：暂缓；负责人：未认领；实施：requires_reverification；部署：not_started。

下一动作：当前先做权限闭环；获明确发布范围后恢复该任务

验收条件：
- 重新读取当前版本、候选来源与制品状态
- 明确负责人本次发布目标，历史alpha.93待办不自动执行

计划文件（可能尚未创建）：`docs/00-handoff/RELEASE_LOG.md`

证据：尚无该任务完成证据。

### HARD-01 · 商品JSON目录跨进程写一致性

状态：暂缓；负责人：未认领；实施：not_started；部署：not_started。

下一动作：权限主线后专项；若ADM-09证明必要则在账本显式提升，不静默扩范围

验收条件：
- 多写进程不丢更新，声明实际部署拓扑
- 若迁库需覆盖目录可见性、软件版本和备份恢复

计划文件（可能尚未创建）：`lib/store/file-catalog.ts`、`tests/store-workflows.test.ts`

证据：尚无该任务完成证据。

### HARD-02 · 分片会话绑定、恢复与过期清理

状态：暂缓；负责人：未认领；实施：not_started；部署：not_started。

下一动作：后续专项；8MiB分片不能直接称为自动断线续传

验收条件：
- 上传会话绑定身份/版本/文件，offset与重试有幂等约束
- 中断可恢复或安全清理，不误删仍有效上传

计划文件（可能尚未创建）：`lib/store/storage.ts`、`app/api/admin/releases/upload/route.ts`、`components/admin/artifact-upload.tsx`

证据：尚无该任务完成证据。

### STORE-01 · 商品内图文、版本、预览和统一发布工作台

状态：完成；负责人：ChatGPT / tsk_5a4be4c4b63f215d；实施：complete_local_browser_verified；部署：0.1.29_correction_validated_pending_public_observation。

下一动作：核验0.1.29默认Turbopack构建的远程CI与公网新界面；不将0.1.28失败构建写成已部署，后续独立推进本地超管设计。

验收条件：
- 版本管理归属于商品，图文和软件版本在同一编辑工作台操作
- 支持安全图片上传、截图排序/移除与真实店面预览
- 保存草稿不改已发布商品，统一发布显式选择待发布版本且校验失败不半发布
- 单元/浏览器验证通过，旧下载地址兼容，管理员草稿不受影响

计划文件（可能尚未创建）：`components/admin/product-workspace.tsx`、`app/admin/products/[slug]/page.tsx`、`lib/store/product-workspace.ts`、`lib/store/product-media.ts`

证据：
- verification / partial：`docs/00-handoff/evidence/2026-09-17-product-workspace-partial.json`
- verification / partial：`docs/00-handoff/evidence/2026-09-17-product-workspace-api-progress.json`
- observation / failed：`docs/00-handoff/evidence/2026-09-17-product-workspace-route-block.json`
- verification / partial：`docs/00-handoff/evidence/2026-09-17-product-workspace-mounted.json`
- verification / passed：`docs/00-handoff/evidence/2026-09-17-product-workspace-complete.json`
- implementation / passed：`app/admin/products/[slug]/page.tsx`
- implementation / passed：`app/admin/products/page.tsx`
- verification / passed：`docs/00-handoff/evidence/2026-09-17-product-workspace-turbopack-fix.json`

### STORE-02 · 发布流程可发现性、批量上传与校验预览

状态：完成；负责人：ChatGPT / tsk_b02c9763689e79dc；实施：complete_local_browser_verified；部署：0.1.30_pending_remote_delivery。

下一动作：核对0.1.30独立分支的远程CI与官网代码版本；UI代码发布不自动上传或公开任何软件草稿。其他本地管理员工作继续独立接续。

验收条件：
- 新建版本时上传区始终可见，未保存时明确禁用；中文默认复用到英文且不隐藏必填校验
- 文件多选/拖放、可调整平台架构类型、服务端确认进度、失败/不确定提交不自动重复上传
- 资料保存/文件齐备/真实签名校验/正式发布区别明确，同渠道不误选多个待发布版本
- 保持原服务器权限/签名/草稿不可下载约束，真实隔离浏览器和回归通过

计划文件（可能尚未创建）：`components/admin/product-releases.tsx`、`components/admin/artifact-upload.tsx`、`components/admin/product-workspace.tsx`、`lib/store/release-workflow.ts`、`components/admin/publication-review.tsx`、`scripts/verify-release-workflow.mjs`

证据：
- implementation / passed：`components/admin/product-releases.tsx`
- implementation / passed：`components/admin/publication-review.tsx`
- verification / passed：`docs/00-handoff/evidence/2026-09-17-release-workflow-ui.json`

### VIDEO-01 · 商品介绍视频源、按需嵌入与三组编辑页

状态：完成；负责人：ChatGPT / tsk_6e89bb30274d3e30；实施：complete_browser_and_real_players_verified；部署：candidate_verified_pending_push。

下一动作：核对源码推送、CI与公网版本；不要自动给生产商品添加测试视频。GitHub自动同步与本地超管独立推进。

验收条件：
- YouTube与B站视频可在商品页内播放，同视频可添加多个来源
- 商品视频封面和链接遵守草稿隔离及显式发布
- 未知来源只提供安全外链，未点击不连接第三方播放器
- 正常表单输入、预览、发布、重新启动有浏览器验证，既有发布流程不回退

计划文件（可能尚未创建）：`lib/store/product-videos.ts`、`components/product-videos.tsx`、`components/admin/product-video-editor.tsx`、`components/admin/product-workspace.tsx`

证据：
- verification / passed：`docs/00-handoff/evidence/2026-09-18-product-videos.json`
- implementation / passed：`components/product-videos.tsx`
- documentation / passed：`docs/product-video-sources.md`

### STORE-03 · 商品发布页面紧凑布局

状态：完成；负责人：ChatGPT / tsk_df0424b2b9310843；实施：compact_layout_local_browser_verified；部署：pending_remote_delivery。

下一动作：核对远程CI、官网health和代码版本；不自动发布真实软件草稿。

验收条件：
- 版本资料/上传/确认密度提升，必要入口和状态不隐藏，基本文字可读
- 合并重复文件清单，商品整页预览按需展开，保留视频与现有发布逻辑
- 记录同屏尺寸对比，390px/1024px/1440px无溢出，上传发布回归通过

计划文件（可能尚未创建）：`components/admin/product-workspace.tsx`、`components/admin/product-releases.tsx`、`components/admin/artifact-upload.tsx`、`components/admin/publication-review.tsx`、`components/admin/release-file-list.tsx`、`scripts/verify-compact-release.mjs`

证据：
- implementation / passed：`components/admin/release-file-list.tsx`
- verification / passed：`docs/00-handoff/evidence/2026-09-18-compact-release-layout.json`

### PUB-01 · 商品资料与软件版本独立发布

状态：完成；负责人：ChatGPT / tsk_73ee7c135620db1b；实施：complete_integrated_browser_verified；部署：pending_post_commit_public_verification。

下一动作：本地完整集成已验证；提交推送后分别核对remote main、CI、health与工作台资源，不使用公开health冒充真实账号发布验收。

验收条件：
- 商品发布只处理资料/图片/视频，不处理版本或安装包
- 软件发布只处理选中版本，不消费或校验商品草稿
- 两类请求使用独立确认与冲突校验，保留未保存输入
- 真实浏览器、原流程回归、部署核验分别记录
- 先上架商品、后创建/发布软件的真实浏览器流程通过；无版本时不生成占位下载
- 版本保存与发布不能丢失未保存的商品编辑

计划文件（可能尚未创建）：`lib/store/product-workspace.ts`、`app/admin/products/editor-actions.ts`、`components/admin/publication-review.tsx`、`components/admin/product-workspace.tsx`

证据：
- verification / passed：`docs/00-handoff/evidence/2026-09-18-publication-decoupling.json`
- implementation / passed：`lib/store/product-workspace.ts`
- verification / passed：`docs/00-handoff/evidence/2026-09-18-unified-workspace-publishing.json`

### DASH-01 · Dashboard与商品管理统一工作台

状态：完成；负责人：ChatGPT / tsk_b677b669147495db；实施：complete_integrated_browser_verified；部署：pending_post_commit_public_verification。

下一动作：本地完整集成已验证；提交推送后分别核对remote main、CI、health与工作台资源，不使用公开health冒充真实账号发布验收。

验收条件：
- 管理员打开/dashboard直接管理商品，普通用户仅看到公开软件目录和账号
- 桌面和移动导航只有一个工作台入口，旧后台书签保留筛选
- 服务端独立授权，不能通过修改查询参数读取商品草稿或提权
- 保留独立发布、视频与紧凑布局，完成角色浏览器回归后才交付

计划文件（可能尚未创建）：`app/dashboard/page.tsx`、`components/admin/product-management.tsx`、`lib/store/workspace-navigation.ts`、`components/header.tsx`、`components/mobile-nav.tsx`

证据：
- verification / passed：`docs/00-handoff/evidence/2026-09-18-unified-workspace-publishing.json`
- implementation / passed：`app/dashboard/page.tsx`
- implementation / passed：`components/admin/product-management.tsx`

### DASH-02 · 软件目录与商品管理合为单一商品列表

状态：完成；负责人：ChatGPT / tsk_bc34f6eb218684af；实施：complete_shared_list_browser_verified；部署：pending_post_commit_observation。

下一动作：提交后分别核对远端SHA、CI、health和真实会话只读页面；无生产商品/权限写入。部署收据记录在.local-verification/unified-products/deployment.json。

验收条件：
- 同一列表和卡片承载浏览/详情/下载及按管理员权限显示的编辑和软件版本操作
- 普通用户仅查询/统计已公开商品与软件，不读取管理草稿或从URL参数提权
- 旧view=library和后台列表书签归并保留筛选，账号与支持保留
- 单元/浏览器/构建验证通过，旧独立发布、视频与上传不回退

计划文件（可能尚未创建）：`app/dashboard/page.tsx`、`components/admin/product-management.tsx`、`lib/store/workspace-navigation.ts`、`lib/store/workspace-product-list.ts`、`lib/store/public-data.ts`

证据：
- implementation / passed：`components/admin/product-management.tsx`
- implementation / passed：`lib/store/workspace-product-list.ts`
- verification / passed：`docs/00-handoff/evidence/2026-09-19-unified-product-list.json`

### LANG-01 · 恢复浏览器语言检测与手动偏好

状态：完成；负责人：ChatGPT / tsk_5ef8f47aca946698；实施：complete_browser_verified；部署：pending_post_commit_verification。

下一动作：核对本次GitHub提交与线上语言协商；后台尚未国际化的固定文案属于独立翻译范围，不宣称自动翻译。

验收条件：
- 自动模式不受旧一年期自动Cookie干扰
- 明确路径优先，预取或页面读取不保存用户偏好
- 工作台及编辑页切换保留路径、筛选及未保存字段
- 中文/英文/移动及已有发布回归有真实结果

计划文件（可能尚未创建）：`i18n/config.ts`、`i18n/server.ts`、`i18n/locale-provider.tsx`、`proxy.ts`、`components/language-switcher.tsx`、`app/layout.tsx`、`components/header.tsx`、`components/footer.tsx`

证据：
- verification / passed：`docs/00-handoff/evidence/2026-09-19-language-recovery.json`
- implementation / passed：`i18n/config.ts`
- implementation / passed：`components/language-switcher.tsx`

### PUB-02 · 商品图文视频发布可发现性与结果核验

状态：完成；负责人：ChatGPT / tsk_d66259b906c7a92b；实施：implemented_and_verified_on_8acb7a4；部署：0.1.37_pending_verification。

下一动作：核对0.1.37推送和公网收据；用户自行点击发布正式资料，不代替用户执行。

验收条件：
- 有效视频链接可不填标题/封面发布；省略或空白标题兼容
- 商品发布通过明确按钮完成，无重复勾选；保留鉴权/指纹/内容校验和软件独立发布
- 受信任播放器自动加载且autoplay=0，切源/离开预览销毁旧播放器，未知来源仍外链
- 隔离端到端与生产只读核验分别记录，用户正式内容不修改

计划文件（可能尚未创建）：`components/admin/product-workspace.tsx`、`components/admin/publication-review.tsx`、`lib/store/product-publication-summary.ts`

证据：
- verification / partial：`docs/00-handoff/evidence/2026-09-19-product-publication-partial.json`
- verification / passed：`docs/00-handoff/evidence/2026-09-19-product-editor-layout.json`
- verification / passed：`docs/00-handoff/evidence/2026-09-19-simple-publishing-autoload.json`
- implementation / passed：`components/product-videos.tsx`

### LAYOUT-01 · 商品编辑整页重排与发布操作清晰化

状态：完成；负责人：ChatGPT / tsk_5c35347895781361；实施：complete_browser_verified；部署：pending_post_commit_verification。

下一动作：源码提交推送后分别读取GitHub任务和公网版本/资源；不替用户公开生产草稿。

验收条件：
- 商品文字与图片桌面双栏、手机单栏，视频链接为主字段且缺项就地提示
- 固定工具栏区分保存、预览和发布，不丢未保存输入
- 隔离环境复现用户截图并发布图文视频，无软件包也可上架
- 保留其他任务与生产数据，代码和上线分别验证

计划文件（可能尚未创建）：`components/admin/product-details-editor.tsx`、`components/admin/product-video-editor.tsx`、`components/admin/product-workspace.tsx`、`scripts/verify-product-editor-layout.mjs`

证据：
- verification / passed：`docs/00-handoff/evidence/2026-09-19-product-editor-layout.json`
- implementation / passed：`components/admin/product-details-editor.tsx`

### STORE-04 · 应用商店式展示与平台预置多选

状态：完成；负责人：ChatGPT / tsk_eaf097a0ba893bd8；实施：complete_browser_verified；部署：pending_post_commit_verification。

下一动作：提交推送后分别读取远端SHA、CI和公网页面；不公开用户草稿

验收条件：
- 按官方商店信息层级展示真实商品，不虚构评分价格下载量
- 平台预置多选、类别分离、历史值保留
- 响应式与中英文、预览发布、下载及权限回归通过
- 独立记录代码/测试/推送/公网，生产内容不变

计划文件（可能尚未创建）：`components/database-product-page.tsx`、`components/storefront-home.tsx`、`components/admin/platform-picker.tsx`、`docs/storefront-app-store-design.md`

证据：
- implementation / passed：`components/database-product-page.tsx`
- implementation / passed：`components/admin/platform-picker.tsx`
- verification / passed：`docs/00-handoff/evidence/2026-09-19-app-storefront.json`
