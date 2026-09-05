# 发布记录

## 0.1.14 · Casdoor 无客户端密钥登录

- 源码：授权码交换显式使用 `token_endpoint_auth_method=none` 和 S256 PKCE，移除 Casdoor client secret 要求，商店仅保留独立会话密钥。
- 配置：Casdoor 创建独立 `oaktech-store` 业务组织及 `software-store-web` 应用，Grant Types 仅授权码、JWT-Custom 仅 id。
- 验证：18项测试、无增量TypeScript检查、Webpack生产构建通过；回归实测NextAuth token请求携带code_verifier，且没有client_secret/Authorization。
- 部署：待推送与Con01部署后的真实用户登录验收。

## 0.1.13 · Casdoor 登录代码

- 状态：源码验证通过，待提交和部署；生产 Casdoor 开关暂不启用，独立应用与凭据配置待确认。
- 验证：17 项测试、TypeScript 检查、Webpack 生产构建和授权/会话 HTTP 检查通过。
- 范围：仅认证、会话、后台身份识别、下载路由隔离和对应文档；保留工作区内其他未提交设计和 CI/CD 改动。
- 回滚：`CASDOOR_AUTH_ENABLED=false` 并重新部署可保留原 Supabase 登录，持久卷不变。

## 0.1.10

- 状态：生产导入端点已验证，发布凭据配置仍待有写权限的管理员完成。
- 内容：同步实际部署证据、GitHub Environment 配置进度与剩余阻塞，不改变发布协议。
- 回滚：回滚到 `0.1.9`；本次仅更新版本与交接记录。

## 0.1.9

- 状态：源码验证完成，生产发布待执行。
- 内容：GitFinder 构建系统可创建或复用 OakTech 发布草稿并分片上传验证后的平台制品。
- 回滚：回滚应用到上一版本；新增接口在没有 `OAKTECH_RELEASE_WRITE_TOKEN` 时默认拒绝机器访问，原浏览器后台上传路径不受影响。
