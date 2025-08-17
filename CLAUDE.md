# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CC (Claude Config) 是一个专门用于管理 Claude 配置的命令行工具。它提供完整的 URL 管理、配置设置和速度测试功能，让用户能够方便地管理 Claude 的 API 端点和相关配置。

## 常用命令

### 运行和开发
- `npm start` - 启动CLI工具（等同于直接运行`node ./bin/cc.js`）
- `node ./bin/cc.js` - 直接运行主程序
- `cc` - 全局安装后的CLI命令（`preferGlobal: true`）

### CLI命令详细说明

#### 默认行为
- `cc` - 执行 Claude 命令（需要Claude已安装）

#### URL管理
- `cc url add <urls>` - 添加URL（多个URL用逗号分隔）
  - 示例：`cc url add "https://api.anthropic.com,https://claude.ai"`
- `cc url rm <url>` - 删除指定URL
  - 示例：`cc url rm "https://api.openai.com"`
- `cc url clear` - 清除所有URL
- `cc url list` - 列出所有已配置的URL

#### 配置管理
- `cc config open` - 打开Claude配置目录（settings.json所在目录）
- `cc config list` - 列出Claude当前配置（token和baseUrl）以及所有备选URL
- `cc config set <setting>` - 设置Claude配置
  - `cc config set token=xxx` - 设置ANTHROPIC_AUTH_TOKEN
  - `cc config set url=xxx` - 设置ANTHROPIC_BASE_URL

#### 测试功能
- `cc test` - 测试所有配置的URL速度并自动更新为最快的URL

## 核心架构

### 单文件架构
项目采用单一主文件架构：`bin/cc.js` 包含所有核心功能。

### 主要组件
1. **配置管理**: 使用`~/.cc/config.json`存储URL列表
2. **速度测试**: 基于ping检测多个API端点的响应时间
3. **Claude集成**: 直接操作Claude的settings.json文件
4. **CLI界面**: Commander.js构建的完整命令行界面

### 工作流程
1. 用户通过`cc url add`添加多个API端点
2. 使用`cc test`自动测试所有端点的响应速度
3. 自动选择最快的端点并更新Claude配置
4. 也可通过`cc config set`手动设置特定配置

### 配置存储

#### CC工具配置
- 配置目录：`~/.cc/`
- 配置文件：`~/.cc/config.json`
- 格式：`{"baseUrls": ["url1", "url2", "url3"]}`

#### Claude配置文件
- **路径**: `~/.claude/settings.json`
- **结构**:
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-token",
    "ANTHROPIC_BASE_URL": "selected-url"
  },
  "permissions": { "allow": [], "deny": [] }
}
```

### 依赖说明
- `commander` - CLI框架和命令解析
- `chalk` - 终端彩色输出
- `cli-table3` - 表格显示测试结果
- `ping` - 网络延迟检测

### 使用示例

#### 首次设置
```bash
# 添加多个API端点
cc url add "https://api.anthropic.com,https://claude.ai,https://custom-api.com"

# 查看已添加的URL
cc url list

# 测试速度并自动选择最快的
cc test
```

#### 日常使用
```bash
# 直接执行Claude（默认行为）
cc

# 查看当前配置和备选URL
cc config list

# 手动设置特定URL
cc config set url=https://api.anthropic.com

# 设置认证token
cc config set token=sk-xxx

# 打开配置目录查看或手动编辑
cc config open
```

#### 管理URL
```bash
# 删除特定URL
cc url rm "https://slow-api.com"

# 清除所有URL重新配置
cc url clear

# 添加新的URL
cc url add "https://new-fast-api.com"
```