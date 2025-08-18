# CC - Claude Config

一个专门用于管理 Claude 配置的命令行工具。自动测试多个 API 端点的响应速度，选择最快的 URL，并自动更新 Claude 的配置文件。

## 🚀 特性

- 🔍 **智能测试** - 真实的HTTP请求测试，准确反映服务器可用性
- ⚡ **并行测试** - 所有URL同时测试，无需等待串行完成
- 📊 **实时更新** - 测试过程中表格实时显示状态变化
- 🚀 **自动选择** - 自动选择响应最快的API端点
- 🔧 **配置管理** - 直接操作Claude settings.json文件
- 📋 **可视化** - 彩色表格展示测试结果和进度
- 🌐 **跨平台** - 支持 Windows、macOS、Linux

## 📦 安装

```bash
npm install -g @yton/cc
```

## 🎯 快速开始

```bash
# 添加多个API端点
cc url add https://api.anthropic.com https://claude.ai

# 测试速度并自动更新配置
cc test

# 查看当前配置
cc config list

# 直接执行Claude
cc
```

## 📖 命令详解

### 默认行为
```bash
cc                          # 执行 Claude 命令
```

### URL 管理
```bash
cc url add <urls...>        # 添加URL（支持空格或逗号分隔）
cc url rm <url>             # 删除指定URL
cc url clear                # 清除所有URL
cc url list                 # 列出所有URL
```

**示例：**
```bash
# 方式一：空格分隔
cc url add https://api.anthropic.com https://claude.ai

# 方式二：逗号分隔
cc url add https://api.anthropic.com,https://claude.ai
```

### 配置管理
```bash
cc config open             # 打开Claude配置目录
cc config list             # 显示当前配置和备选URL
cc config set token=xxx    # 设置认证Token
cc config set url=xxx      # 设置Base URL
```

### 测试功能
```bash
cc test                     # 测试所有URL并更新为最快的
```

## 📋 配置文件

### CC工具配置
位置：`~/.cc/config.json`
```json
{
  "baseUrls": [
    "https://api.anthropic.com",
    "https://claude.ai",
    "https://custom-api.com"
  ]
}
```

### Claude配置
位置：`~/.claude/settings.json`
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-token",
    "ANTHROPIC_BASE_URL": "selected-url"
  },
  "permissions": { "allow": [], "deny": [] }
}
```

## 🎨 使用示例

### 首次设置
```bash
# 安装
npm install -g @yton/cc

# 添加多个API端点
cc url add https://api.anthropic.com https://claude.ai

# 查看配置
cc config list

# 测试并选择最快的
cc test
```

### 日常使用
```bash
# 查看当前状态
cc config list

# 手动设置特定URL
cc config set url=https://api.anthropic.com

# 测试速度并自动更新
cc test

# 直接使用Claude
cc
```

## 🔧 技术说明

- **并行测试** - 使用 Promise.all() 同时测试所有URL，大幅提升测试速度
- **实时反馈** - 测试过程中表格实时更新，显示每个URL的测试状态
- **HTTP测试** - 使用真实的HTTP HEAD请求测试服务器响应
- **超时处理** - 10秒超时，避免长时间等待
- **状态码检查** - 只有2xx和3xx状态码才算可用
- **智能选择** - 只从可访问的URL中选择最快的

## 📊 测试结果示例

### 实时测试过程
```
🔍 正在测试URL响应速度...

┌──────────────────────────────────────────────────┬───────────────┬──────────┐
│ URL                                              │ 响应时间      │ 状态     │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://api.anthropic.com                        │ -             │ 等待测试 │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://claude.ai                                │ -             │ 测试中   │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://api.openai.com                           │ 156ms         │ ✅ 可用  │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://custom-proxy.example.com                 │ -             │ 测试中   │
└──────────────────────────────────────────────────┴───────────────┴──────────┘
```

### 最终测试结果
```
🔍 URL响应速度测试完成

┌──────────────────────────────────────────────────┬───────────────┬──────────┐
│ URL                                              │ 响应时间      │ 状态     │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://claude.ai                                │ 156ms         │ 🚀 最快  │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://api.openai.com                           │ 234ms         │ ✅ 可用  │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://custom-proxy.example.com                 │ 468ms         │ ✅ 可用  │
├──────────────────────────────────────────────────┼───────────────┼──────────┤
│ https://api.anthropic.com                        │ 超时          │ ❌ 不可用 │
└──────────────────────────────────────────────────┴───────────────┴──────────┘

🚀 最快的URL: https://claude.ai (156ms)

🔧 正在更新Claude设置...
✅ Claude URL 已更新: https://claude.ai
```

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Claude](https://claude.ai/) - Anthropic的AI助手
- [Anthropic](https://www.anthropic.com/) - 官方网站