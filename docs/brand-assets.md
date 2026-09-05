# 软件商店品牌资源

- Logo：`public/brand/oaktech-logo-v1.png`，2048×768 PNG，白底横向橡树图形与 OakTech 字标。
- 公开地址：`https://oaktechz.com/brand/oaktech-logo-v1.png`。
- 来源：用户在 2026-09-05 要求创建商店 Logo，随后要求上传到网站并替换 Casdoor 商店登录/注册页标题图片。
- 原始设计稿及 image_gen 提示词：`/Volumes/project/素材/OakTech品牌/商店Logo-2026-09-05/`。
- 发布版本：`0.1.15`。通过现有 Dockerfile 的 public 目录进入生产镜像；不需要登录或 Casdoor 会话即可读取。
- 验收：公网图片 HTTP 200、Content-Type 为 image/png，Casdoor 商店登录页与注册页实际显示该图片。部署与配置结果记录在 `docs/00-handoff/CURRENT_STATE.md`。
