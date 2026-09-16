# ADM-01 · 真实 PostgreSQL 存储原型

这些文件是**隔离的数据库/并发验证代码，不是生产超管实现**。不被商城 `app/` 或 `lib/` 引用；不读取真实 `.env.local`、不连接生产数据库、不提供HTTP授权接口。正常登录、CSRF、限流、MFA、正式schema、数据库权限、安装迁移和部署接入仍按ADM-02～ADM-14实施。

## 已可执行

项目根目录：

```sh
npm ci
npm run test:admin-storage
```

默认使用一次性本地PostgreSQL服务器。需先准备以下两种方式之一：

**已有服务器二进制**：将 `OAKTECH_POC_PG_BIN` 指向含 `initdb` 与 `postgres` 的完整PostgreSQL bin目录；测试自行建立私有临时数据目录、随机口令和临时127.0.0.1端口，不使用已有数据库集群。需要以非root用户运行。

**macOS ARM64本轮采用的独立测试工具**：

```sh
# 只放本项目忽略的测试目录，不安装全局服务，不进入产品依赖或镜像。
npm install --prefix .local-verification/admin-poc-tools --save-exact \
  @embedded-postgres/darwin-arm64@17.10.0-beta.17 --no-audit --no-fund
npm run test:admin-storage
```

此二进制由第三方 embedded-postgres 项目分发；不是商店生产数据库依赖。npm安装会按发布完整性摘要验证，并执行其符号链接还原脚本。不能只拷贝单个postgres文件，需保留该包完整运行库。其他平台可使用其正常安装的PostgreSQL，或下面的独立测试服务。

**显式 CI/开发测试服务**：仅接受127.0.0.1且数据库名必须是 `oaktech_admin_poc`；其他主机、库名、URL参数或缺失认证信息直接拒绝。不接受 `DATABASE_URL` / `OAKTECH_AUTHZ_DATABASE_URL` 替代。

```sh
# 只指向独立测试库。具体临时密码由本地测试服务配置提供。
OAKTECH_POC_DATABASE_URL='postgresql://test-user:test-password@127.0.0.1:15432/oaktech_admin_poc' \
  npm run test:admin-storage
```

测试创建随机 `oaktech_poc_<32hex>` schema，结束时只清理本次创建的schema；包含主动中断**自己测试连接**的故障场景，因此连接角色必须拥有创建schema和终止其自身会话的权限，不应复用已有业务数据库。GitHub Actions使用独立 `postgres:17.10-alpine` service，凭据是公开的一次性测试凭据，绝不用于生产。

## 验证内容

- 20个Node进程、20条真实PostgreSQL连接并发首次认领；只允许一次提交。
- role / token消费 / 初始化标记 / 审计共同回滚，包括事务中途杀死进程。
- 身份按provider+issuer+subject精确区分；最后超管、版本冲突和幂等写入。
- 撤权后新的独立进程写入拒绝；进行中事务与撤销按锁序排队；数据库会话被终止后不能提交。
- **故意不安全的对照实验**：SQL连接断开释放锁，撤权成功，再恢复旧进程写本地JSON，SQL虽然报错，文件仍被改。该测试通过表示成功复现了反例，不表示不安全模式可以使用。
- 测试角色/授权状态保存后真实停止并重新启动本地PostgreSQL，核对数据和初始化完成标记仍在。外部CI数据库不由脚本重启。

所有落盘反例数据仅在测试自建的私有临时目录。无秘密进入前端、无生产登录模拟、无真实软件Release修改。单元测试 `tests/admin-storage-boundary.test.ts` 另行检查连接和schema边界，以及生产源码不得引用原型。

ADR结论与下一步见 `docs/adr/ADR-0001-admin-storage.md`；执行证据在 `docs/00-handoff/evidence/2026-09-16-admin-storage-poc.json`。运行日志含精确测试数和失败原因；**运行原型不等于网站已经可配置超级管理员**。
