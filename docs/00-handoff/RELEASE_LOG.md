# 发布记录

## 0.1.23 · 商品素材分离与新增后台（2026-09-16T13:12:53+08:00）

- 修复缠序错误复用auth图标、Dashboard静态beta列表和后台入口遗漏；新增/admin与/admin/products/new。
- 商品模板默认为草稿；未改认证白名单、未写生产商品/版本数据。权限提示页可以被发现，但不向非管理员渲染编辑表单。
- 验证：41项测试、类型和构建；最终14组真实浏览器检查、截图、commit、CI和公网health另存 `.local-verification/0.1.23/`。
- 基线：开始时0.1.22已在线，本次是否上线必须读取health，不继承历史部署阻塞结论。
- 回滚：上一提交b08736e / 0.1.22，无数据库迁移；保留持久商品及软件包。
- 根因与边界见 [修复记录](../store-product-admin-fix-2026-09-16.md)。

## 0.1.22 · 商品发布、软件包发布与下载可靠性（2026-09-16T12:20:50+08:00）

- 源码变更：重复商品防覆盖、草稿身份/来源保护、四段版本兼容、通用软件包发布、8 MiB 浏览器分片与确认反馈、并发槽位与审计异常保护、发布前快照核对、HEAD/Range 边界、中文表单状态与输入保留。
- 版本：package.json 与 package-lock.json 同步 `0.1.22`，没有依赖升级和数据迁移。
- 源码验证：36/36 单元/路由/文件系统回归、类型检查、生产构建通过；`npm run test:store-ui` 9组隔离实际浏览器验收通过。详细改动和限制见 [审查报告](../software-store-review-2026-09-16.md)。
- 生产基线：此前实测商城0.1.21、GitFinder current alpha.86；curl双平台安装包Range206与64字节文件头正确，Node直连存在不同表现，未作跨网络完全可用性承诺。
- 发布与验证分开：本记录随源码提交；远程commit、CI结果和公网health实际收据保存在项目 `.local-verification/0.1.22/deployment.json`，运行记录不随源码推送。
- 软件发布边界：本轮没有发布或撤回真实软件Release，没有修改身份服务/管理员配置/生产文件。代码上线不会自动把任何草稿设为current。
- 回滚：以此前 `d5994ad` / `0.1.21` 应用镜像为代码回滚点；不删除/回滚持久目录，不因回滚代码改变软件发布版本。


## 0.1.18 · 统一账户入口与浏览器语言识别（2026-09-06T20:02:30+08:00）

- 内容：桌面 Header 与移动菜单只保留一个 `登录 / 注册` 账户按钮，统一进入 `/sign-in`；认证页内部继续提供注册与登录切换。
- 语言：首次访问根地址按浏览器 `Accept-Language` 选择 `/en` 或 `/zh`；用户手动选择写入 `oaktech-locale` Cookie，显式语言路径优先，不使用 IP 地区推断。
- 范围：仅调整导航入口、语言选择、双语文案和结构回归测试，不改变 Casdoor、Supabase 回退或 OIDC 流程。
- 验证：完整测试套件 23/23、`npm run typecheck`、`npm run build` 通过；本地 HTTP 验收确认浏览器语言、Cookie 覆盖和显式 `/zh` 路径均按预期工作。
- 发布边界：本版本推送后仍需独立验收公网 Header、登录/注册跳转和 `/api/health`，不能仅凭 Git push 视为上线。
- 回滚：回滚到 `0.1.17` 即恢复双入口导航。

## 0.1.17 · Apple 风格软件商店用户侧切片（2026-09-06T07:48:19+08:00）

- 内容：中英文首页改为读取实际公开目录；统一产品卡片、GitFinder/通用详情、当前及历史版本下载、Header/Nav/Footer 与 storefront 设计 token。
- 无障碍：支持系统深浅色、降低动态、降低透明度和增强对比度；下载入口保留现有发布数据与 `publicPath` 边界。
- 验证：完整测试套件 21/21、TypeScript 检查和 Next.js 生产构建通过；390、768、1024、1440px 浏览器结构验收沿用本切片完成时的记录。
- 发布边界：本条记录对应 `0.1.17` 源码发布；Git 推送后仍需等待 CI/Coolify，并以公网 `/api/health`、中英文首页、详情页和下载入口独立验收。
- 回滚：回滚到上一源码提交即可恢复旧店面；本次没有迁移目录数据、切换 GitFinder current 或修改发布制品。

## 0.1.15 · OakTech Logo资源与Casdoor标志（2026-09-05T09:32:58+08:00）

- 提交：`493ffbc15aa7d755c7fa4c775f99b846aa895727` 已推送origin/main；四个文件为Logo PNG、品牌资源说明、package.json及package-lock.json。PNG格式/尺寸、版本一致性及diff检查通过。
- 发布：Con01 softbank自动部署 `wn3qe00j7oz6vnwid5yoljhy`；公网图片HTTP200/image/png/1031886字节，登录页显示0.1.15且Casdoor入口保留，确认新资源已上线。没有读取到该部署最终日志，公网结果已验证。
- Casdoor：`admin/software-store-web` 的Logo改为 `https://oaktechz.com/brand/oaktech-logo-v1.png`，UI保存成功，公开API再次读取确认；登录/注册页面共用此字段。因截图通道不可用，未完成像素级视觉验收。
- 回滚：应用Logo可恢复为修改前的 `https://cdn.casbin.org/img/casdoor-logo_1185x256.png`；静态新资源保留不会改变其他功能。

## 0.1.14 · Casdoor 运行配置上线（2026-09-05T08:51:22+08:00）

- 源码：`7442de3683ca61236e935f16a8143f64f245ecb3` 已推送 `origin/main`，18项隔离测试、类型检查和Webpack构建通过。
- 部署：Con01 `softbank` 自动构建部署 `tp94w6a1ide5exie2oxyq8q6` 成功；保存仅运行的NEXTAUTH/CASDOOR五项变量后，部署 `fc2hrp5yxgvd2surj5l5aypn` 在2026-09-05T08:46:45+08:00滚动更新完成。该次复用同提交镜像，未重建。
- 配置：Casdoor开启，独立业务组织及应用已保存；不向商店复制Casdoor client secret，NEXTAUTH_SECRET仅存Coolify运行变量。注册Email/Phone隐藏且非必填，避免未配置发送服务阻断注册。
- 公网：登录页HTTP200且显示0.1.14/Casdoor入口；真实授权跳转已验证。完整账号登录、退出和管理员映射待用户创建账号后验收。
- 下载：GitFinder两份清单仍alpha.86、HTTP200；manifest Range206通过，大ZIP Range200未通过，见DOWNLOAD-20260905-01。未公开其他草稿或切换current。
- 回滚：将CASDOOR_AUTH_ENABLED=false并重新部署，恢复保留的Supabase登录；本次未迁移积分、支付或订阅数据库。

## 0.1.13 · Casdoor 登录代码（2026-09-05T08:09:50+08:00）

- 已提交并推送：`52aa917` → `origin/main`。
- 验证：认证隔离提交17项测试、类型检查、Webpack构建通过；主工作区20项测试及类型检查通过。
- 生产：最新 HTTP 200 登录页仍显示0.1.11/Supabase；新提交部署尚未验证。GitFinder更新清单HTTP 200，current仍为alpha.86。
- 阻塞：独立OIDC应用及客户端密钥保存待用户确认，Mac锁定阻止继续浏览器管理操作。
- 回滚：认证开关仍未开启；以后启用后可设 `CASDOOR_AUTH_ENABLED=false` 并重新部署恢复旧登录。

## 2026-09-05 07:48:11 +0800 · GitFinder alpha.93 草稿上传成功，公开发布待登录

- 原因：上轮本机构建/源码推送未执行商店公开发布；alpha.89 历史工作流上传失败后，草稿虽修复但未切 current，官网和两个 updater 清单一直为 alpha.86。
- 本轮目标：GitFinder `2.0.0-alpha.93`，来源 `1d7704e408beecab193b3769dcb68442bcc3ec21`；现有已提交 release.yml，未使用并行未提交工作流。
- 流水线：[33930396752](https://github.com/goldf2/GitFinder/actions/runs/33930396752) 全部成功；macOS/Windows 构建、Windows runtime 9 项以及安装/普通启动/卸载通过；四制品上传和服务器 SHA-512 校验成功。
- 制品：CI macOS ZIP 127905642 字节、Windows NSIS 108921617 字节、blockmap 114656 字节、Windows ZIP 152198931 字节；本地下载后另核验包内版本与报告/哈希一致。
- 持久记录：`/Volumes/project/制品与备份/gitfinder-2/2.0.0-alpha.93/github-actions-33930396752/descriptor/store-release.json`。
- 当前边界：07:48 公网仍为 alpha.86；机器身份仅上传草稿，管理员浏览器未登录，已请求用户完成现有账户登录。未绕过管理员门禁、未修改账号、未切换 current。
- 下一步：登录后发布 alpha.93 并运行公网下载核验；保留所有旧版与历史草稿。本轮没有软件商店源代码或部署变更。

## 0.1.12（待部署）

- 内容：公开更新路由脱离 Supabase/Casdoor 中间件；新增可切换的 Casdoor + NextAuth OIDC 登录、退出、Dashboard 门禁和管理员 subject allowlist。
- 验证：测试 11/11、TypeScript、Supabase 模式构建、Casdoor 模式构建均通过；不可达身份源不会拖慢 `/releases/**`。
- 发布边界：尚未配置生产 Casdoor Application，部署时保持 `CASDOOR_AUTH_ENABLED=false`；生产 current 仍为 GitFinder alpha.86，alpha.89 需管理员确认后另行发布。

## 0.1.11

- 状态：提交 `a7cd1c5` 已部署到 Con01；GitFinder alpha.89 四个制品已写入生产草稿并完成大小、SHA-512 与草稿门禁验证。
- 内容：修复大文件分块上传完成阶段的哈希流背压，抽取可复用文件哈希函数并增加大文件回归测试。
- 发布边界：alpha.89 尚未公开，current 版本仍为 alpha.86；正式切换必须由管理员在后台确认。
- 回滚：可将应用镜像回滚到 `22a31f9`，但回滚不会自动删除持久卷中的 alpha.89 草稿与制品；如需移除须在后台显式处理。

## 0.1.10

- 状态：生产导入端点已验证，发布凭据配置仍待有写权限的管理员完成。
- 内容：同步实际部署证据、GitHub Environment 配置进度与剩余阻塞，不改变发布协议。
- 回滚：回滚到 `0.1.9`；本次仅更新版本与交接记录。

## 0.1.9

- 状态：源码验证完成，生产发布待执行。
- 内容：GitFinder 构建系统可创建或复用 OakTech 发布草稿并分片上传验证后的平台制品。
- 回滚：回滚应用到上一版本；新增接口在没有 `OAKTECH_RELEASE_WRITE_TOKEN` 时默认拒绝机器访问，原浏览器后台上传路径不受影响。

## 2026-09-16T13:46:53+08:00 · 0.1.24 · PRODUCT-RECOVERY-20260916

- 用户截图确认两目标商品仍不可见；此前只修模板/素材，没有补生产catalog。
- 实施仅针对open-play和chanxu-tradingview的一次性启动迁移，原始备份与完成标记，保留全部软件Release、其他商品和权限。详见 `../product-listings-recovery-2026-09-16.md`。
- 独立工作区51/51测试、类型/构建和6组浏览器验证通过；主工作区并行Auth代码未覆盖。
- 生产是否已恢复以 `.local-verification/0.1.24/product-recovery-deployment.json` 的公网首页/详情证据为准，代码推送本身不代表恢复成功。

## 0.1.25 · open play 独立更新源官网兼容层 · 2026-09-16T14:12:00+08:00

新增四个固定地址兼容：appcast.xml、windows.json、两平台版本ZIP；直接返回已发布catalog对应原始字节，保留草稿/产品权限门禁与HEAD/Range。open-play发布前验证客户端固定公钥、两端版本构建、包签名/摘要与清单有效期，不重新生成Electron清单。下载页面排除更新元数据卡片，上传类型提示增加manifest。

基线保留另一个会话的0.1.24商品恢复提交。63测试、typecheck、生产构建、真实0.6.6.12已公开文件的服务器验证通过。桌面GitHub Release .12/672已公开、两渠道签名和匿名完整下载回读通过；网站代码部署与管理员正式发布是独立步骤，以`.local-verification/0.1.25/`的真实结果为准。未自动写生产catalog、未改权限或加入发布私钥。详见`../open-play-update-compatibility.md`。
