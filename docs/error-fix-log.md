# Next.js 项目启动与错误修复记录

## 项目概述

- **项目名称**: saas_oaktech
- **框架**: Next.js 16.2.9 (Turbopack)
- **运行环境**: macOS + Node.js v24.17.0 + npm 11.13.0

---

## 启动步骤

### 1. 环境准备

```bash
# 复制环境变量文件
cp .env.example .env
```

`.env` 文件包含以下配置：
- Supabase 数据库配置
- Creem.io 支付接口配置
- 站点 URL 配置

> ⚠️ 注意：默认 `.env` 中的 API 密钥为占位符（`xxx`），如需完整功能（登录、支付等），需替换为真实密钥。

### 2. 安装依赖

首次安装时遇到 Puppeteer 浏览器下载失败：

```
npm error Error: ERROR: Failed to set up chrome v148.0.7778.97!
```

**解决方案**: 跳过 Puppeteer 浏览器下载

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

安装结果：成功添加 294 个包，耗时约 5 秒。

### 3. 启动开发服务器

```bash
npm run dev
```

服务器启动信息：
- Local: `http://localhost:3000`
- Network: `http://192.168.50.221:3000`
- 启动耗时: 155ms

---

## 错误修复过程

### 错误现象

访问页面时显示：

```
This page couldn't load
A server error occurred. Reload to try again.
```

### 错误分析

查看服务器日志，发现关键错误：

```
⨯ Error: Attempted to call createMotionComponent() from the server
but createMotionComponent is on the client. It's not possible to
invoke a client function from the server, it can only be rendered
as a Component or passed to props of a Client Component.
    at Home (app/page.tsx:39:19)
```

**错误原因**: `app/page.tsx` 中使用了 `framer-motion` 的 `motion.div` 组件，但 Next.js App Router 中的页面默认是**服务端组件 (Server Component)**。`framer-motion` 需要在浏览器环境中运行（客户端），因此不能在服务端直接调用。

### 修复步骤

#### 第一次尝试（失败）

在 `app/page.tsx` 第 2 行插入 `"use client"`：

```tsx
import Link from "next/link";
"use client";  // ❌ 位置错误
import { Button } from "@/components/ui/button";
```

**结果**: 报错 `"use client"` 指令必须放在所有表达式之前。

```
[browser] ./app/page.tsx:2:1
The "use client" directive must be placed before other expressions.
Move it to the top of the file to resolve this issue.
```

#### 第二次尝试（成功）

将 `"use client"` 移到文件**最顶部**，在所有 import 之前：

```tsx
"use client";  // ✅ 正确位置

import Link from "next/link";
import { Button } from "@/components/ui/button";
// ... 其他 imports
```

#### 重启服务器

修改后需要重启 Next.js 开发服务器以清除缓存：

```bash
# 停止旧服务器，重新启动
npm run dev
```

### 修复结果

服务器日志显示正常：

```
▲ Next.js 16.2.9 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.50.221:3000
- Environments: .env.local, .env
✓ Ready in 158ms

 GET / 200 in 314ms
```

页面成功加载，HTTP 状态码 200。

---

## 关键知识点

### Next.js App Router 组件类型

| 类型 | 默认行为 | 使用场景 |
|------|---------|---------|
| Server Component | App Router 默认 | 数据获取、访问后端资源、敏感信息 |
| Client Component | 需添加 `"use client"` | 浏览器 API、React hooks、第三方客户端库 |

### 常见需要在客户端运行的库

- `framer-motion` (动画)
- `react-hook-form` (表单)
- 图表库 (recharts, chart.js)
- 地图库 (leaflet, mapbox)
- 富文本编辑器

### `"use client"` 使用规则

1. **必须放在文件第一行**（在所有 import 之前）
2. 一个文件只需声明一次
3. 该文件及其导入的所有子组件都会变为客户端组件
4. 客户端组件可以导入服务端组件，但服务端组件不能导入客户端组件

---

## 文件变更记录

### `app/page.tsx`

**变更内容**: 在文件顶部添加 `"use client"` 指令

```diff
+ "use client";
+
  import Link from "next/link";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { motion } from "framer-motion";
  // ... 其余代码不变
```

---

## 后续建议

1. **环境变量配置**: 如需使用登录、支付功能，将 `.env` 中的 `xxx` 占位符替换为真实的 API 密钥
2. **Puppeteer 配置**: 如需使用截图/PDF 功能，需单独配置 Chrome 可执行文件路径
3. **生产部署**: 部署前运行 `npm run build` 检查构建是否通过
