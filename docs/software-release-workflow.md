# OakTech 软件发布工作流

## 当前入口

构建系统通过以下接口导入软件发布草稿：

```text
POST /api/admin/releases/import
POST /api/admin/releases/upload
```

两个接口接受 `Authorization: Bearer <token>`。服务端令牌来自 `OAKTECH_RELEASE_WRITE_TOKEN`，长度必须至少为 32 字符。该机器身份只能创建或复用草稿并上传制品，不能发布版本。

浏览器后台继续使用当前配置的 Casdoor/Supabase 管理员会话上传，机器凭据不能替代管理员最终发布。机器令牌是发布流水线的过渡实现；Casdoor 上线后应替换为标准 OAuth 2.0 Client Credentials 和 `store:release:write` scope，接口路径与发布描述不变。

## 发布描述

```json
{
  "schemaVersion": 1,
  "productSlug": "gitfinder-2",
  "version": "2.0.0-alpha.88",
  "channel": "alpha",
  "sourceCommit": "0123456789abcdef0123456789abcdef01234567",
  "title": { "en": "Release title", "zh": "发布标题" },
  "notes": { "en": "Release notes", "zh": "发布说明" },
  "artifacts": []
}
```

导入接口以产品、版本和渠道作为幂等键。同一键和提交可安全重试；提交不同则拒绝覆盖。上传接口以平台、架构和包类型作为制品槽位，客户端只有在现有文件名、大小和 SHA-512 完全相同时才跳过。

## 存储与发布

- 草稿、版本、制品元数据：`RELEASE_STORAGE_ROOT/catalog.json`。
- 安装包：`RELEASE_STORAGE_ROOT/<product>/<channel>/<version>/`。
- 临时分片：`RELEASE_STORAGE_ROOT/.uploads/`。
- 审计日志：`RELEASE_STORAGE_ROOT/audit/store-admin.jsonl`。
- 版本安装包只有所属 Release 已发布后才能通过公开路由下载。
- `latest.yml` 与 `latest-mac.yml` 根据当前 Published Release 动态解析，使用 `no-store`。
- 版本化安装包使用不可变缓存策略。

管理员在 `/admin/releases` 检查草稿后点击 `Verify and publish`。服务端重新计算所有制品的大小与 SHA-512，只使用 macOS ZIP 和 Windows NSIS 生成更新清单，避免把 Windows 便携 ZIP 错写成自动更新目标，然后原子切换当前 Published Release。


## 商品与版本边界（0.1.22）

`/admin/products` 管理商品名称、分类、展示资料和公开状态；`/admin/releases` 管理独立版本草稿、软件包与发布状态。创建重复商品标识会明确拒绝，不会覆盖已有商品。已保存版本的商品、版本号和渠道固定，编辑说明保留 source commit。

网页和机器导入使用相同版本格式校验，允许 `1.2.3`、`1.2.3-alpha.1`、`0.6.6.10` 等。商城版本格式与具体桌面更新框架的格式不是同一份契约，四段版本不代表可直接交给 Electron/Sparkle 更新客户端。

普通软件包（例如浏览器扩展、Linux包、便携包）通过文件大小与SHA-512校验即可发布，不要求一定有macOS/Windows更新制品。兼容的macOS ZIP / Windows NSIS仍生成Electron清单，其余包使用不可变的版本化下载链接；没有对应清单的版本不应把清单404视为软件下载失败。

浏览器上传使用8 MiB分片，单文件上限4 GiB。界面只有收到服务器的字节确认和最终SHA-512后才显示成功。分片上传不等于已实现断网自动续传。并发槽位在目录提交时重新校验；文件已入目录后发生审计写入失败，会明确反馈文件已保存，不删除已登记文件。

本地回归：

```bash
npm test
npm run typecheck
npm run build
npm run test:store-ui
```

最后一项使用隔离目录、测试会话与虚构9 MiB包启动本地服务，验证实际后台表单与匿名下载，不登录真实Casdoor、不发布生产软件。需要可用的Chrome或Puppeteer浏览器。
