# 下一步

**唯一下一开发任务：ADM-01。** 先读[HANDOFF.md](HANDOFF.md)，认领后验证授权存储与跨存储一致性方案，不再继续用反复手填subject的办法代替已确认的新功能。

ADM-01完成后依赖顺序：ADM-02事务schema → ADM-03身份登记 / ADM-04初始化凭据 → ADM-05原子绑定 → ADM-06页面 / ADM-07角色服务 → ADM-08用户权限页 / ADM-09管理写接入 → ADM-10迁移恢复 → ADM-11容器演练 → ADM-12隔离验收 → ADM-13预生产真账号 → ADM-14生产真账号。实际并行条件以[TASKS.json](TASKS.json)为准。

OPS-01单独核对CI与真实部署路径；REL-01需要真实管理员完成官网软件包发布；REL-02做原生客户端升级。REL-03和HARD任务暂缓，不能把旧日志中的版本目标当新授权。

此前“需再录入Auth/缠序模板”的待办已过期：两个商品恢复显示已有证据，本轮详情HTTP200。旧内容保存在 `archive/2026-09-16-before-development-plan-NEXT_ACTIONS.md`，仅供追溯，不作为执行清单。

任务状态只改[TASKS.json](TASKS.json)，再生成[PROGRESS.md](PROGRESS.md)。这里仅维护执行方向，不重复手写一套完成勾选表。
