export function codexMcpConfig(endpoint: string) {
  return `[mcp_servers.oaktech]\nurl = ${JSON.stringify(endpoint)}\nbearer_token_env_var = "OAKTECH_MCP_TOKEN"\ntool_timeout_sec = 900\n`;
}
export function genericMcpConfig(endpoint: string) {
  return (
    JSON.stringify(
      {
        mcpServers: {
          oaktech: {
            url: endpoint,
            headers: { Authorization: "Bearer <YOUR_TOKEN>" },
          },
        },
      },
      null,
      2,
    ) + "\n"
  );
}

export function mcpUsageGuide(endpoint: string, locale: "zh" | "en") {
  const zh = locale === "zh";
  return zh
    ? `# OakTech MCP 接入\n\n地址：${endpoint}\n传输：Streamable HTTP\n认证：Authorization: Bearer <YOUR_TOKEN>\n\n1. 在管理页面创建令牌，选择商品与权限，并保存一次显示的令牌。\n2. 在客户端添加远程 MCP 地址与凭据。令牌只放入客户端秘密设置，不发到对话里。\n3. Codex：把配置模板合并到 config.toml，将令牌注入 Codex 进程可读取的 OAKTECH_MCP_TOKEN 环境变量。下载模板不包含密钥。\n4. 在管理页面验证令牌，再到实际客户端查看发现的工具。浏览器验证成功不代表客户端已连接。\n5. 先查询商品，再修改草稿；正式发布需要单独权限。\n\n示例：查询 GitFinder 的软件版本。把工作台的中文简介改为……，只保存草稿。\n\n撤销在本页令牌列表操作。已关闭的一次性明文无法再次查看，遗失请撤销并新建。\n不支持填写 Bearer/Header 的客户端不能仅靠这个地址连接；本服务尚未提供 OAuth。ChatGPT 接入需以其连接界面实际支持的认证方式为准。\nCodex 官方文档：https://developers.openai.com/codex/mcp\n`
    : `# OakTech MCP\n\nEndpoint: ${endpoint}\nTransport: Streamable HTTP\nAuthentication: Authorization: Bearer <YOUR_TOKEN>\n\nCreate a scoped token, save the one-time secret, and add the endpoint and credential to a compatible client. Merge the Codex TOML template and supply OAKTECH_MCP_TOKEN to the Codex process environment. Downloads never include secrets.\nVerify here, then check tool discovery in your actual client. Browser verification does not prove the client is connected. Read first, then patch drafts; publication needs separate permission.\nRevoke lost tokens and create replacements. This server does not provide OAuth. Clients must support Bearer/header authentication.\nOfficial documentation: https://developers.openai.com/codex/mcp\n`;
}
