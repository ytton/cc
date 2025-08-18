# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/ytton/cc/compare/v1.2.0...v1.2.1) (2025-08-18)


### Bug Fixes

* 修复多个核心bug并优化URL解析功能 ([b5e5bbc](https://github.com/ytton/cc/commit/b5e5bbcc0ac480087d89c37ef52fa973c5b6a94d))

## [1.2.0](https://github.com/ytton/cc/compare/v1.0.1...v1.2.0) (2025-08-18)


### Features

* 优化test命令 ([dd0dc5e](https://github.com/ytton/cc/commit/dd0dc5e9cdbd5bb8ccf055a03e7342e8481b2015))


### Bug Fixes

* 修复url add命令用逗号分隔添加成一个问题 ([f66c3c9](https://github.com/ytton/cc/commit/f66c3c931bd0723b4953a10d329000d417b31c82))


### Documentation

* readme文案调整 ([0c9c5c0](https://github.com/ytton/cc/commit/0c9c5c074570b86139d98f0c6b6058b2d911ff89))

## 1.1.0 (2025-08-18)


### Features

* 优化test命令 ([dd0dc5e](https://github.com/ytton/cc/commit/dd0dc5e9cdbd5bb8ccf055a03e7342e8481b2015))


### Documentation

* readme文案调整 ([0c9c5c0](https://github.com/ytton/cc/commit/0c9c5c074570b86139d98f0c6b6058b2d911ff89))

### 1.0.1 (2025-08-17)

### [1.0.2](https://github.com/ytton/cc/compare/v1.0.1...v1.0.2) (2025-08-17)

## [1.0.0] - 2024-08-17

### Features

- ✨ 初始版本发布
- 🔍 智能HTTP请求测试API端点响应速度
- ⚡ 自动选择最快的URL并更新Claude配置
- 📋 彩色表格展示测试结果
- 🔧 完整的URL管理功能（添加/删除/清除/列表）
- ⚙️ Claude配置管理（token/url设置）
- 🌐 跨平台支持（Windows/macOS/Linux）
- 💻 友好的CLI界面
- 🚫 智能错误处理和超时机制
- 📊 实时测试状态显示

### Technical Details

- 使用真实HTTP请求代替ping检测
- 10秒超时保护
- 只选择可访问的URL（2xx/3xx状态码）
- 支持多种URL输入格式
- 自动脱敏token显示
- 完整的Commander.js CLI框架