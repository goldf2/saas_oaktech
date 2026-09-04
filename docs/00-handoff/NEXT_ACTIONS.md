# 下一步

1. 在 Coolify 为 OakTech 设置不少于 32 字符的 `OAKTECH_RELEASE_WRITE_TOKEN` 并重新部署。
2. 在 `goldf2/GitFinder` 建立 `oaktech-release` GitHub Environment，配置同一发布 Secret 和 `OAKTECH_RELEASE_BASE_URL` Variable。
3. 将 GitFinder 当前受保护工作区拆分提交并推送，使工作流进入 GitHub。
4. 用下一个版本完成一次 macOS、Windows 构建到 OakTech 草稿的真实流水线。
5. 管理员发布后，在已安装旧版本的两端完成更新检查、下载、安装和数据保留验收。
6. Casdoor 生产可用后，将过渡发布令牌替换为 OAuth 2.0 Client Credentials。
