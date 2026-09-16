# 人员与AI接续单

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
