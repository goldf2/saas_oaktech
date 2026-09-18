## 0.1.37 更新

在0.1.36既有双栏重排和页签定位基础上，视频标题及封面改为可选；有效链接仍必填，空备用来源仍需补齐或移除。默认显示“视频介绍”/“Video introduction”，不是自动获取平台标题。商品发布检查页取消额外勾选，明确点击发布按钮完成发布；保存和纯预览不发布，软件不受影响。YouTube/B站播放器自动加载、不自动播放，不再显示“加载播放器”按钮。用户正式草稿不会因代码部署而自动公开。当前完整约定见[简化发布与播放](product-publishing-simple.md)。

# 商品介绍视频源

更新时间：2026-09-18T09:00:04+08:00；发布候选：0.1.31；任务：VIDEO-01。

## 范围

商品编辑合并为「商品资料」「软件版本」「预览发布」。商品资料中统一编辑名称、文字、图片与视频；旧 `?tab=media` 链接定位到合并后的图片区。已有0.1.30的上传队列、发布检查和版本保存逻辑保留。

操作：编辑商品 → 商品资料 → 添加视频 → 粘贴YouTube/B站完整视频链接（标题可选） → 可上传封面、继续添加其他来源 → 保存草稿 → 预览发布 → 明确确认。

每个商品最多6段视频，每段最多4个来源；可以调整视频顺序、来源顺序或移除。第一条有效来源为默认显示来源；标题统一为商品视频标题，不自动抓取第三方标题。封面复用安全图片上传服务，默认占位不自动请求外站缩略图。

## 实现与协议

- `lib/store/product-videos.ts`：纯函数链接解析、稳定ID、数量/长度校验和输入归一化；不联网解析不可信短链接、不执行HTML。
- `components/admin/product-video-editor.tsx`：多视频/多源编辑、上传封面、排序和即时识别结果。
- `components/product-videos.tsx`：公开/预览共用的自动加载播放器；直接渲染经平台解析的iframe，无额外“加载播放器”按钮。使用浏览器原生lazy加载减少远离视口的视频请求，进入视频区域自动加载；autoplay=0，不自动播放。切换来源或离开预览销毁旧播放器。支持200px最小播放器尺寸、手机布局和键盘操作。
- `videos` 为可选商品字段，包含id、title、poster_url、sources；来源只保存id/label/url，不能由客户端指定iframe地址。
- 保存动作解析并验证新字段，缺字段的旧请求保留已有视频；视频封面参与原有图片归属/存在性检查和匿名访问判定。
- 视频资料被包含在草稿/发布指纹，过期编辑和过期确认被拒。未完成视频可以存草稿，但最终发布只校验有效来源，显示标题和封面可留空。

YouTube支持普通观看链接、youtu.be分享、Shorts、live、官方embed；归一为固定www.youtube-nocookie.com/embed路径。B站支持BV/av普通视频页及player.bilibili.com/player.html，保留分P和起始时间。两者默认不自动播放，使用官方播放器控制按钮。

其他HTTPS平台链接及B站b23.tv短链接保留外链观看，不作为iframe源。欲让B站短链接内嵌播放，请粘贴对应完整BV/av视频页。单个视频是当前范围，不宣称支持播放列表、B站番剧、所有平台的私有或付费视频。

播放器使用明确的功能权限、sandbox和严格来源Referer策略；加载后网络由第三方平台控制，平台可能跳转、显示登录/广告或拒绝外站播放。不同网络的可访问性和平台允许嵌入的状态不能由商城保证。用户链接、标题均不当成HTML执行；平台失败时有明确原平台入口。

## 数据边界

上传封面/保存草稿不会改变公开商品；公开必须明确确认。未公开封面仍是管理员私有。移除视频的草稿不会提前隐藏线上视频；发布移除后停止新匿名封面请求，但不声称撤销已下载副本。

本轮只更改代码，不为生产商品添加示例视频、替用户上传软件包、修改角色或初始化本地超管。GitHub自动同步及本地超管为独立任务，本次不混入。

## 验证命令与证据

```bash
npm test
npm run typecheck
npm run build
npm run test:video-ui
npm run test:video-ui -- --live-players
npm run test:store-ui
npm run test:release-ui
```

默认视频测试使用真实Chrome、本地隔离服务、临时目录和合成会话，外部iframe内容用明确标识的测试响应代替。它验证UI/URL/隐私/发布/持久化，但不当成实际YouTube/B站播放成功。`--live-players`在独立阶段访问真实官方播放器，加载与实际播放状态逐平台写入结果；限制单独记录。

已通过124项单元/动作回归、TypeScript和默认Turbopack构建；6组新增视频流程、12组完整商品流程、9组版本UI流程通过。另行访问真实YouTube/B站播放器并点击播放，两者均观测到readyState>=2、paused=false、媒体时间超过起始位置0.25秒。证据为 `00-handoff/evidence/2026-09-18-product-videos.json`。原生签名Release因未提供独立fixture未重复发布。源码推送及公网状态另记，不因本地通过就标记线上完成。

## 依据

- YouTube官方嵌入参数：https://developers.google.com/youtube/player_parameters
- YouTube iframe API及播放器最低尺寸：https://developers.google.com/youtube/iframe_api_reference
- B站官方站外播放器参数：https://player.bilibili.com/

不要求用户提供API密钥，不把视频转存到商城服务器，不改变安装包下载地址。
