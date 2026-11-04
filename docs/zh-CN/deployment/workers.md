---
title: 部署到 Cloudflare Workers
description: 通过 Git 集成将 Sink 部署到 Cloudflare Workers。
---

# 部署到 Cloudflare Workers

## 1. Fork Sink 并创建资源

[Fork Sink 仓库](https://github.com/miantiao-me/Sink/fork)。在 [Cloudflare 仪表盘](https://dash.cloudflare.com/) 中创建：

| 绑定名称    | 产品                    | 是否必需 | 说明           |
| ----------- | ----------------------- | -------- | -------------- |
| `DB`        | D1 数据库               | 必需     | 保存链接       |
| `KV`        | KV 命名空间             | 必需     | 加速跳转       |
| `ANALYTICS` | Analytics Engine 数据集 | 推荐     | 访问统计       |
| `R2`        | R2 存储桶               | 可选     | 备份与社交图片 |
| `AI`        | Workers AI              | 可选     | AI 建议        |

在 D1、KV 各自的详情页复制 **数据库 ID** 和 **命名空间 ID**。

访问分析是可选的——不配也能用短链。启用步骤见[访问分析与近实时视图](/zh-CN/features/analytics)。

## 2. 连接 Git（Workers Builds）

在 Cloudflare 仪表盘中创建带 **Git 集成** 的 Worker，并连接你的 Fork：

- **生产分支：** `master`
- **构建命令：** `pnpm build`
- **部署命令：** `pnpm deploy:worker`

添加这些**构建变量**（**不要**把生产环境 ID 写进仓库里的 `wrangler.jsonc` — 请用 `DEPLOY_*`）：

| 变量                             | 填什么                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `DEPLOY_D1_DATABASE_ID`          | D1 数据库 ID（在 D1 详情页）                                                      |
| `DEPLOY_KV_NAMESPACE_ID`         | KV 命名空间 ID（在 KV 详情页）→ `kv_namespaces[].id`                              |
| `DEPLOY_KV_PREVIEW_NAMESPACE_ID` | 可选 Wrangler 预览 KV → `preview_id`（默认等于 `DEPLOY_KV_NAMESPACE_ID`）         |
| `DEPLOY_R2_BUCKET_NAME`          | R2 存储桶名称（仅在使用 R2 时；不填则生成配置里不含 R2）→ `bucket_name`           |
| `DEPLOY_R2_PREVIEW_BUCKET_NAME`  | 可选 Wrangler 预览 R2 → `preview_bucket_name`（默认等于 `DEPLOY_R2_BUCKET_NAME`） |
| `DEPLOY_D1_DATABASE_NAME`        | 可选；默认 `sink`                                                                 |
| `DEPLOY_ANALYTICS_DATASET`       | 可选；默认 `sink`（若改了，请与 `NUXT_DATASET` 保持一致）                         |

`pnpm deploy:worker` 会根据这些值生成被 gitignore 的 `wrangler.deploy.jsonc`，更新 D1 结构后部署。连接仓库时 Cloudflare 会生成部署令牌 — 不用再单独粘贴部署密钥。

## 3. 应用设置（登录密码等）

在 **Settings → Variables and Secrets** 中添加：

| 变量                 | 类型     | 用途                                                               |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `NUXT_SITE_TOKEN`    | 加密密钥 | 仪表盘登录密码和 API 密码（至少 8 个字符且不含空白字符，保持稳定） |
| `NUXT_CF_ACCOUNT_ID` | 变量     | 访问分析推荐                                                       |
| `NUXT_CF_API_TOKEN`  | 加密密钥 | 访问分析推荐                                                       |

访问分析细节见[访问分析与近实时视图](/zh-CN/features/analytics)。完整列表见[配置参考](/zh-CN/configuration/)。

确认绑定名称正好是 `DB`、`KV`、`ANALYTICS`、`R2`、`AI`。

## 4. 部署并首次使用

从 `master` 启动构建，等待完成。

1. 打开 `/dashboard`，用 `NUXT_SITE_TOKEN` 登录
2. 打开一次 **Dashboard → Links**（一次性存储初始化）
3. 创建链接

::: tip 必须先打开一次 Links
存储初始化完成前，创建链接可能失败，并提示「存储未就绪」（HTTP 423）。
:::

## 5. 绑定自己的域名

`wrangler.jsonc` 里始终不含账户相关的值。要让 Worker 跑在自己的域名上，在其他构建变量之外再加一个：

| 变量                   | 值                |
| ---------------------- | ----------------- |
| `DEPLOY_CUSTOM_DOMAIN` | `sink.example.com` |

`pnpm deploy:worker` 会把它写进生成的 `wrangler.deploy.jsonc`，形成带 `custom_domain: true` 的 `routes`，部署时 Wrangler 会绑定该主机名并签发证书。域名所在 zone 必须属于同一个 Cloudflare 账户，且该主机名不能已有冲突的 DNS 记录。留空则继续使用 `workers.dev` 子域名。

首次部署后修改配置：

- **运行时值**（`NUXT_REDIRECT_STATUS_CODE`、`NUXT_NOT_FOUND_REDIRECT`、`NUXT_CF_*` 等）——在 **设置 → 变量与密钥** 中修改，Cloudflare 会立即发布新版本，无需重新构建。
- **构建期值**（`NUXT_PUBLIC_*`、`DEPLOY_*`）——修改变量后重新构建；公开值会被编译进前端。

`pnpm build` 现在在 Windows、macOS、Linux 上都能运行：`scripts/build.mjs` 与 `scripts/postbuild.mjs` 取代了原先只能在 bash 里执行的内联命令。

后续升级见[升级 Sink](./upgrading)。
