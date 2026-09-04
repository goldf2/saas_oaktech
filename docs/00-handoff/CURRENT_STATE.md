# 当前状态

更新时间：2026-09-04（Asia/Shanghai）

- 当前源代码版本：`0.1.9`。
- 软件商城以持久卷中的 `catalog.json` 管理产品、Release Draft、Published Release 和制品元数据；Supabase 当前只用于网站登录与管理员识别。
- 已提供发布描述导入接口和机器分片上传入口。机器身份只能准备草稿，最终公开仍需管理员在 `/admin/releases` 确认。
- 发布时服务端重新计算制品 SHA-512，并且只使用 macOS ZIP 与 Windows NSIS 生成 electron-updater 清单。
- 本地验证：6 项测试通过、TypeScript 检查通过、Next.js 生产构建通过；本地真实 HTTP 导入、四制品上传和幂等重试通过。
- 待验证：Coolify 生产环境部署、生产密钥配置、GitHub Actions 到生产草稿的真实推送。
