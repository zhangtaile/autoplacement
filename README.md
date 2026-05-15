# Autoplacement Worker

这是一个基于 Cloudflare Workers 的自动化工具，用于根据北京时间 (CST) 定时切换另一个 Worker 的 Smart Placement 目标区域。

## 功能特性

- **定时切换**：根据设定的时间段，自动将目标 Worker 的位置模式设置为 `targeted` 并指向特定的 GCP 区域。
- **高精度**：支持分钟级别的切换，使用 UTC 分钟数计算以确保逻辑严密。
- **自动化**：通过 Cloudflare Workers 的 Cron Triggers 定时触发，无需人工干预。

## 区域映射规则

| 北京时间 (CST)    | GCP 区域 ID               | 地理位置 |
| :---------------- | :------------------------ | :------- |
| **06:30 - 14:00** | `europe-west3`            | 欧洲     |
| **其它时间**      | `us-central1`             | 美国     |

## 环境配置

在部署之前，需要配置以下环境变量 and Secret：

### 变量 (Vars)
在 `wrangler.toml` 中配置：
- `TARGET_WORKER_NAME`: 需要被控制的目标 Worker 名称（例如 `follownewfei`）。

### 机密信息 (Secrets)
使用 `wrangler secret put` 命令添加：
- `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare 账户 ID。
- `CLOUDFLARE_API_TOKEN`: 具有 Worker 修改权限的 API 令牌。

## 开发与部署

### 安装依赖
```bash
npm install
```

### 本地测试
```bash
npx wrangler dev
```
你可以通过访问本地服务地址手动触发一次位置检查逻辑。

### 部署
```bash
npx wrangler deploy
```

## 项目结构

- `src/index.ts`: 核心逻辑实现，包含时间判断和 Cloudflare API 调用。
- `wrangler.toml`: 配置文件，包含定时任务 (Cron Triggers) 和环境变量。
- `Requirments.MD`: 需求文档。

## 定时任务说明

当前配置的 Cron 触发器在北京时间切换点后的 5 分钟执行：
- `35 22 * * *` (UTC 22:35 -> CST 06:35)
- `5 6 * * *` (UTC 06:05 -> CST 14:05)

## 许可证

MIT
