# open play 更新兼容层 · 商城 0.1.25

本次在0.1.24商品恢复版本之上增加更新兼容层，保留其一次性迁移和所有既有权限。

## 四个固定地址

`/updates/open-play/appcast.xml`、`/updates/open-play/windows.json` 从持久catalog中的open-play/stable唯一当前正式版本取对应签名清单。`/downloads/open-play-<四段版本>-macos.zip`、`...-windows-x64.zip` 从对应已发布版本读取ZIP。

别名直接流式返回原始字节，不跳到GitHub、不加入HTML或语言重定向；GET/HEAD/Range复用下载实现。XML/JSON使用正确Content-Type，清单no-store/no-transform，版本包immutable。catalog不存在、产品未公开、版本为草稿、多个current冲突、文件名/存储路径不匹配均不可下载；不开放整个数据目录。

## 发布文件

当前桌面公开版为0.6.6.12/build672，GitHub Release有7个上传附件。其中两ZIP可直接用于官网；官网清单必须使用appcast-website.xml/windows-website.json的原始字节，并在上传前只更改本地文件名为appcast.xml/windows.json。不要改文件内容，不要把指向GitHub安装包的清单当作独立官网源。

后台为open-play创建stable/0.6.6.12草稿；Mac ZIP使用platform=macos、architecture=arm64、package_kind=zip；Windows ZIP使用windows、x64、zip；两个清单分别使用相同平台/架构和package_kind=manifest。上传控件是自由输入的类型字段，可填写manifest。官网签名清单和blockmap不会在商品下载卡片里被当作安装包展示。

先完成两包上传，再上传两清单。最后由有权限的管理员执行Verify and publish，保持既有发布门禁；机器写入令牌仅导入草稿/上传，不提升为管理员。

## 发布前验证

先沿用全部制品的长度/SHA-512验证，再用客户端既有公钥验证Mac feed、Mac ZIP、Windows完整签名载荷以及Windows包SHA-256。两端版本、构建号和固定官网包URL必须一致，Windows时间/有效期必须有效。只接收四段版本和stable频道。服务器仅存公钥，不保留签名私钥。

open-play不生成Electron latest.yml/latest-mac.yml，不改写已签名文件。其他产品原有更新流程不变。全部验证通过后再由现有catalog事务公开/切换current；发布操作完成后从公网回读两包和两清单。

## 验证与部署边界

本地63测试、类型检查、生产构建通过；实际从GitHub匿名下载的0.6.6.12官网清单和两包也通过服务器验证函数。公网发布需按现有ci-deploy工作流和授权后台操作完成，不能只凭health版本或GitHub Release判断官网文件已经上线。

旧客户端.10/.11仍依赖这些固定官网地址；官网未发布时需从GitHub手动升级到.12一次。.12拥有自动/GitHub/官网三种来源，GitHub清单独立指向GitHub包，不依赖官网。

运行部署状态与CI证据见`.local-verification/0.1.25/`及本地Auth项目交接记录；不要因缺失CI凭据或管理员会话而关闭签名校验、扩大权限或自动公开历史草稿。
