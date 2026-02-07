# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Cloudflare Worker 应用，用于合并多个 Clash 代理订阅源。它从 KV 数据库读取配置，获取多个订阅源的代理列表，合并后生成统一的 Clash 配置文件。

**核心功能**：
- 合并多个订阅源的代理节点
- 支持添加自定义代理服务器（Hysteria2、VMess、Trojan 等）
- 提供 Web 管理界面，可视化管理订阅和自定义代理
- 自动生成代理组（PROXY、订阅源组、Custom、AUTO）

## 常用命令

### 开发和部署
```bash
# 本地开发（启动开发服务器）
npm run dev

# 部署到 Cloudflare
npm run deploy

# 查看 Worker 实时日志
wrangler tail
```

### KV 数据库管理
```bash
# 创建 KV 命名空间
wrangler kv:namespace create "CLASH_KV"
wrangler kv:namespace create "CLASH_KV" --preview

# 设置 TOKEN
wrangler kv:key put --binding=CLASH_KV "TOKEN" "your-token-here"

# 设置订阅列表（从文件）
wrangler kv:key put --binding=CLASH_KV "SUBS" --path=subs.json

# 设置自定义代理（从文件）
wrangler kv:key put --binding=CLASH_KV "CUSTOM_PROXIES" --path=custom-proxies.json

# 查看 KV 数据
wrangler kv:key get --binding=CLASH_KV "TOKEN"
wrangler kv:key get --binding=CLASH_KV "SUBS"
wrangler kv:key get --binding=CLASH_KV "CUSTOM_PROXIES"
```

## 核心架构

### 路由结构

Worker 提供以下路由：

1. **订阅合并** - `/subs/<token>` - 返回合并后的 Clash 配置（YAML）
2. **Web 管理界面**：
   - `/` 或 `/login` - 登录页面
   - `/admin` - 管理页面（订阅和自定义代理管理）
3. **管理 API**：
   - `POST /api/login` - 登录验证
   - `GET /api/subs` - 获取订阅列表
   - `PUT /api/subs` - 更新订阅列表
   - `GET /api/custom-proxies` - 获取自定义代理列表
   - `PUT /api/custom-proxies` - 更新自定义代理列表
4. **健康检查** - `/health` - 返回服务状态

### 数据流程（订阅合并）

1. **请求入口** (`src/index.js`)
   - Worker 接收 `/subs/<token>` 请求
   - 从 URL 路径提取 token
   - 调用 `handleSubscription()` 处理请求

2. **Token 验证** (`tokenCheck()`)
   - 从 KV 读取存储的 TOKEN
   - 验证请求 token 是否匹配

3. **配置加载** (`src/config-loader.js`)
   - 从 KV 读取 SUBS 键（JSON 数组）
   - 解析订阅源列表（name + url）

4. **订阅获取** (`src/proxy-provider.js`)
   - 为每个订阅源创建 ProxyProvider 实例
   - 并发获取所有订阅源的 YAML 配置
   - 解析每个订阅的 proxies 列表

5. **配置合并** (`src/clash-merger.js`)
   - 加载基础配置 (`BASE_CONFIG`)
   - 合并所有订阅源的代理节点
   - 从 KV 读取 CUSTOM_PROXIES（自定义代理）
   - 如果有自定义代理，添加到代理列表并创建 Custom 组
   - 生成代理组结构（见下文）

6. **YAML 输出**
   - 使用 js-yaml 将合并后的配置转换为 YAML
   - 返回给客户端

### 代理组生成逻辑

ClashMerger 按以下顺序生成代理组：

1. **订阅源组** - 为每个订阅源创建一个 `select` 类型组，包含该源的所有节点
2. **Custom 组** - 如果有自定义代理，创建 `select` 类型组，包含所有自定义代理
3. **AUTO 组** - `url-test` 类型，包含所有节点（订阅+自定义），自动选择延迟最低的
4. **PROXY 组** - `select` 类型，包含所有其他组，作为主选择器（插入到最前面）

最终生成的 `proxy-groups` 顺序：`[PROXY, 订阅1, 订阅2, ..., Custom, AUTO]`

**代码位置**：
- `processGroup()` - 创建订阅源组 (src/clash-merger.js:101)
- `processCustomGroup()` - 创建 Custom 组 (src/clash-merger.js:118)
- `processAutoGroup()` - 创建 AUTO 组 (src/clash-merger.js:52)
- `processProxyGroup()` - 创建 PROXY 组 (src/clash-merger.js:71)

## KV 数据结构

### TOKEN (字符串)
- **键名**: `TOKEN`
- **用途**: 访问令牌验证
- **示例**: `"my-secret-token-123"`

### SUBS (JSON 数组)
- **键名**: `SUBS`
- **格式**: JSON 字符串数组
- **结构**: `[{"name": "订阅名", "url": "订阅URL"}, ...]`
- **示例文件**: `subs.example.json`

### CUSTOM_PROXIES (JSON 数组)
- **键名**: `CUSTOM_PROXIES`
- **格式**: JSON 字符串数组
- **结构**: `[{代理配置对象}, ...]`
- **用途**: 存储用户自定义的代理服务器配置
- **配置格式**: 与 Clash 配置文件中的 `proxies` 项完全相同
- **示例**:
  ```json
  [
    {
      "name": "My Hysteria2",
      "type": "hysteria2",
      "server": "example.com",
      "port": 443,
      "password": "your-password",
      "sni": "example.com"
    }
  ]
  ```
- **管理方式**: 推荐通过 Web 管理界面添加，也可通过命令行设置

## 重要配置文件

### wrangler.toml
- 必须配置 KV 命名空间的 `id` 和 `preview_id`
- 使用 `wrangler kv:namespace create` 命令获取 ID
- `binding = "CLASH_KV"` 对应代码中的 `env.CLASH_KV`

### src/base-config.js
- 包含 Clash 的基础配置（DNS、规则、rule-providers 等）
- 基于 Loyalsoldier/clash-rules 的分流规则
- 修改此文件会影响所有生成的配置

## 关键实现细节

### 异步并发获取订阅
`ClashMerger.merge()` 中使用 `for...of` 循环顺序调用 `provider.fetchProxies()`。如需优化性能，可改为 `Promise.all()` 并发获取。

### 深拷贝基础配置
`ClashMerger.merge()` 使用 `JSON.parse(JSON.stringify())` 深拷贝 `BASE_CONFIG`，避免修改原始配置对象。

### YAML 输出配置
`yaml.dump()` 使用 `lineWidth: -1` 禁用自动换行，`sortKeys: false` 保持键的原始顺序。

## 调试和故障排查

### 查看实时日志
```bash
wrangler tail
```

### 常见问题

**500 错误**
- 检查 KV 中是否设置了 TOKEN 和 SUBS
- 验证 SUBS 的 JSON 格式是否正确
- 查看 `wrangler tail` 日志获取详细错误信息

**订阅获取失败**
- 确认订阅源 URL 可访问
- 检查订阅源返回的是否为标准 Clash YAML 格式
- ProxyProvider 会捕获错误并跳过失败的订阅源

