# 当前状态

更新时间：2026-09-06T20:02:30+08:00

- 公共存储决策已确认：实际 OSS 列表已出现 `oaktech-public` 和多个相近的测试名称，将 `oaktech-public` 定为唯一正式公共 Bucket，各应用使用 `apps/<app-id>/` 前缀隔离。OSS 保存原始资源与发布事实，未来 CDN 只作缓存与分发层。其他相近 Bucket 在盘点对象和 ACL 前不删除。公开读不等于公开写入；用户数据和密敏文件仍放在私有存储。截图中的 MES/文档 Bucket 不复用。
- 当前源码版本：`0.1.18`，用于 Apple 风格 storefront、统一账户入口和根地址的浏览器语言选择；生产公网版本仍需在本次推送后的 CI/Coolify 部署完成后，以 `/api/health` 单独验收。
- 软件商城以持久卷中的 `catalog.json` 管理产品、Release Draft、Published Release 和制品元数据；网站认证支持 Casdoor/Supabase 显式切换，生产现已启用 Casdoor。
- 商店Logo已上传并配置：`https://oaktechz.com/brand/oaktech-logo-v1.png` 返回HTTP200、image/png、1031886字节；Casdoor `admin/software-store-web` 的Logo已保存为此URL，公开get-application接口再次读取确认。登录/注册共用该字段；CUA截图不可用、浏览器预览创建超时，因此像素级显示验收未完成，不能记录为截图通过。
- 已确认统一认证方向：所有 OakTech 第一方工具复用自托管 Casdoor + 标准 OIDC/OAuth 2.0 技术栈；是否共享用户账户由各产品选择，并非强制。每个网站、桌面 App、插件和机器任务仍使用独立 Application 与权限边界。
- 已确认软件商店采用 Apple 风格设计体系：Figma 用于设计规范与交互原型，Next.js 继续承载正式实现；重点是信息层级、系统字体、克制材质、即时反馈、可中断动效和无障碍，而非照搬 Apple 页面。
- Apple 风格用户侧第一切片已完成源码实现：中英文首页共用实时目录组件，GitFinder 与通用产品详情、当前版本下载、历史版本下载和 Header/Nav 使用同一组轻量 storefront token 与组件；未改动认证、发布或下载 API。未登录 Header 与移动菜单统一为一个“登录 / 注册”入口，认证页仍保留上下文切换链接；根地址根据浏览器 `Accept-Language` 选择语言，手动语言选择以 Cookie 记忆。
- 可访问性适配已覆盖系统深浅色、`prefers-reduced-motion`、`prefers-reduced-transparency` 与 `prefers-contrast`；桌面 1440px、移动 390px 均完成无横向溢出截图检查，临时发布目录也验证了 macOS/Windows 当前及历史版本下载卡片。
- 已确认部署边界：Casdoor、身份数据库和直接身份资料保留在阿里云中国内地节点；OakTech 软件商店主站部署在境外。境外商店只接收完成登录所需的最小 OIDC 声明，不保存密码、手机号或完整身份档案。
- Casdoor 登录已上线：独立业务组织 `oaktech-store`、应用 `software-store-web`、精确回调、JWT-Custom/id 和五项运行变量均已保存。授权码兑换使用 S256 PKCE，显式 `token_endpoint_auth_method: none`，不使用 Casdoor client secret。本站只保留 issuer/subject 会话；Casdoor 模式仅接受精确 `sub` 管理员 allowlist，旧邮箱/用户 ID 授权不再生效，管理员 subject 尚待确认。
- 积分、订阅、支付和数据库 RLS 仍依赖 Supabase `auth.users/auth.uid()`；迁移期间必须保留 Supabase 数据库与旧 Auth 回滚路径，通过 `issuer + subject` 映射后再迁移业务接口。
- 已提供发布描述导入接口和机器分片上传入口。机器身份只能准备草稿，最终公开仍需管理员在 `/admin/releases` 确认。
- 发布时服务端重新计算制品 SHA-512，并且只使用 macOS ZIP 与 Windows NSIS 生成 electron-updater 清单。
- 本地验证：本次改动完整测试套件 23/23 通过、TypeScript 检查和 Next.js 生产构建通过；回归检查覆盖账户入口、浏览器语言解析、设计 token、双语首页数据源与当前/历史版本下载组件复用。运行中的 Next.js HTTP 验收确认中文 `Accept-Language` 重定向 `/zh`、英文重定向 `/en`、保存的 `oaktech-locale=zh` 覆盖英文请求，显式 `/zh` 返回 200。Casdoor 地址故意不可达时，公开 `/releases/**` 请求约 9ms 返回且 Dashboard 正确 307 到登录页，证明更新源不再依赖身份服务。
- Con01 生产站点已配置过渡发布机器凭据；带匹配凭据和错误描述的 POST 实测返回 `400 UNSUPPORTED_RELEASE_SCHEMA`，证明请求已通过鉴权。凭据值不进入代码、日志或文档。
- GitFinder alpha.89 的 macOS ZIP、Windows NSIS、blockmap 和便携 ZIP 共 4 个制品已上传到持久卷，大小与 SHA-512 全部复核一致。该 Release 保持 `draft`、`is_current=false`，当前公开版本仍是 alpha.86。
- 2026-09-05 用户指出官网仍为 alpha.86，本轮已将最新已提交 GitFinder alpha.93（`1d7704e408beecab193b3769dcb68442bcc3ec21`）在 GitHub Actions `33930396752` 完成双平台构建、Windows 安装/启动/卸载验收及四个制品上传，整条工作流成功。8 MiB 分片路径本轮已实测成功。
- alpha.93 当前仍为商店草稿；发布后台未登录，已经请用户在 Chrome「📦 GitFinder 发布」使用现有管理员账户登录。等待的是管理员会话，不是再次索取发布授权。登录后由本任务执行 Verify and publish，并核对中英文详情页、历史版本、两份清单、Range 206 和全量下载 SHA-512；07:48 公网清单仍返回 alpha.86。
- alpha.93 发布制品与描述保存在 `/Volumes/project/制品与备份/gitfinder-2/2.0.0-alpha.93/github-actions-33930396752/`。macOS 为 ad-hoc，Windows 未签名，按 Alpha 测试版本发布；不得称为已签名正式版。
- 待验证：alpha.93 后续公开发布与旧版客户端端到端更新；商店 Casdoor 真实账号登录/退出及管理员 subject 映射；以 Client Credentials 替代过渡令牌。此次没有切换软件发布版本。

## AUTH-20260905-01 · 软件商店登录接入

- 当前 Casdoor 已在 AL03 运行且 Coolify 显示 healthy，现有 issuer `https://qtkqgiprku5ccvlzemjhz57j.xiangshu.me` 的 discovery HTTP 200；`auth.oaktechz.com` 未绑定到该实例，当前 HTTP 503。
- 验证：0.1.14 隔离认证提交 18 项测试、无增量类型检查和 Webpack 生产构建通过；新增测试使用 NextAuth 实际 OIDC 客户端，确认 token 请求包含 code verifier、没有 client secret/Authorization header。Coolify 部署 `fc2hrp5yxgvd2surj5l5aypn` 在 08:46:45+08:00 滚动更新完成；公网登录页 HTTP 200，显示 0.1.14 与 Casdoor 入口，浏览器点击后到达正确商店授权页，URL 为 openid/code/S256 和精确回调。
- 配置：NEXTAUTH_URL、NEXTAUTH_SECRET、CASDOOR_ISSUER、CASDOOR_CLIENT_ID、CASDOOR_AUTH_ENABLED 仅 Runtime=true/Buildtime=false；确认不存在 CASDOOR_CLIENT_SECRET。Casdoor 应用密钥可调用管理 API，因此先前复制该密钥到商店的方案已撤销。注册页已隐藏并取消必填的 Email/Phone，避免依赖未配置的验证码发送服务；保留用户名、显示名称、密码、确认和用户协议。
- 当前等待：已在 Chrome 打开商店注册页，请用户亲自创建账号。真实回调、会话刷新、退出与管理员授权尚未完成；不能把登录入口上线等同于端到端登录通过。
- 公开下载：两份 GitFinder manifest HTTP 200/current alpha.86，manifest 自身 Range 返回 206；macOS ZIP Range 请求却返回 200/chunked，缺失 Content-Range，验收未通过。已限制响应字节，没有全量下载。下载路由/存储在 a7cd1c5 到 7442de3 无变化，具体问题层尚未确定，见 DEBUG_LOG.md 的 DOWNLOAD-20260905-01。
- 唯一下一步：用户完成商店注册后，从本站发起登录，验证真实回调、最小会话、Dashboard 和退出，再确认管理员 subject；见 [Casdoor 登录](../casdoor-login.md)。

- 补充协议验证：本地 mock OIDC 完整 HTTP 验收 7 组通过，涵盖 code/token/JWKS/PKCE、错误 state、最小 session/JWT、退出、身份服务关闭后的匿名 manifest/文件/Range。关闭身份服务后下载检查共9ms，无身份请求；这不是生产账号登录验收。结果：`/Volumes/project/临时文件/oaktech-casdoor-http-check-20260905/result.json`，脚本同目录 `check.mjs`；临时进程已停止。
