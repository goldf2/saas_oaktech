# 下一位人员 / AI 接续单

## 现在接哪一项

**唯一下一开发任务：ADM-01（授权存储与跨存储一致性PoC）。** 当前未认领，先在TASKS.json填写owner、in_progress并递增revision。确认PLAN-01已验收；若尚未完成，本轮正在整理文档，请先核对进度而不是并行改同一文件。

当前业务事实：只有旧环境白名单，没有超管初始化或后台角色管理。`OAKTECH_BOOTSTRAP_ADMIN_TOKEN`仍是计划契约，不是已生效变量。不要向用户回答“已配置好”，不要再次让用户反复查询subject来代替实现已确认方案。

第一步输出一个技术ADR和隔离数据库PoC：确认PostgreSQL事务/锁路线、跨进程初始化互斥、私有持久存储边界以及现有JSON目录最终写授权的竞争处理。不得直接把角色塞进catalog.json。目标生产数据库配置未知可以作为环境阻塞，但不阻止本地隔离设计验证。

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

本轮是PLAN-01：项目文档、任务账本、校验脚本及对应测试；不新增业务权限路由，不更改数据库、用户或发布状态。按项目规则会递增应用版本并推送文档，但这不代表超管实现。

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
