# OakTech 软件发布工作流

## 当前入口

构建系统通过以下接口导入软件发布草稿：

```text
POST /api/admin/releases/import
POST /api/admin/releases/upload
```

两个接口接受 `Authorization: Bearer <token>`。服务端令牌来自 `OAKTECH_RELEASE_WRITE_TOKEN`，长度必须至少为 32 字符。该机器身份只能创建或复用草稿并上传制品，不能发布版本。

浏览器后台原有的 Supabase 管理员会话上传入口保持可用。机器令牌是发布流水线的过渡实现；Casdoor 上线后应替换为标准 OAuth 2.0 Client Credentials 和 `store:release:write` scope，接口路径与发布描述不变。

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
