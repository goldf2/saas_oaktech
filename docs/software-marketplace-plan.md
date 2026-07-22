# 软件商城平台规划设计

## 目标定位

本站应作为个人软件商城平台，而不是单一浏览器插件官网。

核心定位：

- 展示和销售自研软件产品。
- 支持多个产品类别，浏览器插件只是其中一个类别。
- 每个产品拥有独立详情页、价格方案、下载/购买入口、支持说明。
- 后续可扩展到桌面软件、Web 工具、AI 工具、开发者工具等类别。

成功标准：

- 用户进入首页后能理解这是一个软件商城。
- 用户能按类别找到产品，例如浏览器插件。
- 单个产品详情页能清楚说明功能、截图、价格、安装/使用方式、隐私和权限。
- 购买、登录、用户仪表盘、许可证/下载入口与商品体系保持一致。
- 新增一个产品时主要改配置和素材，不需要重写页面结构。

## 推荐站点结构

### 一级页面

- `/`
  - 平台首页。
  - 展示品牌、主打产品、产品分类、精选商品、购买优势。

- `/products`
  - 所有产品列表。
  - 支持分类筛选、平台筛选、价格筛选、搜索。

- `/categories/browser-extensions`
  - 浏览器插件分类页。
  - 展示所有插件产品，如 X Tweet Extractor。

- `/products/[slug]`
  - 单个产品详情页。
  - 每个产品使用统一模板，但内容来自产品配置。

- `/pricing`
  - 可选。
  - 如果未来有统一会员、套装、订阅，可以保留。
  - 如果当前主要是单品售卖，可暂时不作为主导航。

- `/dashboard`
  - 用户已购买产品、许可证、下载链接、订单状态。

- `/support`
  - 支持入口、常见问题、联系邮箱。

- `/privacy`、`/terms`
  - 法务页面。
  - 需要覆盖网站账号/支付，也需要覆盖具体浏览器插件的数据处理说明。

### 首页信息架构

首页建议按以下顺序：

1. 平台 Hero
   - 标题：例如 `Independent software for focused work`
   - 副标题：说明这里售卖浏览器插件、桌面工具、开发者工具等。
   - 主按钮：`Browse Products`
   - 次按钮：`View Browser Extensions`

2. 产品分类入口
   - Browser Extensions
   - Developer Tools
   - Desktop Apps
   - AI Utilities
   - Productivity Tools

3. Featured Products
   - 当前优先放 X Tweet Extractor。
   - 卡片显示：图标、类别、平台、价格状态、简短功能、详情按钮。

4. Why Buy Here
   - One-time licenses / fair pricing
   - Clear privacy and permissions
   - Direct support from maker
   - Lifetime or versioned updates

5. Launch / Beta 区域
   - 对还在开发或 Beta 的产品显示状态。
   - 例如：`X Tweet Extractor is currently in beta`.

6. CTA
   - `Explore all products`
   - `Contact support`

## 产品分类设计

建议使用稳定分类枚举：

- `browser-extension`
  - Chrome、Edge、Firefox、Safari 插件。

- `desktop-app`
  - macOS、Windows、Linux 应用。

- `developer-tool`
  - JSON、API、数据库、代码相关工具。

- `ai-tool`
  - AI 辅助、提示词、自动化工具。

- `productivity-tool`
  - 信息整理、批处理、效率工具。

分类页应包含：

- 分类说明。
- 适用平台筛选。
- 产品列表。
- Beta / Released / Planned 状态标记。

## 产品详情页模板

每个产品详情页建议包含：

1. 产品首屏
   - 图标、名称、类别、状态。
   - 一句话定位。
   - 主截图或宣传图。
   - CTA：购买、下载、申请 Beta、查看安装说明。

2. 功能亮点
   - 3 到 6 个功能卡片。
   - 只写用户结果，不写实现细节。

3. 使用流程
   - 3 到 5 步。
   - 浏览器插件应包含安装和权限说明。

4. 截图/演示
   - 商品真实界面截图。
   - 浏览器插件至少展示 popup、运行页面、导出结果。

5. 平台与兼容性
   - Chrome / Edge / Firefox / macOS / Windows 等。

6. 价格与许可证
   - Free / Pro / Team / One-time / Subscription。
   - 未商业化产品用 `Beta` 或 `Coming soon`，不要强行展示假价格。

7. 隐私、权限、数据说明
   - 对浏览器插件尤其重要。
   - 用明确语言解释 `activeTab`、`scripting`、`storage`、`downloads`、`host_permissions`。

8. FAQ
   - 是否上传数据？
   - 是否需要账号？
   - 支持哪些格式？
   - 失败时如何处理？

## 数据配置建议

当前 `config/products.ts` 可以升级为更完整的商品配置。

建议字段：

```ts
type ProductStatus = "beta" | "released" | "coming-soon" | "archived";
type ProductCategory =
  | "browser-extension"
  | "desktop-app"
  | "developer-tool"
  | "ai-tool"
  | "productivity-tool";

interface Product {
  slug: string;
  name: string;
  shortName?: string;
  status: ProductStatus;
  category: ProductCategory;
  tagline: string;
  description: string;
  icon: string;
  heroImage?: string;
  screenshots: string[];
  platforms: string[];
  browsers?: string[];
  features: ProductFeature[];
  useCases: string[];
  installSteps?: string[];
  permissions?: ProductPermission[];
  pricing: ProductPricing[];
  supportEmail: string;
}
```

这样浏览器插件和桌面软件都可以共用同一个详情页模板。

## X Tweet Extractor 在平台中的位置

类别：

- Browser Extensions

状态：

- Beta 或 In development

商品定位：

- Extract visible tweets from X user profiles and export structured text data.

推荐展示重点：

- Extract up to 10,000 visible tweets per run.
- Export JSON, CSV, TXT, HTML, Markdown.
- Optional date range.
- Stop extraction anytime.
- Local browser processing.
- 14-language UI.

权限说明：

- `activeTab`：用户点击插件后访问当前 X 页面。
- `scripting`：向 X 页面注入提取脚本。
- `storage`：保存语言偏好，未来可保存授权状态。
- `downloads`：保存导出文件到本机。
- `host_permissions`：仅限 `x.com` 和 `twitter.com`。

## 视觉设计方向

整体风格建议：

- 平台感，而不是单品营销页。
- 清爽、可信、偏工具型。
- 首页信息密度适中，产品卡片清楚可扫描。
- 不使用过重的装饰背景，优先展示真实产品图标和截图。

组件建议：

- 分类使用带图标的入口块。
- 商品使用统一 ProductCard。
- 状态使用 Badge：
  - Beta
  - Released
  - Coming soon
  - Browser Extension
  - One-time
  - Free

导航建议：

- Products
- Categories
- Browser Extensions
- Support
- Dashboard / Sign in

## 分阶段实施计划

### 第 1 阶段：恢复平台首页

目标：

- 把当前站点从单插件官网调整为软件商城首页。
- 浏览器插件作为分类入口之一。
- X Tweet Extractor 作为 Featured Product。

改动范围：

- `app/page.tsx`
- `components/header.tsx`
- `components/footer.tsx`
- `app/layout.tsx`
- `config/products.ts`

验证：

- `npm run build`
- 首页能明确表达软件商城平台。

### 第 2 阶段：商品体系配置化

目标：

- 扩展 `Product` 数据结构。
- 让 `/products/[slug]` 使用统一商品模板。
- 支持 Beta / Released 状态。

改动范围：

- `config/products.ts`
- `app/products/[slug]/page.tsx`
- 新增分类常量和辅助函数。

验证：

- X Tweet Extractor 详情页使用真实截图、功能、权限和安装说明。

### 第 3 阶段：分类页

目标：

- 新增 `/products` 和 `/categories/browser-extensions`。
- 用户可按类别浏览。

改动范围：

- `app/products/page.tsx`
- `app/categories/[category]/page.tsx`
- ProductCard 组件。

验证：

- 浏览器插件分类页能显示 X Tweet Extractor。

### 第 4 阶段：购买和授权

目标：

- 根据产品状态决定 CTA：
  - Beta：申请测试 / 下载说明。
  - Released：购买 / Checkout。
  - Coming soon：加入等待列表。

改动范围：

- `config/subscriptions.ts`
- `components/pricing-section.tsx`
- `app/api/creem/create-checkout/route.ts`
- `app/dashboard/page.tsx`

验证：

- 未发布产品不会出现误导性付款入口。
- 已发布产品能进入支付流程。

### 第 5 阶段：插件发布支持

目标：

- 为 Chrome Web Store 审核准备公开页面。

建议新增：

- `/products/x-tweet-extractor/privacy`
- `/products/x-tweet-extractor/support`
- `/products/x-tweet-extractor/install`

验证：

- Chrome Web Store listing 可引用隐私政策公网 URL。
- 权限说明与插件 manifest 一致。

