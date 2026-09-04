# 研发记录

## 2026-09-04T12:36:28+08:00 · 软件构建发布工作流

- 目标：让 GitFinder CI 自动构建双平台制品并推送 OakTech Release Draft，保留后台人工发布门禁。
- 改动：新增幂等发布描述导入、机器上传鉴权、来源 commit 记录；修正 updater 清单只选择 macOS ZIP 和 Windows NSIS。
- 验证：`npm test` 6/6；`npm run typecheck` 通过；`npm run build` 通过；本地生产服务完成导入、四制品上传、401 拒绝和重复推送跳过验证。
- 未完成：尚未配置生产 Secret、部署生产环境或从 GitHub Runner 推送真实安装包。
