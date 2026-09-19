import type { Locale } from "@/lib/store/types";

const auth = {
  en: {
    welcome: "Welcome back", signInDescription: "Enter your email to sign in to your account", email: "Email", password: "Password",
    forgot: "Forgot password?", signingIn: "Signing in...", signIn: "Sign in", continue: "Or continue with",
    googleSignIn: "Sign in with Google", noAccount: "Don't have an account?", signUp: "Sign up",
    create: "Create your account", signUpDescription: "Create an account to access OakTech services.",
    creating: "Creating account...", createAccount: "Create account", googleSignUp: "Sign up with Google",
    hasAccount: "Already have an account?", reset: "Reset password", resetDescription: "Enter your email address and we'll send you a password reset link.",
    sending: "Sending reset link...", sendReset: "Send reset link", remember: "Remember your password?",
    newPasswordDescription: "Enter your new password below.", newPassword: "New password", confirmPassword: "Confirm password",
    resetting: "Resetting...", casdoorSignIn: "Continue with OakTech account", casdoorSignUp: "Create OakTech account",
    casdoorDescriptionSignIn: "Sign in securely through the OakTech identity service.", casdoorDescriptionSignUp: "Create your account securely through the OakTech identity service.",
    casdoorNeed: "Need an account?", casdoorHave: "Already have an account?",
  },
  zh: {
    welcome: "欢迎回来", signInDescription: "输入邮箱登录你的账号", email: "邮箱", password: "密码",
    forgot: "忘记密码？", signingIn: "正在登录…", signIn: "登录", continue: "或使用以下方式继续",
    googleSignIn: "使用 Google 登录", noAccount: "还没有账号？", signUp: "注册",
    create: "创建账号", signUpDescription: "创建账号以使用 OakTech 服务。",
    creating: "正在创建账号…", createAccount: "创建账号", googleSignUp: "使用 Google 注册",
    hasAccount: "已有账号？", reset: "重置密码", resetDescription: "输入邮箱地址，我们会向你发送密码重置链接。",
    sending: "正在发送重置链接…", sendReset: "发送重置链接", remember: "想起密码了？",
    newPasswordDescription: "请在下方输入新密码。", newPassword: "新密码", confirmPassword: "确认密码",
    resetting: "正在重置…", casdoorSignIn: "使用 OakTech 账号继续", casdoorSignUp: "创建 OakTech 账号",
    casdoorDescriptionSignIn: "通过 OakTech 统一身份服务安全登录。", casdoorDescriptionSignUp: "通过 OakTech 统一身份服务安全创建账号。",
    casdoorNeed: "需要创建账号？", casdoorHave: "已有账号？",
  },
} as const;

const about = {
  en: {
    title: "About OakTech", description: "OakTech is an independent software studio building practical tools for focused work. We develop browser, desktop, research, and developer utilities around clear workflows.",
    cards: [
      ["Defined jobs", "Each product begins with a clear workflow and stays focused on solving it well."],
      ["Transparent defaults", "Permissions, data handling, and release status are explained before you install or use a product."],
      ["Built to last", "The catalog grows gradually with maintainable software and clear release histories."],
    ],
    sectionTitle: "A small catalog, deliberately built", sectionText: "Browse the catalog for current capabilities, supported platforms, release status, and available downloads.", action: "Browse products",
  },
  zh: {
    title: "关于 OakTech", description: "OakTech 是一家独立软件工作室，专注于为实际工作流程打造实用工具，覆盖浏览器、桌面端、研究和开发者场景。",
    cards: [
      ["明确的工作目标", "每个产品都从清晰的工作流程出发，集中解决具体问题。"],
      ["透明的默认设置", "安装或使用前会说明权限、数据处理方式和真实发布状态。"],
      ["持续可维护", "产品目录稳步扩展，并保留清晰的版本和发布历史。"],
    ],
    sectionTitle: "小而清楚的软件目录", sectionText: "从产品目录查看当前功能、支持平台、发布状态和可用下载。", action: "浏览全部产品",
  },
} as const;

const support = {
  en: {
    eyebrow: "OakTech support", title: "Get product help directly.", description: "Contact support for installation help, beta access, product feedback, account questions, or data-handling questions.",
    cards: [["Product support", "Ask about installation, account access, downloads, or an active beta build."], ["Feedback", "Share an edge case, workflow need, or idea for a future release."], ["Privacy questions", "We can explain what a product accesses and where your data is processed."]],
    email: "Email support", products: "Browse products",
  },
  zh: {
    eyebrow: "OakTech 支持", title: "直接获取产品帮助。", description: "安装、测试资格、产品反馈、账号问题或数据处理问题，都可以联系支持。",
    cards: [["产品支持", "咨询安装、账号访问、软件下载或当前测试版本。"], ["反馈建议", "提交边界情况、工作流程需求或后续版本建议。"], ["隐私问题", "我们可以说明产品访问哪些数据，以及数据在哪里处理。"]],
    email: "邮件联系支持", products: "浏览产品",
  },
} as const;

const privacy = {
  en: {
    title: "Privacy Policy", updated: "Last updated: July 5, 2026", back: "Back to Home",
    sections: [
      ["1. Introduction", ["OakTech (“we”, “us”, or “our”) respects your privacy and is committed to protecting personal data. This policy explains how information is handled when you visit our website or use OakTech software."]],
      ["2. Information We Collect", ["We may collect account information needed for authentication, purchase or transaction records when a paid product is used, basic service and security logs, and support communications. Payment details are processed by the payment provider and are not stored as card data by OakTech."]],
      ["3. How We Use Information", ["We use information to operate accounts and purchases, provide support, deliver important product updates, improve the service, and detect fraud or abuse."]],
      ["4. Data Sharing", ["We do not sell personal data. Information may be processed by service providers used for authentication, hosting, payment processing, and transactional or support email, or disclosed when required by law."]],
      ["5. Data Security", ["We use reasonable technical and organizational safeguards, including access controls and encrypted transport where applicable. No internet transmission or storage method can be guaranteed completely secure."]],
      ["6. Your Rights", ["Depending on applicable law, you may request access, correction, deletion, or export of personal data associated with your account. Contact support@oaktech.dev for a request."]],
      ["7. Cookies", ["Essential cookies are used for authentication, session management, language preference, and other required site functions. Optional analytics, if introduced, will be documented separately."]],
      ["8. Children’s Privacy", ["OakTech services are not directed to children under 16 and we do not knowingly collect their personal data. Contact us if you believe a minor’s data has been provided."]],
      ["9. Changes to This Policy", ["This policy may be updated as products or service providers change. Material changes will be reflected on this page with an updated date."]],
      ["10. Contact Us", ["Questions about this policy can be sent to support@oaktech.dev."]],
    ],
  },
  zh: {
    title: "隐私政策", updated: "最后更新：2026年7月5日", back: "返回首页",
    sections: [
      ["1. 说明", ["OakTech（“我们”）尊重你的隐私并重视个人数据保护。本政策说明你访问网站或使用 OakTech 软件时相关信息如何被处理。"]],
      ["2. 我们可能收集的信息", ["我们可能收集身份验证所需的账号信息、使用付费产品时的购买或交易记录、必要的服务与安全日志，以及你主动发送的支持沟通内容。支付卡信息由支付服务商处理，OakTech 不保存完整卡片数据。"]],
      ["3. 信息用途", ["我们使用相关信息提供账号与购买服务、客户支持、重要产品通知、服务改进，以及识别欺诈或滥用行为。"]],
      ["4. 数据共享", ["我们不出售个人数据。为提供服务，信息可能由身份验证、托管、支付处理、交易或支持邮件等服务商处理；法律要求时也可能依法披露。"]],
      ["5. 数据安全", ["我们采取合理的技术与组织措施，包括访问控制及适用情况下的加密传输。但任何互联网传输或存储方式都无法保证绝对安全。"]],
      ["6. 你的权利", ["根据适用法律，你可以请求访问、更正、删除或导出与你账号相关的个人数据。请通过 support@oaktech.dev 联系我们。"]],
      ["7. Cookie", ["网站使用身份验证、会话管理、语言偏好及其他必要功能所需的 Cookie。如未来启用可选分析功能，我们会另行说明。"]],
      ["8. 未成年人隐私", ["OakTech 服务并非面向16岁以下未成年人，我们不会主动收集其个人数据。如你认为有未成年人数据被提供给我们，请联系我们。"]],
      ["9. 政策更新", ["随着产品或服务商变化，本政策可能更新。重要变更会在本页面体现，并更新日期。"]],
      ["10. 联系我们", ["如对本隐私政策有疑问，请联系 support@oaktech.dev。"]],
    ],
  },
} as const;

const terms = {
  en: {
    title: "Terms of Service", updated: "Last updated: July 23, 2026", back: "Back to Home",
    sections: [
      ["1. Agreement to Terms", ["By accessing OakTech websites or using OakTech software, you agree to these Terms of Service. If you do not agree, do not purchase or use the applicable product."]],
      ["2. Products and Licenses", ["OakTech offers browser, desktop, research, and developer software. License scope, supported platforms, permitted use, and any seat or device limits are stated on the applicable product or checkout page. Beta or evaluation access does not by itself grant a commercial license."]],
      ["3. Acceptable Use", ["Do not use OakTech software for illegal or unauthorized purposes, remove proprietary notices, or redistribute, resell, sublicense, or share paid licenses outside their permitted scope. Applicable reverse-engineering restrictions are subject to mandatory local law."]],
      ["4. Payment and Pricing", ["Prices and payment terms apply only when a product is offered for purchase. Checkout displays the applicable price, taxes, license terms, and payment provider. A Beta or Coming soon label is not a paid checkout offer."]],
      ["5. Refunds", ["Refund eligibility, when offered, is stated on the applicable product or checkout page. Contact support@oaktech.dev with purchase questions and relevant order details."]],
      ["6. Intellectual Property", ["OakTech software, branding, and original content remain the intellectual property of their respective owners. A purchased license grants only the use rights stated for that product."]],
      ["7. Warranty Disclaimer", ["Unless required by law or explicitly stated otherwise, software is provided “as is” without additional warranties. Beta and evaluation builds may change or contain defects."]],
      ["8. Limitation of Liability", ["To the extent permitted by applicable law, OakTech is not responsible for indirect or consequential losses arising from use of the service. Mandatory consumer rights remain unaffected."]],
      ["9. Updates and Support", ["Update availability and support vary by product and release status. Beta builds may change, pause, or be replaced. Current release information is shown on the product page."]],
      ["10. Account or License Suspension", ["Access may be suspended when these terms, applicable license conditions, or security requirements are materially violated, subject to applicable law."]],
      ["11. Changes to Terms", ["These terms may be updated as products and services evolve. Material changes will be reflected on this page with an updated date."]],
      ["12. Contact Us", ["Questions about these terms can be sent to support@oaktech.dev."]],
    ],
  },
  zh: {
    title: "服务条款", updated: "最后更新：2026年7月23日", back: "返回首页",
    sections: [
      ["1. 接受条款", ["访问 OakTech 网站或使用 OakTech 软件即表示你同意本服务条款。如不同意，请不要购买或使用相关产品。"]],
      ["2. 产品与许可", ["OakTech 提供浏览器、桌面端、研究和开发者软件。许可范围、支持平台、允许用途以及席位或设备限制，以对应产品页或结账页说明为准。测试版或评估版的提供本身不构成商业许可。"]],
      ["3. 可接受使用", ["不得将 OakTech 软件用于违法或未授权用途，不得移除权利声明，也不得超出许可范围重新分发、转售、再许可或共享付费许可。关于逆向工程的限制以当地强制性法律规定为准。"]],
      ["4. 付款与价格", ["仅当产品明确开放购买时，页面所示价格和付款条件才适用。结账页会说明价格、税费、许可条件及支付服务商。标记为“测试版”或“即将推出”的产品不代表已经开放付费购买。"]],
      ["5. 退款", ["如提供退款，其资格和条件以对应产品页或结账页为准。购买相关问题请联系 support@oaktech.dev，并提供必要订单信息。"]],
      ["6. 知识产权", ["OakTech 软件、品牌及原创内容的知识产权归其相应权利人所有。购买许可仅授予该产品明确说明的使用权。"]],
      ["7. 保证免责声明", ["除法律强制要求或另有明确承诺外，软件按“现状”提供，不附加其他保证。测试版和评估版可能发生变化或存在缺陷。"]],
      ["8. 责任限制", ["在适用法律允许范围内，OakTech 不对使用服务产生的间接或后果性损失承担责任；法律规定的消费者强制性权利不受影响。"]],
      ["9. 更新与支持", ["更新和支持范围因产品及发布状态而异。测试版本可能变化、暂停或被替换，当前发布信息以产品页为准。"]],
      ["10. 账号或许可暂停", ["如严重违反本条款、适用许可条件或安全要求，相关访问可能被暂停，具体仍以适用法律为准。"]],
      ["11. 条款更新", ["随着产品和服务发展，本条款可能更新。重要变更会在本页面体现，并更新日期。"]],
      ["12. 联系我们", ["如对本条款有疑问，请联系 support@oaktech.dev。"]],
    ],
  },
} as const;

const dashboard = {
  en: {
    title: "Workspace", adminDescription: "Browse and manage products in one list. Product information and software versions are published separately.", userDescription: "Browse published products and downloads, then access your account or support.",
    back: "Back to store", nav: "Workspace sections", account: "Account", current: "Current account", permission: "Workspace access", administrator: "Store administrator", user: "Standard user",
    signedIn: "Signed-in account", loginMethod: "Sign-in method", casdoor: "OakTech unified sign-in", email: "Email account", passwordNote: "Your password is managed by the identity service and is not stored or displayed by this workspace.",
    changePassword: "Change password", statsNote: "Purchase and license statistics are not connected yet, so the workspace does not show unverified zero counts or purchase conclusions.",
    help: "Help & support", helpText: "Contact support for software usage, downloads, or account questions.", supportCenter: "Support center", contact: "Contact support",
  },
  zh: {
    title: "工作台", adminDescription: "在同一列表查看和管理商品；商品资料与软件版本分别发布。", userDescription: "浏览已公开商品与下载，并访问账号和支持。",
    back: "返回商城", nav: "工作台功能", account: "账号", current: "当前账号", permission: "工作台权限", administrator: "商城管理员", user: "普通用户",
    signedIn: "已登录账号", loginMethod: "登录方式", casdoor: "OakTech 统一登录", email: "邮箱账号", passwordNote: "当前密码由统一身份服务管理，工作台不会另建或显示你的密码。",
    changePassword: "修改密码", statsNote: "购买与许可证统计尚未接入，因此不显示未经核实的零值或购买结论。",
    help: "帮助与支持", helpText: "软件使用、下载或账号问题可联系支持。", supportCenter: "支持中心", contact: "联系支持",
  },
} as const;

const products = {
  en: { title: "All products", description: "Independent tools for browser workflows, development, research, and focused productivity. Product pages show real release status before download.", releaseNotes: "Release Notes", releaseHistory: "Published release history for" },
  zh: { title: "全部产品", description: "面向浏览器流程、开发、研究和专注工作的独立工具。下载前，产品页会显示真实发布状态。", releaseNotes: "发布说明", releaseHistory: "公开版本历史：" },
} as const;

const productUtility = {
  en: {
    install: "Installation", installTitle: (name: string) => `Install ${name}.`, installDescription: "Follow the product-specific steps below. Availability depends on the current published release.", request: "Contact support", before: "Before you start", beforeText: "Use the product only on supported platforms and follow the applicable service terms and laws.",
    privacy: "Product privacy", privacyTitle: (name: string) => `${name} privacy details.`, privacyDescription: "This page explains product-specific local data handling and permissions.", local: "Local processing",
    localText: (name: string) => `${name} processes working data locally where the product description says so. Files are created or exported only through user-initiated actions.`, noUpload: "OakTech does not claim access to data that the product does not transmit. Refer to the current product page and permission list for the exact scope.",
    questions: "Questions or deletion requests", questionsText: "For website account or payment data, read the OakTech Privacy Policy. For product-specific questions, contact support.",
    support: "Product support", supportTitle: (name: string) => `Get help with ${name}.`, supportDescription: "Contact OakTech for installation questions, download issues, beta access, or product feedback.",
    details: "Include these details", detailsText: "Include your platform or browser version, the workflow you were using, and a short description of the expected and actual result. Do not send private data unless it is necessary to explain the issue.",
    feedback: "Product feedback", feedbackText: "Tell us which workflow, format, or behavior would make the product more useful.", emailSupport: "Email product support",
  },
  zh: {
    install: "安装", installTitle: (name: string) => `安装 ${name}。`, installDescription: "请按下方产品说明完成安装；是否可下载取决于当前已发布版本。", request: "联系支持", before: "开始之前", beforeText: "请仅在产品支持的平台上使用，并遵守适用的服务条款和法律。",
    privacy: "产品隐私", privacyTitle: (name: string) => `${name} 隐私说明。`, privacyDescription: "本页面说明该产品特有的本地数据处理和权限范围。", local: "本地处理",
    localText: (name: string) => `在产品说明标注为本地处理的场景中，${name} 在本机处理工作数据；文件仅在用户主动操作时创建或导出。`, noUpload: "OakTech 不会声称访问产品未传输的数据。准确范围请以当前产品页及权限列表为准。",
    questions: "问题或删除请求", questionsText: "网站账号或支付数据请查看 OakTech 隐私政策；产品特定的数据处理问题请联系支持。",
    support: "产品支持", supportTitle: (name: string) => `获取 ${name} 帮助。`, supportDescription: "安装问题、下载问题、测试资格或产品反馈都可以联系 OakTech。",
    details: "请提供这些信息", detailsText: "请说明平台或浏览器版本、当时使用的工作流程，以及预期结果和实际结果的简要描述。除非确有必要，请不要发送隐私数据。",
    feedback: "产品反馈", feedbackText: "告诉我们哪些工作流程、格式或行为会让产品更实用。", emailSupport: "邮件联系产品支持",
  },
} as const;

export function pageCopy(locale: Locale) {
  return { auth: auth[locale], about: about[locale], support: support[locale], privacy: privacy[locale], terms: terms[locale], dashboard: dashboard[locale], products: products[locale], productUtility: productUtility[locale] };
}
