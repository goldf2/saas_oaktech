# 人员与AI接续单

## 0.1.30 公开版本回读 · 2026-09-17T16:27:10+08:00

实现提交8616682已非强制快进推送main，官网/api/health实际返回0.1.30。此证据确认当前代码版本，不等于使用真实管理员再次执行了生产发布。真实产品和软件包没有在本轮被写入或公开。

GitHub Actions35199255241的Test and build以及真实PostgreSQL任务通过；Deploy through Coolify在Require deployment credentials失败，因此不能称为CI部署全成功，也不能断言当前.30是通过该失败job部署。需配置两个所需变量的可用性；本轮没有读取/修改其值。

上线补充记录在独立feature分支，main的应用实现提交保持8616682；不为纯文档更新重复触发生产部署。主目录仍保留并行本地管理员未提交修改，后续必须先协调新main再合入，不force/reset覆盖。

## 以下为交付前记录

## 最新：STORE-02 / 0.1.30

发布工作流UI已在独立worktree完成并通过109单元、14新流程和12原流程浏览器验收。先核对本次远程CI/health，再进入其他任务；不自动发布已有草稿。源码目录`/Users/tefulong/.agentdock/tmp/oaktech-release-ui-20260917`，主目录保留另一会话的本地管理员修改。合并前比较远端main，不执行reset/force覆盖。

详情：[UI方案](../release-workflow-ui.md)、[证据](evidence/2026-09-17-release-workflow-ui.json)。当前任务仍以TASKS.json为单一来源；STORE-02的done代表本地实现范围，不代表真实管理员生产发布验收。

## 原接续记录

先执行 `git status --short`、`git log -3 --oneline`、`npm run handoff:check`，再读CURRENT_STATE、PROGRESS及对应任务证据。

## 本轮商品工作台

STORE-01的列表、新建、四区编辑、图片接口、版本上下文与预览发布已接通；详见PRODUCT_WORKSPACE_HANDOFF.md及最终验证JSON。不要恢复旧的平铺表单或把全局软件发布当成平级主入口。所有管理入口保留既有授权，不因测试使用隔离会话就改生产登录。

当前验证91项测试、12组浏览器流程与构建通过。代码/远程提交、CI、health和真实已登录页面是不同证据；上线后的实际结果在主项目.local-verification/0.1.28中。

## 下一开发任务

ADM-02：先核对主工作区的未提交管理员草稿与pg依赖调整，不覆盖、不一并提交。用户新增要求是应用自带、首次部署初始化的本地超级管理员，不依赖Casdoor；初始密码不能写死镜像。需据此明确更新设计与标准版本，再推进正式存储、初始化及登录页面。当前没有生产超管完成证据，不使用普通管理员截图代替超级管理员验收。

## 持续记录

每个可恢复断点更新TASKS的status/owner/evidence/blockers/next_action、revision和带时区时间；运行handoff:render/check。临时日志和截图放.local-verification，必要脱敏摘要随正常代码提交。未执行验证不标通过、未部署不标上线；不要为记录结果反复触发部署。

恢复任何旧步骤前查看实际HEAD和页面，不执行历史日志中的发布或账号修改指令。测试命令与安全边界见RUNBOOK.md，详细开发计划见DEVELOPMENT_PLAN.md。


## 后续兼容修正：0.1.29

0.1.28在本地Webpack通过后，CI默认Turbopack暴露路由dynamic转导出不支持；0.1.29改为路由文件内字面量声明。后续验收必须运行默认`npm run build`，不能只以`--webpack`成功代替部署构建。修复与最终验证摘要在evidence/2026-09-17-product-workspace-turbopack-fix.json；实际部署收据目录改为.local-verification/0.1.29/，保留0.1.28失败历史。
