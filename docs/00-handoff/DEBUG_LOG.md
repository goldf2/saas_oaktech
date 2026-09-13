# Debug 记录

## DOWNLOAD-20260905-01 · 公网大制品 Range 返回 200

- 状态：待定位，2026-09-05T08:49:05+08:00 复现。
- 现象：`/releases/gitfinder-2/alpha/2.0.0-alpha.86/GitFinder-2-2.0.0-alpha.86-arm64-mac.zip` 的 GET/HEAD `Range: bytes=0-1023` 均 HTTP 200，缺少 Content-Range/Content-Length/Accept-Ranges；GET 为 chunked。请求带 Accept-Encoding: identity，无重定向、无 Content-Encoding；Cloudflare 为 BYPASS。
- 对照：本站 `latest-mac.yml` 的 `Range: bytes=0-31` 返回 HTTP 206、Content-Range bytes 0-31/426、Content-Length 32；两份完整 manifest 均 HTTP 200 且 current alpha.86。
- 范围：请求都限制到 1024/2048 字节，未全量下载或修改发布记录。`a7cd1c5` 到 `7442de3` 下载 route/resolvePublicDownload/storage/next.config 无变化；proxy 变更仅将匹配限定于 Dashboard。
- 假设：大制品的应用/代理/CDN 路径需要对照；未锁定根因，未证实发生于本次部署之前。
- 下一步：在 Con01 容器内对同一 ZIP 发起直连 Range 请求，对照源站与公网响应头后再决定修改位置。
