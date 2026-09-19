export const releaseErrors: Record<string, [string, string]> = {
  UNIFIED_UPDATE_INVALID: ["统一更新清单的签名、版本或安装包不匹配。请导入同一次发布的原始 updates.json 与安装包。", "The unified manifest signature, version or package does not match. Import the original manifest and packages from the same release."],
  OPEN_PLAY_MAC_METADATA_MISMATCH: ["macOS 更新清单的版本、安装包地址或大小不匹配。GitHub 导入请使用 appcast-website.xml（保存为 appcast.xml），不要使用 GitHub 专用的 appcast.xml。", "The macOS feed version, package URL or size does not match. Import appcast-website.xml as appcast.xml, not the GitHub-specific feed."],
  OPEN_PLAY_WINDOWS_METADATA_MISMATCH: ["Windows 更新清单的版本、构建、安装包或有效期不匹配。请使用同一版本的 windows-website.json（保存为 windows.json）；过期清单需由软件发布方重新签发。", "The Windows feed metadata or validity period does not match. Import the same release's windows-website.json as windows.json. Expired feeds must be reissued by the software publisher."],
  OPEN_PLAY_SIGNATURE_INVALID: ["更新清单或安装包签名无效。请重新导入同一版本的原始文件，不要编辑清单内容。", "The feed or package signature is invalid. Import the original files from the same release without editing their content."],
  OPEN_PLAY_UNSIGNED_FEED: ["macOS 更新清单缺少签名。请使用原始 appcast-website.xml 官网清单。", "The macOS feed is unsigned. Use the original appcast-website.xml website feed."],
  OPEN_PLAY_SIGNED_LENGTH_INVALID: ["macOS 更新清单的签名长度不匹配，文件可能被改写。请重新导入原始官网清单。", "The signed feed length does not match. Reimport the unmodified website feed."],
  OPEN_PLAY_FEED_FORMAT_INVALID: ["更新清单格式不正确，请使用同一版本的原始官网清单。", "Invalid feed format. Use the original website feeds from the same release."],
  OPEN_PLAY_SIGNED_ARTIFACTS_REQUIRED: ["缺少官网发布所需的两个安装包或两份签名清单，请返回软件版本补齐。", "The website release requires both packages and both signed feeds."],
  OPEN_PLAY_ARTIFACT_INVALID: ["发布文件的路径或大小不符合 open play 版本要求，请核对来源并重新导入。", "A release file has an invalid path or size. Check its source and reimport it."],
  OPEN_PLAY_RELEASE_IDENTITY_INVALID: ["open play 官网发布需要 stable 渠道和四段版本号。", "Open play website releases require the stable channel and a four-part version."],
  OPEN_PLAY_WEBSITE_FEED_REQUIRED: ["这是 GitHub 专用清单，请改用 appcast-website.xml 或 windows-website.json。", "This feed is for GitHub. Use appcast-website.xml or windows-website.json."],
  DRAFT_RELEASE_NOT_FOUND: ["版本不存在或已发布，不能移除文件。请刷新核对。", "The release is missing or published. Its files cannot be removed."],
  DRAFT_ARTIFACT_CHANGED: ["文件已变化，请刷新后重新核对。", "The file changed. Refresh and review it again."],
  RELEASE_STORAGE_ROOT_REQUIRED: ["发布存储尚未配置，请联系管理员检查服务配置。", "Release storage is not configured. Contact the administrator."],
};
export const releaseErrorMessages = Object.fromEntries(Object.entries(releaseErrors).map(([code, text]) => [code, text[0]]));
