# 下一位人员 / AI 接续单

## 现在接哪一项

**唯一下一开发任务：ADM-02（身份、角色、安装状态与审计schema）。** 先核对TASKS和工作树，任务尚未认领。ADM-01已完成真实PostgreSQL的跨进程、断连和持久化PoC；其代码在 `scripts/admin-poc/`，不是生产授权实现。

先读 [ADR-0001](../adr/ADR-0001-admin-storage.md) 与 [本轮证据](evidence/2026-09-16-admin-storage-poc.json)。重点继承：拒绝SQL锁＋外部JSON重命名的伪事务；首次口令到期必须在取得锁以后重新按数据库实时时钟检查。正式实现不要直接暴露试验worker或允许其测试身份字段作为用户登录凭据。

ADM-02的第一步是实现正式schema/版本迁移、显式新安装准备与安装标识核对、最小数据库权限、缺失/损坏失败关闭。原型尚未实现角色变更的近期认证、CSRF、限流、完整凭据轮换或生产迁移；这些仍是后续任务，不可虚报完成。

生产目前仍是旧白名单，用户无法仅靠新增bootstrap环境变量完成超管认领。生产连接/卷/私有网络尚待运维在ADM-11接入；本地测试命令 `npm run test:admin-storage` 可用，运行方法见 [原型说明](../../scripts/admin-poc/README.md)。

## 5分钟恢复顺序

```bash
git status --short
git log -5 --oneline
node -p "require('./package.json').version"
npm run handoff:check
```

随后读 [CURRENT_STATE.md](CURRENT_STATE.md)、[PROGRESS.md](PROGRESS.md)、[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) 和 [TEST_MATRIX.md](TEST_MATRIX.md)。权限标准已在 [仓库内](../standards/CT-ADMIN-001-v1.0.0.md)，不要求访问原Mac路径。源码基线、实际HTTP与测试结果见 [evidence/2026-09-16-baseline.json](evidence/2026-09-16-baseline.json)。

## 开发中怎样及时留进度

开始任务：记录ID、owner、影响文件、依赖完成情况、计划验证和当前HEAD。使用主工作区前确认没有别人改动；否则独立worktree。不要把别人的工作stash、重置或一起提交。

每完成一个可运行切片或遇阻塞：先保存脱敏证据，再更新TASKS的status/evidence/next_action/blockers、revision与带时区updated_at；刷新进度；重写CURRENT_STATE的当前事实，并追加SESSION_LOG。发现历史文档错误要修正摘要、保留历史而非堆多个“当前状态”。

```bash
npm run handoff:render
npm run handoff:check
```

交接或离开前：写下真实未提交文件、已跑命令及结果、未跑项目、失败原因、下一条可执行动作。任务暂停应标todo/blocked而非长期保留“正在开发”；确有未完成活动时填写owner和明确的接续时间点，不假设AI离线后继续工作。

## 状态词义

| 状态 | 使用条件 |
| --- | --- |
| todo | 尚未开始；等待前置任务不自动等于发生异常阻塞 |
| in_progress | 有明确执行者正在本次会话工作，依赖已完成 |
| blocked | 有独立可描述的环境/授权/技术阻塞，写明解除条件 |
| in_review | 实现或交付物已提交验证，仍未满足全部验收 |
| done | 验收通过且有真实交付和测试证据；生产任务还需真实环境证据 |
| deferred | 明确暂缓的后续任务，不能悄悄并入本轮 |

`planned_files`允许尚不存在；`evidence.path`必须真实存在。完成业务任务不得只引用开发方案作为implementation。脚本验证结构和文件存在，不判断证据是否造假，审查者仍需执行/阅读证据。

## 本轮与后续提交的边界

本轮完成ADM-01：真实数据库原型、并发/故障测试和技术ADR；不接入生产授权，不更改真实数据库、用户或发布状态。应用版本递增到0.1.27不代表超管页面已经实现。

提交之后的CI/公网收据保存在 `.local-verification/<version>/`，必要脱敏摘要在下一次正常提交写入evidence，不为更新部署收据循环触发构建。历史Open Play官网发布问题由REL-01单独处理。GitFinder历史候选由REL-03重新确认，不执行旧日志中的发布操作。

## 每次交接必须填写的最小模板

```text
任务ID / owner / 时间与时区：
目标与实际完成：
当前HEAD / 工作区 / 未提交文件：
已验证命令、退出码、证据路径：
未验证内容与环境边界：
失败或阻塞、解除条件：
唯一下一条动作：
部署/账号/软件版本是否实际改变：
```

新接手者不需要相信上一位AI的“已完成”结论；从具体commit、证据和当前页面重新核验。
