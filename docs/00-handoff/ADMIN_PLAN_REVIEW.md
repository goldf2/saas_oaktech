# 管理员开发方案：实施前审查与并行协作补充

审查日期：2026-09-16；审查任务：`tsk_60f6b98e4cfc3b1c`；代码基线：`54a42b33bc5fc3e9c42541fdd3bdd6fae4700bce` / `0.1.25`。

本文件只补充工程审查，不是另一套主方案或进度账本。**主设计以同目录 DEVELOPMENT_PLAN.md 为准，任务状态只写 TASKS.json，测试编号只采用 TEST_MATRIX.md 的 A01～A40。** 文档中尚未实现的内容不能作为已可用功能；本轮不写生产账号、秘密或权限。

## 1. 当前证据与接续前复核

2026-09-16T15:46:05+08:00 重新检查：仓库 main 在上述基线；开发环境 Node v24.17.0，npm 11.13.0，lockfile 中 Next 16.2.9、React 19.0.0、NextAuth 4.24.15、TypeScript 5.7.2。现有测试重新执行 63/63，通过的是既有商城和下载行为，不是新管理员功能。生产匿名 `/api/health` 当时返回0.1.25。

`lib/store/admin.ts` 仍用三个旧环境名单，`lib/auth-options.ts` 的会话回调只保留最小身份，当前没有超管角色库、初始化页面或用户授权页面。全项目源码检索未发现 `OAKTECH_BOOTSTRAP_ADMIN`、`requireSuperAdmin`、`super_admin` 的实现。以上仅说明该基线，不应被下一执行者直接当成未来的当前状态；接手必须重新读 HEAD、工作树和 TASKS。

## 2. 审查项与完成证据

| 审查编号 | 对应任务/测试 | 实施者必须补齐的证据 |
| --- | --- | --- |
| REV-01 | ADM-01/02；A01～A03 | 实际目标数据库/连接方式、Node与容器的兼容PoC，跨进程事务；不能只检查ORM代码或同进程mock |
| REV-02 | ADM-02/11；A02、A31 | 首次建库必须显式运维批准；web连接空库/错库不得自动产生新认领窗口 |
| REV-03 | ADM-03；A04～A06、A25 | issuer/subject作用域与近期认证来源；不以JWT iat/刷新时间冒充auth_time |
| REV-04 | ADM-04/05；A08～A15 | 退役指纹历史、A→B→A轮换、多实例配置冲突、失败事务后的限流计数保留 |
| REV-05 | ADM-07/09；A20～A23 | 最后超管与撤权提交的确定性并发测试；权限SQL和商品JSON不能被描述成同一事务 |
| REV-06 | ADM-06/08；A16、A17、A24 | 当前会话没有邮箱/昵称时，人员仍可在本应用候选列表辨识账号；正常工作流不手填subject |
| REV-07 | ADM-09～11；A27～A34 | 旧白名单无故障兜底；私有角色库/备份不在发布目录，恢复后处理撤权与旧会话 |
| REV-08 | ADM-12～14、OPS-01；A35～A39 | 按代码、测试、CI、实际部署、真实账号和运维签收分别提交证据，不用一个health代替整条链路 |

这些是主任务的验收补充，不增加第二套“已完成百分比”。采纳审查意见时直接更新原任务 acceptance/evidence；拒绝某项需在技术ADR解释并提供等价的安全保证。

## 3. 数据库路线必须先收敛，再写实现

主方案将 PostgreSQL 独立schema/最小权限服务端连接作为技术提案；这一点不是已经配置完成的事实，也不等于必须复用当前 Supabase 的身份或支付表。ADM-01 应明确实例位置、网络访问、备份负责人、普通运行连接与迁移连接权限，以及双存储提交问题的解决路线。

本轮独立草案曾考虑本地持久卷SQLite，但它只是备选，已归档至不入Git的比较材料，**不是与主PG路线并行实施的第二方案**。需要改路线时先更新主ADR与TASKS，避免不同AI各自写一种数据库实现。

若选择SQLite备选，必须额外证明实际Node22 Alpine runner与Node24开发/CI、原生驱动及standalone打包均可运行；角色事务与最后超管保护使用独立数据库连接而非仅内存锁。SQLite WAL有单机共享内存边界，不能把多节点独立数据库称为全局互斥；在线备份使用一致快照手段。[R3][R4]

## 4. 长上传撤权：必须验证提交顺序与断连

当前业务元数据写入 `catalog.json`，权限计划写SQL，不能直接承诺全局事务。大文件上传、签名与哈希在临界区外执行；最终业务提交必须由已经证明的授权协调保护，而非入口和提交前各查一次。

ADM-01应先定义线性化点，ADM-09再实现并通过A23：

- 撤权先提交并返回后，尚未落地的旧权限业务提交被拒绝；临时上传清理不得误删已有制品。
- 业务已在合法授权下完成提交后，后续撤权不能追溯撤销既成操作；界面不能承诺这一点。
- 连接断开、进程终止、SQL锁释放、文件rename失败、请求重试都必须分别注入。PG advisory lock或行锁随连接丢失不再持有；如果另一段文件写入仍继续，不能据此认定撤权保护仍有效。
- 单写实例约束和统一提交协调必须覆盖所有人类管理入口及最终上传登记；保留机器上传的独立最小权限。不要因为初始化使用数据库事务，就把商品目录多实例安全也标为完成。

若无法可靠证明，主方案已要求通过ADR选择事务化变更意图/outbox或必要元数据同库化。这里不能临时用“有风险，用户自行承担”替代上线门槛。

对于SQLite备选，better-sqlite3明确指出同步transaction包装不适用于async函数。不能把异步rename或网络操作放入这样的回调而误以为锁仍有效；优先验证短同步提交临界区或独立协调设计，不长期占锁等待大文件。[R3]

## 5. 初始化与恢复的单调状态

“没有超管”和“从未初始化”不是同一个条件。已完成标记必须独立持久存在；缺库/错库/缺卷不能通过启动代码自动创建空状态。运行服务不得使用没有installation校验的自动建库路径。整个卷丢失的情况也不能靠卷内另一个标记自动识别新装，仍需运维显式provision。

口令轮换应保留所有已退役摘要的消费/到期记录。重复配置旧口令不延寿，失败事务不能回滚掉限流计数。有效期登记必须是受控启动/运维操作，不由GET初始化页触发；完成后哪怕配置另一口令也拒绝再次认领。清空角色库、删除完成标记或重新打开旧名单不是恢复方案。

恢复备份可能带回后来被撤销的权限。恢复工具必须对账角色名单并改变权限/会话版本，使旧管理会话不再具有隐含特权；删除初始化环境变量本身并不会完成这种会话处置。真实IdP账号被删除或MFA丢失，应区分身份恢复与应用角色恢复。

## 6. 接续跟踪必须真实、及时且只有一个源

使用主账本TASKS.json：每个真实开发检查点更新owner、status、next_action、blockers和evidence，再渲染PROGRESS，最后运行handoff校验。未认领任务不填写虚构负责人；没有进程运行时，不声称AI在后台继续开发或实时监听。

证据至少有任务ID、时间时区、目标commit、环境、实际命令/步骤、结果与限制。关键验收摘要必须随仓库提交；只给Mac绝对路径、.local-verification目录、AgentDock任务ID或24小时后过期的截图URL，无法让另一台机器接续。原始私密日志可留受控存储，但必须提供仓库内脱敏索引。

状态分层：文档done≠功能implemented；本地tests passed≠生产deployed；生产health更新≠真实超管已绑定。当前63项旧测试和本次文档工具新增测试不能填进尚不存在的管理员验收结果。

开发中的部分权限代码先在功能分支保存可验证切片。不要把“Coolify项目默认推送”理解成每完成半个角色功能就推main并自动替换生产授权。新增初始化、迁移、旧名单退出应按主计划的阶段门禁整体切换；实际生产账号、秘密和维护窗口须核准。

## 7. 本轮并行协作记录

检测到同一仓库同时存在三条规划任务：`tsk_95d98f2ddb1818f0`、`tsk_88f6f2ca38a4c7db`、本任务 `tsk_60f6b98e4cfc3b1c`。已先写入的 `docs/00-handoff/DEVELOPMENT_PLAN.md`、`TASKS.json`、`TEST_MATRIX.md` 作为主文档体系；不由本任务改写其他任务状态或抢占owner。

本任务最初写入的 `docs/admin-bootstrap/DEVELOPMENT_PLAN.md` 与 `ACCEPTANCE.md` 是本任务自己的未提交草案，发现冲突后已保留原始字节及SHA-256到 `.local-verification/admin-plan-coordination-20260916/` 并撤出活动文档目录。没有删除其他执行者的文件。此后只在独立worktree维护本审查文件，最终通过明确提交整合，不使用git add .收走他方未完成资料。

该记录用于防止其他AI恢复时再次生成第二个计划/任务板。不得将其理解为已向另一聊天线程发送消息；本次没有执行跨线程通知，也不假装其他执行者已确认收件。

## 8. 一手依据

本补充遵循项目CT-ADMIN-001；以下资料用于核对技术边界，具体阈值和路径仍为项目设计。查阅日期2026-09-16。

- [R1] OIDC Core稳定身份、max_age与auth_time：https://openid.net/specs/openid-connect-core-1_0.html
- [R2] OWASP默认拒绝、每次请求授权：https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- [R3] better-sqlite3官方API，尤其异步事务限制：https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
- [R4] SQLite隔离、WAL及一致备份：https://www.sqlite.org/isolation.html 、https://www.sqlite.org/wal.html 、https://www.sqlite.org/backup.html
- [R5] OWASP跨站请求防护：https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
