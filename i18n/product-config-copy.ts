import type { Locale } from "@/lib/store/types";
import type { SoftwareProduct } from "@/config/products";

const overrides: Record<string, Partial<Record<Locale, Partial<SoftwareProduct>>>> = {
  "x-tweet-extractor": {
    zh: {
      name: "X 推文提取器",
      installSteps: [
        "联系 OakTech 支持获取当前测试版本。",
        "打开 Chrome 扩展程序页面，启用“开发者模式”，选择“加载已解压的扩展程序”。",
        "打开 X 用户主页，启动扩展并开始提取。",
        "选择导出格式，将已收集的数据保存到本机。",
      ],
      permissions: [
        { name: "scripting", description: "仅在你选择的 x.com 与 twitter.com 页面运行本地提取脚本。" },
        { name: "storage", description: "保存界面偏好，例如语言选择以及未来的本地许可状态。" },
        { name: "downloads", description: "把导出文件、媒体 URL 列表和你主动触发的媒体下载保存到电脑。" },
        { name: "x.com / twitter.com", description: "将扩展访问和提取逻辑限制在你选择的 X/Twitter 页面。" },
      ],
    },
  },
  "gitfinder-2": {
    zh: {
      installSteps: [
        "从 GitFinder 2 发布页下载适合当前操作系统的软件包。",
        "macOS 解压后移入“应用程序”；Windows 运行 x64 安装器。",
        "只授权 GitFinder 2 访问需要管理的目录。",
        "添加项目目录，并可选连接一个只读权限的 Coolify 账号。",
      ],
    },
  },
  "open-play": {
    en: {
      name: "Open Play Auth Manager",
      installSteps: [
        "Download the package for your operating system.",
        "Install or extract the application and launch it.",
        "Import auth.json and choose the local profile you want to manage.",
      ],
    },
  },
  "chanxu-tradingview": {
    en: {
      name: "Chanxu TradingView Research Tool",
      installSteps: [
        "Request access to the research preview.",
        "Install the script in the TradingView Pine Editor and review signals on your chart.",
      ],
    },
  },
};

export function localizedConfiguredProduct(product: SoftwareProduct, locale: Locale): SoftwareProduct {
  return { ...product, ...(overrides[product.slug]?.[locale] ?? {}) };
}
