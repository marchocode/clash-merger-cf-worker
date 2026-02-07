# Clash Merger - Cloudflare Worker 版本

这是 Clash 订阅合并工具的 Cloudflare Worker 版本，使用 KV 数据库存储配置。

## 运行截图
![1.png](./img/1.png)
![2.png](./img/2.png)
![3.png](./img/3.png)

## 功能特点

- ✅ 运行在 Cloudflare Workers 上，无需服务器
- ✅ 使用 KV 数据库存储 Token 和订阅配置
- ✅ 支持多个订阅源合并
- ✅ **支持自定义代理服务器**（Hysteria2、VMess、Trojan 等）
- ✅ **Web 管理界面**，可视化管理订阅和自定义代理
- ✅ 自动创建代理组（AUTO 自动选择、PROXY 手动选择、Custom 自定义代理组）
- ✅ 基于 Loyalsoldier/clash-rules 的智能分流规则

## 项目结构

```
clash-merger-cf-worker/
├── src/
│   ├── index.js           # Worker 主入口
│   ├── config-loader.js   # KV 配置加载器
│   ├── proxy-provider.js  # 订阅获取模块
│   ├── clash-merger.js    # 配置合并逻辑
│   └── base-config.js     # 基础 Clash 配置
├── package.json
├── wrangler.toml          # Wrangler 配置文件
└── README.md
```

## 部署步骤

### 1. 安装依赖

```bash
cd clash-merger-cf-worker
npm install
```

### 2. 创建 KV 命名空间

```bash
# 创建生产环境 KV 命名空间
wrangler kv:namespace create "CLASH_KV"

# 创建预览环境 KV 命名空间（用于开发测试）
wrangler kv:namespace create "CLASH_KV" --preview
```

执行后会得到两个 KV 命名空间 ID，类似：

```
✨ Success!
Add the following to your wrangler.toml:
{ binding = "CLASH_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

### 3. 更新 wrangler.toml

将上一步获得的 KV 命名空间 ID 填入 `wrangler.toml` 文件：

```toml
[[kv_namespaces]]
binding = "CLASH_KV"
id = "你的生产环境KV命名空间ID"
preview_id = "你的预览环境KV命名空间ID"
```

### 4. 配置 KV 数据

#### 4.1 设置 TOKEN

```bash
# 生成一个随机 token（或使用你自己的）
wrangler kv:key put --binding=CLASH_KV "TOKEN" "your-secret-token-here"
```

#### 4.2 设置订阅列表 (SUBS)

创建一个 JSON 文件 `subs.json`，内容如下：

```json
[
  {
    "name": "订阅1",
    "url": "https://example.com/sub1"
  },
  {
    "name": "订阅2",
    "url": "https://example.com/sub2"
  }
]
```

然后将其上传到 KV：

```bash
wrangler kv:key put --binding=CLASH_KV "SUBS" --path=subs.json
```

### 5. 本地开发测试

```bash
npm run dev
```

访问 `http://localhost:8787/subs/your-secret-token-here` 测试。

### 6. 部署到 Cloudflare

```bash
npm run deploy
```

部署成功后，你会得到一个 Worker URL，类似：
```
https://clash-merger-cf-worker.your-subdomain.workers.dev
```

## 使用方法

### Web 管理界面

访问 Worker URL 的根路径即可进入管理界面：

```
https://your-worker-url.workers.dev/
```

**功能**：
- 📝 **订阅管理**：添加、编辑、删除订阅源
- 🔧 **自定义代理**：添加自己的代理服务器（Hysteria2、VMess、Trojan 等）
- 🔐 **Token 登录**：使用 KV 中设置的 TOKEN 登录

**使用步骤**：
1. 访问管理页面
2. 输入你在 KV 中设置的 TOKEN
3. 登录后可以管理订阅列表和自定义代理

#### 添加自定义代理

在管理界面的"自定义代理"区域：

1. 点击"➕ 添加代理"
2. 输入代理名称（例如：My Hysteria2）
3. 输入 JSON 格式的代理配置：

```json
{
  "name": "My Hysteria2",
  "type": "hysteria2",
  "server": "example.com",
  "port": 443,
  "password": "your-password",
  "sni": "example.com"
}
```

4. 点击保存

**支持的代理类型**：所有 Clash 支持的协议（ss、ssr、vmess、vless、trojan、hysteria、hysteria2 等）

### 订阅地址格式

```
https://your-worker-url.workers.dev/subs/<your-token>
```

例如：
```
https://clash-merger-cf-worker.your-subdomain.workers.dev/subs/your-secret-token-here
```

将此地址添加到你的 Clash 客户端即可。

## KV 数据结构说明

### TOKEN (字符串)

存储访问令牌，用于验证请求。

**键名**: `TOKEN`
**值类型**: 字符串
**示例**: `"my-secret-token-123"`

### SUBS (JSON 数组)

存储订阅源列表。

**键名**: `SUBS`
**值类型**: JSON 字符串（数组格式）
**结构**:
```json
[
  {
    "name": "订阅源名称",
    "url": "订阅源URL"
  }
]
```

**完整示例**:
```json
[
  {
    "name": "机场A",
    "url": "https://example1.com/api/v1/client/subscribe?token=xxx"
  },
  {
    "name": "机场B",
    "url": "https://example2.com/sub?token=yyy"
  },
  {
    "name": "自建节点",
    "url": "https://example3.com/clash/config"
  }
]
```

### CUSTOM_PROXIES (JSON 数组)

存储自定义代理服务器配置。

**键名**: `CUSTOM_PROXIES`
**值类型**: JSON 字符串（数组格式）
**结构**:
```json
[
  {
    "name": "代理名称",
    "type": "协议类型",
    "server": "服务器地址",
    "port": 端口号,
    ... 其他协议特定参数
  }
]
```

**完整示例**:
```json
[
  {
    "name": "My Hysteria2",
    "type": "hysteria2",
    "server": "example.com",
    "port": 443,
    "password": "your-password",
    "sni": "example.com"
  },
  {
    "name": "My VMess",
    "type": "vmess",
    "server": "example.com",
    "port": 443,
    "uuid": "your-uuid",
    "alterId": 0,
    "cipher": "auto"
  }
]
```

**注意**：
- 配置格式与 Clash 配置文件中的 `proxies` 项完全相同
- 建议通过 Web 管理界面添加，会自动验证 JSON 格式
- 也可以通过命令行手动设置（见下文）

## 管理 KV 数据

### 查看现有数据

```bash
# 查看 TOKEN
wrangler kv:key get --binding=CLASH_KV "TOKEN"

# 查看 SUBS
wrangler kv:key get --binding=CLASH_KV "SUBS"
```

### 更新订阅列表

```bash
# 方法1: 使用文件
wrangler kv:key put --binding=CLASH_KV "SUBS" --path=subs.json

# 方法2: 直接输入
wrangler kv:key put --binding=CLASH_KV "SUBS" '[{"name":"新订阅","url":"https://example.com/sub"}]'
```

### 更新 TOKEN

```bash
wrangler kv:key put --binding=CLASH_KV "TOKEN" "new-token-here"
```

### 管理自定义代理

```bash
# 查看自定义代理
wrangler kv:key get --binding=CLASH_KV "CUSTOM_PROXIES"

# 使用文件设置自定义代理
wrangler kv:key put --binding=CLASH_KV "CUSTOM_PROXIES" --path=custom-proxies.json

# 直接输入（单个代理）
wrangler kv:key put --binding=CLASH_KV "CUSTOM_PROXIES" '[{"name":"My Proxy","type":"hysteria2","server":"example.com","port":443,"password":"pass"}]'

# 清空自定义代理
wrangler kv:key put --binding=CLASH_KV "CUSTOM_PROXIES" '[]'
```

**推荐方式**：使用 Web 管理界面添加和管理自定义代理，更加直观和安全。

## 生成的配置说明

Worker 会自动生成以下代理组：

1. **PROXY** - 主代理组（手动选择），包含所有其他组
2. **订阅源名称** - 每个订阅源会生成一个独立的选择组
3. **Custom** - 自定义代理组（如果有自定义代理），包含所有自定义代理
4. **AUTO** - 自动选择组（URL 测试），包含所有代理节点

**代理组层级结构**：
```
PROXY (主选择器)
├── 订阅1 (包含订阅1的所有节点)
├── 订阅2 (包含订阅2的所有节点)
├── Custom (包含所有自定义代理) ← 新增
└── AUTO (包含所有节点，自动选择最快)
```

**使用场景**：
- 想用特定订阅源的节点 → 选择对应的订阅组
- 想用自己的代理服务器 → 选择 Custom 组
- 让系统自动选择最快节点 → 选择 AUTO 组

## 注意事项

1. **Token 安全**: 请使用强随机字符串作为 TOKEN，不要使用简单密码
2. **订阅 URL**: 确保订阅 URL 返回的是标准的 Clash YAML 格式
3. **KV 限制**: Cloudflare KV 免费版有读写次数限制，请注意使用频率
4. **Worker 限制**: 免费版 Worker 每天有 100,000 次请求限制

## 与原 Python 版本的区别

- ✅ 无需服务器，运行在 Cloudflare 边缘网络
- ✅ 配置存储在 KV 数据库，而非本地文件
- ✅ 自动全球 CDN 加速
- ✅ 免费额度足够个人使用

## 故障排查

### 部署失败
- 检查 `wrangler.toml` 中的 KV 命名空间 ID 是否正确
- 确保已登录 Cloudflare 账号：`wrangler login`

### 访问返回 500 错误
- 检查 KV 中是否正确设置了 TOKEN 和 SUBS
- 查看 Worker 日志：`wrangler tail`

### 订阅无法更新
- 确认订阅源 URL 可访问
- 检查订阅源返回的格式是否为标准 Clash YAML

## 许可证

MIT License

