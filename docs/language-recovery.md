# LANG-01 语言自动识别恢复

基线8bddf42 / 0.1.34；隔离树fix/language-preference-20260919，不覆盖主目录管理员草稿。

## 复现
公网无Cookie且Accept-Language为zh-CN时307 /zh；同一请求携带旧oaktech-locale=en后307 /en。旧代码将每次自动识别、语言路径读取结果写入一年期Cookie，无法区分手动选择与自动结果。非语言前缀路径的Header/Footer仅按路径解析，始终回退英文；原语言切换在dashboard会跳首页且手机隐藏。

## 修复范围
用新显式偏好oaktech-language-preference记录auto/en/zh。优先级为明确语言URL、手动偏好、浏览器Accept-Language、英文兜底。旧cookie不再作为手动选择证据，用户无须清除账号Cookie。Proxy从不因读取或预取写语言Cookie；自动重定向禁止缓存。只在支持的商城路径增加语言前缀，账号/编辑/支持路径保留。请求语言传给根布局和客户端Provider，导航、页脚和html lang共用；按钮不预取，切换时使用router refresh保留输入，手机可用紧凑选择框。

本任务修复语言选择与已有中英文导航，不声称自动翻译尚未国际化的管理表单文案，也不改商品中英文内容、权限或安装包接口。语言Cookie不是身份凭证。

## 验证
新增代理与纯函数测试覆盖优先级、旧cookie、prefetch、副作用、POST/下载边界；真实Chrome覆盖首次访问、手动/自动、跨路由、筛选与未保存字段、320/390px。复跑工作台、独立发布、商品、版本、视频、紧凑UI。单元/构建/浏览器/远端/公网结果分别记录。

## 本轮工具范围
首次针对已知config/proxy/switcher/layout的读取成功；一次广域文档与文本搜索调用被安全检查拒绝，没有执行，也未换通道重做该读取。之后修复限于已完整取得源码的语言组件和新增的隔离测试。

参考：Next.js proxy request headers与useRouter.refresh官方文档。
https://nextjs.org/docs/app/api-reference/file-conventions/proxy
https://nextjs.org/docs/app/api-reference/functions/use-router


## 最终本地结果

165项单元/代理/动作测试、类型检查、默认生产构建通过；7组新增语言与45组既有隔离浏览器回归通过。查看evidence/2026-09-19-language-recovery.json（在00-handoff目录）。语言测试确认未保存商品输入及文件原文未被切换保存或发布。未重复测试真实用户生产编辑。
