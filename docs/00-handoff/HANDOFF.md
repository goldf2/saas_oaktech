# 人员与AI接续单

## 2026-09-18T09:04:03+08:00 · 视频介绍交付

商品编辑为三组：商品资料/软件版本/预览发布；视频、图片和文案一起保存/预览/发布。YouTube/B站点击后加载内嵌播放器，多来源切换卸载旧播放器；未知来源不嵌iframe。见[实现说明](../product-video-sources.md)。

本轮独立分支 `feat/product-video-sources-20260918` 基于远端.30，候选.31；主目录15项既有修改未覆盖。生产角色/目录不在本次测试写入范围。后续同步分支前检查主目录管理员依赖和台账，不直接reset或把旧分支当主线。

视频端到端 `npm run test:video-ui`，实际平台探测加 `-- --live-players`；两种结果应区分。旧工作台/版本上传回归也要保留。GitHub自动拉取与本地超管是独立任务，不得据本轮宣称完成。


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
