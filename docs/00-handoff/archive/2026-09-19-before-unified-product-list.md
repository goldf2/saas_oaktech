# 当前状态

更新时间：2026-09-18T23:12:21+08:00。集成候选版本0.1.33。

## 统一工作台与独立发布已完成本地集成验收

Dashboard和商品后台统一为 `/dashboard`。管理员直接管理商品、图文视频和版本；普通用户只见公开软件目录及账号支持。桌面/手机只有一个工作台入口；旧 `/admin`、`/admin/products` 经原授权后保留筛选转入工作台，商品编辑深链接继续有效。原页面没有真实购买/许可证查询，本次移除固定0统计而不是修改真实订单。

PUB-01与远端ec93734/0.1.32紧凑界面已经合并，保留折叠预览、紧凑文件表与上传区。商品资料和软件版本分别确认、各自校验；已实际跑通无软件先上架商品、稍后发布软件，软件发布不消费商品介绍草稿，版本原位保存不丢未保存资料。历史下载和既有服务器授权不变。

147项单元/动作测试、类型检查、默认Turbopack构建通过。43组隔离Chrome检查：工作台6、独立发布6、紧凑UI3、商品13、发布UI9、视频6。见[验收证据](evidence/2026-09-18-unified-workspace-publishing.json)、[统一工作台](../unified-workspace.md)和[独立发布](../decoupled-publishing.md)。本次没有进行正式账号登录或发布真实商品/软件，不用隔离会话代替生产验收。CI与公网待提交后单独核验，结果写入`.local-verification/integrated-workspace/deployment.json`。

## 原有工作保留

独立集成树：`/Users/tefulong/.agentdock/tmp/oaktech-pub01-integrated-20260918`，分支`feat/decoupled-publishing-integrated-20260918`。主项目18项与原解耦树2项既有未提交文件哈希均保持不变。不要从主目录旧.29 HEAD覆盖新的远端成果；先fetch核对。合并前两套状态分别保存在archive的pub01-integration快照中。

本地超级管理员、用途类别/多平台发布、GitHub主动拉取、视频标题/封面自动抓取仍为独立未交付任务，不因本次合并标为完成。
