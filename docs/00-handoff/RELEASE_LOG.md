# 发布记录

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
