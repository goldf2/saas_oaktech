# 研发记录

## 2026-09-04T12:51:05+08:00 · 生产端点与流水线环境核验

- 生产证据：`POST https://oaktechz.com/api/admin/releases/import` 在无凭据时返回 `401 RELEASE_WRITER_UNAUTHORIZED`，确认新版导入接口已部署并默认拒绝写入。
- GitHub：`goldf2/GitFinder` 已建立 `oaktech-release` Environment，非敏感变量 `OAKTECH_RELEASE_BASE_URL` 已设为 `https://oaktechz.com`。
- 阻塞：Con01 当前 API 凭据对环境变量只有读取权限，创建 `OAKTECH_RELEASE_WRITE_TOKEN` 返回 403；因此没有在 GitHub 侧留下半配置 Secret。
- 下一步：由有权限的管理员在 Coolify 添加生产变量并重部署，然后把同一值录入 GitHub Environment Secret，再做真实 runner 到生产草稿验收。

## 2026-09-04T12:36:28+08:00 · 软件构建发布工作流

- 目标：让 GitFinder CI 自动构建双平台制品并推送 OakTech Release Draft，保留后台人工发布门禁。
- 改动：新增幂等发布描述导入、机器上传鉴权、来源 commit 记录；修正 updater 清单只选择 macOS ZIP 和 Windows NSIS。
- 验证：`npm test` 6/6；`npm run typecheck` 通过；`npm run build` 通过；本地生产服务完成导入、四制品上传、401 拒绝和重复推送跳过验证。
- 未完成：尚未配置生产 Secret，或从 GitHub Runner 推送真实安装包。
