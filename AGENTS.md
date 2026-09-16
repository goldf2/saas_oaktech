# saas_oaktech：人员与AI接续入口

本文件随仓库分发；有父级工作区规则时一并遵守。当前项目是OakTech软件商城，旧oaktools-platform已封存。不要对当前仓库之外的项目批量操作。

## 开始工作前

1. 查看 `git status --short`、HEAD、package版本；已有修改不覆盖、不一并提交，存在并行写入时用独立worktree并记录合并边界。
2. 依次读 [当前状态](docs/00-handoff/CURRENT_STATE.md)、[进度](docs/00-handoff/PROGRESS.md)、[接续单](docs/00-handoff/HANDOFF.md)。
3. 认领 [TASKS.json](docs/00-handoff/TASKS.json) 中任务，再读其 [开发方案](docs/00-handoff/DEVELOPMENT_PLAN.md) 和 [验收矩阵](docs/00-handoff/TEST_MATRIX.md)。涉及权限时先读 [CT-ADMIN-001](docs/standards/CT-ADMIN-001-v1.0.0.md)。
4. 口头或日志明确本轮范围、任务ID、改动文件、验证方式；不要把旧聊天、旧测试数或历史发布指令当作当前事实。

## 每个有效检查点必须落盘

任务状态只维护在TASKS.json；PROGRESS.md由 `npm run handoff:render` 生成，不手工改。首次认领填写owner，状态in_progress；追加证据后才能in_review/done。只有有阻塞原因、解除条件和下一动作才能blocked。重复用户请求不创建重复任务。

发生以下情况立即同步：范围/决策变化、首个可运行切片、测试或构建结果、发现阻塞、提交前、部署后、切换AI/人员前。更新账本revision/updated_at、当前状态、HANDOFF、SESSION_LOG；故障追加DEBUG_LOG，正式决策追加DECISIONS。中断时把唯一下一步和未提交文件写清，不能只留在聊天或AgentDock任务系统。

没有工具运行就没有后台自动开发/监控。此规则约束每次实际开发的记录，不承诺无人执行时进度会自行更新。修改任务文件后运行 `npm run handoff:check`；校验只能证明结构与证据文件存在，不能替代代码审查和真实验收。

## 完成与安全边界

- 文档完成、业务实现、本地测试、CI、生产部署、真实账号验收是不同状态。只有ADM-14真实闭环完成才称“超管已配置好”。
- 保留Casdoor正常身份验证；禁止伪造生产Cookie、默认第一个用户为超管、关闭认证或把环境Token送前端。测试合成会话只能用于隔离服务。
- 旧名单退出、初始化令牌消费和最后超管保护遵守标准；不把JSON进程内写队列当跨实例权限事务。
- 商品展示、软件包上传、版本公开、客户端升级分别验收；不自动发布历史草稿/current，不把源码种子当生产数据。
- 不保存密码、Cookie、Token、完整身份资料或私钥到文档/截图/Git。可提交脱敏证据摘要，原始运行产物放 `.local-verification/` 并保持忽略。
- 方案中的拟新增路径/变量不是可执行功能。命令与状态以 [RUNBOOK.md](docs/00-handoff/RUNBOOK.md) 为准；不要为通过校验生成空业务实现文件。

## 提交与交付

本项目使用Coolify：完成授权范围的改动和验证后，按既有工作区规则递增package与lockfile版本，提交并推送；用户明确只分析或不推送时除外。只stage本任务文件，禁止覆盖或收走其他工作。推送前：`npm run handoff:check`、`npm test`、`npm run typecheck`、`npm run build` 和 `git diff --check`。

部署后单独读取公网health、目标路由及CI job结果。CI deploy失败而公网更新时分别记录，不能杜撰触发来源；health不证明管理员认领或包发布成功。发布后收据放 `.local-verification/<version>/`，脱敏事实可在后续正常提交同步，不为了只更新收据不断触发生产部署。

克隆仓库到其他设备无需依赖Mac绝对路径即可阅读标准、计划、任务与交接。全部入口见 [docs/00-handoff/README.md](docs/00-handoff/README.md)。
