# 下一步

## P0 · 软件商店 Casdoor 登录

1. 等待用户确认在现有 Casdoor 新建 `software-store-web` 独立应用并将该客户端密钥存入 Con01 `softbank`。
2. 按 [Casdoor 登录](../casdoor-login.md) 配置最小 Token、精确回调、NEXTAUTH/CASDOOR 运行变量和管理员 subject。
3. 启用并部署后验证真实授权回调、Dashboard、退出及匿名公开下载；当前尚未完成真实生产登录。

## 软件发布历史后续

1. 在 Coolify 为 OakTech 设置不少于 32 字符的 `OAKTECH_RELEASE_WRITE_TOKEN` 并重新部署。
2. `goldf2/GitFinder` 已建立 `oaktech-release` GitHub Environment 和 `OAKTECH_RELEASE_BASE_URL=https://oaktechz.com` Variable；环境变量创建成功后，再把同一发布值保存为 GitHub Environment Secret。
3. 将 GitFinder 当前受保护工作区拆分提交并推送，使工作流进入 GitHub。
4. 用下一个版本完成一次 macOS、Windows 构建到 OakTech 草稿的真实流水线。
5. 管理员发布后，在已安装旧版本的两端完成更新检查、下载、安装和数据保留验收。
6. Casdoor 生产可用后，将过渡发布令牌替换为 OAuth 2.0 Client Credentials。
