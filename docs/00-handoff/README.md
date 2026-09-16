# 软件商城开发与接续文档

这是仓库内的统一接续入口，不依赖聊天记录或原Mac目录。项目规则从根目录[AGENTS.md](../../AGENTS.md)开始。

| 需要回答的问题 | 唯一入口 |
| --- | --- |
| 系统目标、范围、长期边界 | [PROJECT_BRIEF.md](PROJECT_BRIEF.md) |
| 现在到底实现到哪里 | [CURRENT_STATE.md](CURRENT_STATE.md) |
| 每项任务状态、依赖、负责人和证据 | [TASKS.json](TASKS.json)，生成视图[PROGRESS.md](PROGRESS.md) |
| 超管功能具体怎么开发 | [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) |
| 交给下一位该做什么 | [HANDOFF.md](HANDOFF.md)、[NEXT_ACTIONS.md](NEXT_ACTIONS.md) |
| 怎样安装、运行、验证和发布 | [RUNBOOK.md](RUNBOOK.md) |
| 如何判定安全与功能完成 | [TEST_MATRIX.md](TEST_MATRIX.md) |
| 采纳的容器化标准 | [CT-ADMIN-001](../standards/CT-ADMIN-001-v1.0.0.md) |
| 历史决策、工作过程、故障与发布 | [DECISIONS.md](DECISIONS.md)、[SESSION_LOG.md](SESSION_LOG.md)、[DEBUG_LOG.md](DEBUG_LOG.md)、[RELEASE_LOG.md](RELEASE_LOG.md) |

状态编辑只在TASKS.json，执行 `npm run handoff:render` 后提交PROGRESS.md；`npm run handoff:check` 检查一致性。文档任务完成不算超管业务完成。历史错误或过期摘要保存在archive，不再指导当前发布操作。
