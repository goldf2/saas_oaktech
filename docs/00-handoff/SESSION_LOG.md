# 研发记录

## 2026-09-06T07:48:19+08:00 · Apple storefront v0.1.17 提交准备

- 用户明确授权提交并推送软件商店的 Apple 风格用户侧垂直切片；版本由已推送基线 `0.1.16` 递增为 `0.1.17`。
- 提交范围限定为中英文首页、产品目录与卡片、GitFinder/通用详情、当前及历史下载卡片、Header/Nav/Footer、直接相关设计 token、文案、结构回归测试和本次交接记录。
- 本地复核：完整 `npm test` 21/21 通过；生产构建通过；并行执行时类型检查与 `.next` 生成发生竞争，构建完成后单独重跑 `npm run typecheck` 通过。
- CI/CD、Casdoor、发布后台、下载路由和其他既有未提交文件不纳入本次功能提交；推送不等于生产验收，公网版本需在部署后检查 `/api/health` 与关键页面。

## 2026-09-05T19:03:00+08:00 · OSS 公共 Logo URL 只读核验

- 检查 URL `https://oaktech-public.oss-cn-shanghai.aliyuncs.com/apps/gitfinder-desktop/brand/logo-horizontal.png` 返回 HTTP 403（AliyunOSS）。
- 结论：该地址是按 Bucket + 上海区域 Endpoint + 对象 Key 拼出的标准格式，并非已从 OSS 后台复制并验证的有效公共链接。当前需复核对象是否已上传、Bucket ACL 是否公共读和对象 Key 大小写是否匹配。
- 未更改 OSS 权限、文件或 Casdoor 配置。

## 2026-09-05T18:47:10+08:00 · 公共 OSS Bucket 命名冲突

- 用户确认：用单个公共读 Bucket 存储橡树公司的公共内容，用文件夹前缀区分应用。
- 阿里云 OSS 创建对话框使用通用名称时返回 `BucketAlreadyExists`，提示命名空间由全系统用户共享。区域、公共读 ACL、标准存储设置本身无异常。
- 本次未创建新 Bucket，未修改现有 Bucket；下一步使用唯一的企业命名并重新创建。

## 2026-09-05T18:48:29+08:00 · 公共 OSS Bucket 已存在

- 用户确认 `oaktechz-public-read` 已经是现有 Bucket，因此取消新建操作。
- 后续直接复用该 Bucket，按 `apps/<app-id>/` 建立应用前缀；ACL、对象公开访问和 CDN 域名仍待复核。

## 2026-09-05T18:49:46+08:00 · 公共 OSS Bucket 重复名称盘点

- 截图列表显示多个相近名称：`oaktech-pub`、`oaktech-public`、`oaktechpublic`、`oaktechr`、`oaktechz`、`oaktechz-public-read`、`oaktechzpublicread`。
- 决定以 `oaktech-public` 作为正式公共 Bucket；未核对对象前不删除其他 Bucket，避免误删。

## 2026-09-05T18:55:00+08:00 · OSS 源文件与 CDN 分发分层

- 用户确认：OSS 保存原始资源，未来可在其上方接入 CDN 分发。
- 运营约束：OSS 是原始文件、版本、校验和回滚事实源；CDN 只负责缓存和边缘访问，不作为唯一存储。
- 本次仅更新设计决策，未配置 CDN 或改变 OSS 权限。

## 2026-09-05T09:27:12+08:00 · BRAND-20260905-01 商店 Logo 与 Casdoor 标题图片

- 目标：用户要求创建商店Logo，随后明确要求上传网站并替换Casdoor标题图片。
- 设计：内置image_gen生成绿色橡树与深灰OakTech字标，最终白底PNG为2048×768；原稿与两次提示词保存在 `/Volumes/project/素材/OakTech品牌/商店Logo-2026-09-05/`。
- 完成：新增 `public/brand/oaktech-logo-v1.png` 和 `docs/brand-assets.md`，同步package/package-lock版本0.1.15；提交493ffbc已推送，原有storefront/CI/CD修改保留本地。
- 本地验证：PNG格式/尺寸检查通过，三处包版本一致，git diff --check通过。仅静态资源及版本/说明变化，未修改认证和下载代码。
- 发布结果：Coolify webhook任务 `wn3qe00j7oz6vnwid5yoljhy` 构建后，09:32:58+08:00公网图片HTTP200/image/png/1031886字节，后续登录页显示0.1.15/Casdoor入口。Casdoor Logo字段保存提示成功，公开get-application无凭据复核返回status=ok及正确Logo URL。源码证实登录/注册共用该字段。
- 验证边界：Chrome登录页已刷新，CUA getScreenshot返回不可用，内置浏览器createTab超时；随后原生AX读取为空。保存状态及公开图片访问已核实，未声称完成页面截图验收。未修改其他Casdoor应用、账户或认证策略。

## 2026-09-05T08:51:22+08:00 · AUTH-20260905-01 Casdoor 生产配置生效

- 完成：用户解锁后继续配置；创建 `oaktech-store` 业务组织及 `software-store-web` Web 应用。仅 authorization_code、JWT-Custom/id、精确登录与退出回调；应用密钥不导出，改用 S256 PKCE public client。
- 代码：版本 `0.1.14`，提交 `7442de3` 已推送；修改 auth-config/auth-options、对应测试、版本和认证文档，保留原有 storefront/CI/CD 未提交改动。NextAuth token 请求没有 client secret 或 Authorization header。
- 验证：隔离提交18项测试、无增量TypeScript检查和Webpack生产构建通过。自动部署 `tp94w6a1ide5exie2oxyq8q6` 在08:40:28完成；配置五项仅运行变量后再次部署 `fc2hrp5yxgvd2surj5l5aypn`，08:46:45滚动更新成功。
- 线上：登录页HTTP200，显示0.1.14/Continue with Casdoor；实际点击跳转商店专属授权页，openid、response_type=code、S256及回调地址正确。注册默认依赖邮箱/短信验证码但无发送提供商，已隐藏并取消必填Email/Phone，保存成功且注册页复核通过。
- 公开下载：两份manifest HTTP200/current alpha.86；manifest Range206，大ZIP Range200未通过，另记DOWNLOAD-20260905-01。未发布或变更GitFinder版本，没有执行全量下载。
- 接续：Chrome已打开商店注册页，已请求用户亲自创建账号。用户完成后验证真实回调、会话、Dashboard与退出，再确认管理员subject；普通身份与内置全局管理员分开。注册及最小Token实际签发尚待验证。

## 2026-09-05T08:09:50+08:00 · AUTH-20260905-01 软件商店 Casdoor 登录

- 目标：软件商店接入现有 Casdoor，并保留其他未提交工作。
- 完成：隔离提取并修复认证实现，版本 `0.1.13` / `52aa917` 已推送 `origin/main`；仅提交认证、必要依赖、对应测试和登录部署文档，原有页面设计及 CI/CD 文件继续保留本地。
- 验证：隔离提交 17 项测试/类型检查/Webpack 构建通过，实际工作区 20 项测试和类型检查通过；Casdoor discovery HTTP 200，AL03 显示 healthy；公开商店登录和 manifest HTTP 200，仍显示版本0.1.11和旧登录。
- 阻塞：新建独立 Application 及密钥保存的确认待答复；Mac 锁定，不能继续通过管理员浏览器配置或部署。没有创建应用/密钥或启用开关。
- 补充验收：本地 mock OIDC 完整 HTTP 流程7组通过，含真实PKCE S256、JWKS验签、错误state、最小会话及退出；身份服务停止后的公开manifest/下载/Range共9ms。证据 `/Volumes/project/临时文件/oaktech-casdoor-http-check-20260905/result.json`；自启服务已停止。
- 接续：确认与解锁后按 docs/casdoor-login.md 完成运行配置与真实生产验收。


## 2026-09-05T00:10:00+08:00 · Apple 风格软件商店用户侧垂直切片

- 范围：只改造用户侧首页、产品卡片、GitFinder/通用详情、当前与历史版本下载、Header/Nav 和直接相关样式；未修改 Casdoor、CI/CD、发布后台、目录写入或下载路由逻辑。
- 设计实现：新增独立 storefront 颜色、材质、圆角、阴影、排版与交互 token；采用系统字体、蓝色主操作、克制半透明层和按下反馈，避免把 Apple 风格简化为大面积毛玻璃。
- 组件复用：中英文首页共用 `StorefrontHome`；当前版本与历史版本共用 `StoreDownloadCard`，并同时显示平台、架构、包类型、大小和 SHA-512 校验状态。
- 可访问性：加入深浅色、降低动态、降低透明度和增强对比度样式；桌面 1440px 与移动 390px 截图检查均无横向溢出或运行时控制台错误。另以 `/tmp` 临时只读目录注入 macOS/Windows 制品，确认详情页和历史页各生成 2 个带完整无障碍标签的下载链接。
- 验证：`npm test` 14/14、`npm run typecheck`、`PUPPETEER_SKIP_DOWNLOAD=true npm run build` 全部通过；生产目录尚未部署，本次仅完成本地实现与验收。

## 2026-09-04T23:25:00+08:00 · 更新源解耦与 Casdoor 登录第一切片

- 根因确认：全局 `proxy.ts` 曾让 `/releases/**` 也调用 Supabase `auth.getUser()`，公开更新源错误依赖身份服务；同时生产 current 仍为 GitFinder alpha.86，alpha.89 只是草稿，因此旧客户端只能得到“无可用更新”。
- 修改：proxy 仅匹配 `/dashboard/:path*`；新增可回滚的 Casdoor/NextAuth OIDC 会话、登录/注册入口、统一退出、Dashboard 服务端门禁和管理员 `sub` allowlist。Supabase 登录仍是默认回滚模式，积分/订阅/支付数据未迁移。
- 产品决策修正：统一的是 Casdoor/OIDC 技术栈，不强制所有产品共享账户；每个客户端保持独立 Application，Organization/SSO 是否共享由产品选择。
- 验证：`npm test` 11/11、`npm run typecheck`、两种认证模式 `npm run build` 均通过。使用不可达 OIDC issuer 启动 Casdoor 模式后，`/sign-in` 200、未登录 `/dashboard` 307，公开 release 请求约 9ms 返回且没有等待身份服务。
- 待办：恢复 `auth.oaktechz.com`、创建 `software-store-web` Casdoor Application、检查真实 Token claims 并配置 Coolify；之后再由管理员决定是否发布 alpha.89。

## 2026-09-04T16:39:55+08:00 · alpha.89 生产草稿上传闭环

- 用户授权在 Con01 Coolify 提交过渡发布机器凭据；同一值已配置到 GitFinder GitHub Environment，未写入仓库、输出或交接文档。
- GitFinder 工作流 `33851005274` 的 macOS 与 Windows 构建/验证成功，商店任务先因代理截断 16 MiB 分片而出现 offset mismatch，调整为 8 MiB 后继续推进。
- 生产上传在 macOS ZIP 末段停滞，根因为 `storage.ts` 使用未被消费的 Transform 作为文件哈希管线末端，超过内部缓冲区后发生背压。新增 `file-hash.ts` 以异步迭代读取文件，并复用于上传完成与发布前复核。
- 验证：`npm test` 7/7、`npm run typecheck`、`PUPPETEER_SKIP_DOWNLOAD=true npm run build` 全部通过；提交 `a7cd1c5`、版本 `0.1.11` 已推送并部署到 Con01。
- 生产结果：alpha.89 四个制品上传成功，持久卷文件大小与 SHA-512 全部匹配；Release 仍为草稿且不是 current，公开 current 版本仍为 alpha.86。
- 清理：删除本次在 Con01 创建的约 778 MB 临时下载/解压目录；正式制品和目录保留在发布持久卷。

## 2026-09-04T13:38:30+08:00 · 确认境内认证、境外商店部署边界

- 用户确认：Casdoor 用户认证数据保存在阿里云中国内地节点，OakTech 软件商店主站部署在境外。
- 架构边界：不在境外复制 Casdoor 身份库；境外商店通过服务端 OIDC Authorization Code 流程接收最小身份声明，并在本地建立业务会话。
- 数据最小化：默认只向境外商店传递 `iss`、`sub`、`aud`、`exp` 和必要 scope，不传递密码、手机号、完整身份档案或第三方账号资料。
- 可用性：境外商店缓存 discovery/JWKS 后可本地验证 Token；首次登录、授权码交换、刷新和统一退出仍依赖境内 Casdoor 网络可用。
- 本次只更新决策和接续文档，没有修改认证代码、生产配置或部署。

## 2026-09-04T13:13:05+08:00 · Casdoor 统一认证方向（后续已修正账户共享范围）

- 当时确认统一使用 Casdoor/OIDC 技术栈，使 OakTech 第一方工具具备一致的登录能力；后续用户明确修正为“不强制统一账户”，以最新决策记录为准。
- 每个 Web、Electron、浏览器插件和机器任务使用独立 OIDC Application；是否共享 Organization/身份域由各产品选择，管理员使用独立内部身份边界。
- 迁移边界：Casdoor 只作为身份、登录、会话和基础访问控制来源；积分、订阅、订单、许可证、发布数据和文件仍由业务系统保存。
- 当前证据：OakTech 的登录、会话、用户 UUID、积分/订阅查询和 PostgreSQL RLS 仍直接依赖 Supabase Auth，因此必须先建立 `issuer + subject` 到业务用户的映射，不能直接删除 Supabase。
- 本次只更新决策和接续文档，没有修改认证代码、生产配置或部署。

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
## 2026-09-05 19:15 +0800 · OSS Logo 匿名访问复核

- 观察：浏览器访问 `https://oaktech-public.oss-cn-shanghai.aliyuncs.com/app/gitfinder-desktop/brand/gitfinder-2-logo-horizontal.png` 返回 Aliyun OSS `AccessDenied`，错误消息为无权访问对象，因为 Bucket ACL 不允许。
- 复核：对 `app/.../gitfinder-2-logo-horizontal.png`、`apps/.../logo-horizontal.png`、`apps/.../gitfinder-2-logo-horizontal.png` 三个候选地址执行匿名 HEAD，均返回 HTTP 403；因此当前首要阻塞是 Bucket/对象公开读权限，不能据此判断路径是否存在。
- 下一步：在确认公开范围后，将正式公共 Bucket 设置为公共读（保持非公开写入），再以一个确定的对象 Key 验证匿名 GET；推荐统一使用 `apps/gitfinder-desktop/brand/logo-horizontal.png`。
## 2026-09-05 19:25 +0800 · GitFinder 登录 Logo 放大版

- 观察：Casdoor 注册页显示横向 Logo 偏小；后续截图还显示上传对象带有棋盘格背景。
- 修改：收紧 GitFinder 横向 Logo 的 SVG 画布到 `1180×360`，重新渲染透明 PNG，并输出 2× 版本 `2360×720`；本地文件为 `/Volumes/project/项目/gitfinder-2/public/branding/gitfinder-2-logo-horizontal-v2.png`。
- 验证：PNG 具备 alpha 通道，视觉检查确认图标和文字填充画布，没有棋盘格背景。
- 待办：将 v2 文件上传到正式公共 Bucket 后，用新的对象 Key 更新 Casdoor Logo，避免浏览器缓存旧对象。
## 2026-09-05 19:30 +0800 · 静态 Logo 分发架构

- 结论：Logo 等公开资源使用 OSS 保存原始文件，Cloudflare 作为 CDN 缓存和稳定域名入口；不依赖 OakTechz 生产容器的临时文件系统。
- 例外：仅随网站代码发布的小型资源可以放在仓库 `public/`，必须随 Coolify 构建发布；容器内手动复制不作为持久方案。
- 发布约定：使用带版本的对象 Key（如 `logo-horizontal-v2.png`），避免覆盖同名文件造成边缘缓存和浏览器缓存不一致。
## 2026-09-05 19:35 +0800 · GitFinder 独立官网与 Con01 静态源提案

- 用户提出：Con01 可提供一个只读公共静态文件目录，GitFinder 应拥有独立官网，不再依赖软件商店项目承载官网和资源。
- 当前事实：软件商店已推送 `a138072`（`0.1.16`）包含 Logo 作为兼容路径，但公网验证 `https://oaktechz.com/apps/gitfinder-desktop/brand/logo-horizontal-v2.png` 暂时返回 404，尚未宣称部署完成。
- 提案：`gitfinder.oaktechz.com` 独立承载产品官网、版本说明和更新入口；`oaktechz.com` 仅保留软件目录、账户和管理后台；Con01 的静态源仅服务公开小资源，安装包仍优先使用持久 OSS 存储。
- 状态：架构提案待用户确认，未删除已推送的兼容资源。
