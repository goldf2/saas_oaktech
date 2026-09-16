# 开发进度（由TASKS.json生成）

> 不要直接编辑本文件。修改TASKS.json后运行 `npm run handoff:render`。

账本revision：2；更新时间：2026-09-16T15:59:55+08:00；计划版本：1.0.0。

**权限主线任务完成：0/14。这是任务计数，不是代码完成百分比；PLAN-01文档不计入。**

生产超管状态：`not_implemented`；唯一下一任务：**ADM-01**。

| 任务 | 阶段/类型 | 优先级 | 状态 | 负责人 | 依赖 |
| --- | --- | --- | --- | --- | --- |
| PLAN-01 · 详细开发方案与进度接续机制 | M0 / documentation | P0 | 完成 | ChatGPT / 本轮计划任务 | 无 |
| ADM-01 · 授权存储与跨存储一致性PoC | M1 / feature | P0 | 待开发 | 未认领 | PLAN-01 |
| ADM-02 · 身份、角色、安装状态与审计schema | M1 / feature | P0 | 待开发 | 未认领 | ADM-01 |
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

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：创建技术ADR和隔离数据库PoC，先验证两个独立进程的互斥与故障语义

验收条件：
- 验证PostgreSQL事务锁路线并明确部署落点、网络和副本数
- 说明JSON目录单写者与撤权提交竞态的可验证解决方案
- 记录技术ADR，不使用JSON或内存角色库回退

计划文件（可能尚未创建）：`docs/adr/ADR-0001-admin-storage.md`、`tests/admin-storage-poc.test.ts`

证据：尚无该任务完成证据。

### ADM-02 · 身份、角色、安装状态与审计schema

状态：待开发；负责人：未认领；实施：not_started；部署：not_started。

下一动作：按ADR实现SQL迁移和真实事务故障测试

验收条件：
- 唯一身份、角色约束、单例installation和授权审计可事务提交
- schema和安装ID对账；缺卷、错库、损坏不被视为新安装
- 故障注入无半状态，并发锁顺序固定

计划文件（可能尚未创建）：`lib/admin/store.ts`、`migrations/admin/001_authorization.sql`

证据：尚无该任务完成证据。

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
