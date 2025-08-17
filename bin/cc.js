#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";
import Table from "cli-table3";
import { spawn } from "child_process";

const CONFIG_DIR = path.join(os.homedir(), ".cc");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// Claude settings 文件路径
function getClaudeSettingsPath() {
  const homeDir = os.homedir();
  return path.join(homeDir, ".claude", "settings.json");
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = { baseUrls: [] };
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  try {
    const content = fs.readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(chalk.red("配置文件读取失败:"), error.message);
    return { baseUrls: [] };
  }
}

function saveConfig(config) {
  ensureConfigDir();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.log(chalk.red("❌ 配置文件保存失败:"), error.message);
  }
}

function loadClaudeSettings() {
  const settingsPath = getClaudeSettingsPath();

  try {
    if (!fs.existsSync(settingsPath)) {
      return {};
    }
    const content = fs.readFileSync(settingsPath, "utf8");
    return JSON.parse(content);
  } catch {
    console.log(chalk.yellow("⚠️  读取Claude设置失败"));
    return {};
  }
}

function saveClaudeSettings(settings) {
  const settingsPath = getClaudeSettingsPath();

  try {
    // 确保目录存在
    const settingsDir = path.dirname(settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ 保存Claude settings失败: ${error.message}`));
    return false;
  }
}

function extractHostname(url) {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

// HTTP测试代替ping
async function testUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = 10000; // 10秒超时
    
    try {
      // 确保URL格式正确
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      
      // 动态导入模块
      const requestModule = isHttps ? 
        import('https').then(m => m.default) : 
        import('http').then(m => m.default);
      
      requestModule.then(module => {
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: '/',
          method: 'HEAD',
          timeout: timeout,
          headers: {
            'User-Agent': 'CC-Claude-Config/1.0'
          }
        };
        
        const req = module.request(options, (res) => {
          const responseTime = Date.now() - startTime;
          // 认为2xx和3xx状态码都是可用的
          if (res.statusCode && res.statusCode < 400) {
            resolve(responseTime);
          } else {
            resolve(Infinity);
          }
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve(Infinity);
        });
        
        req.on('error', () => {
          resolve(Infinity);
        });
        
        req.end();
        
        // 额外的超时保护
        setTimeout(() => {
          if (!req.destroyed) {
            req.destroy();
            resolve(Infinity);
          }
        }, timeout);
      }).catch(() => {
        resolve(Infinity);
      });
      
    } catch (error) {
      resolve(Infinity);
    }
  });
}

async function testUrls(urls) {
  const results = [];

  console.log(chalk.blue("🔍 正在测试URL响应速度..."));

  for (const url of urls) {
    console.log(chalk.gray(`  测试: ${url}`));
    const responseTime = await testUrl(url);
    results.push({ url, pingTime: responseTime });
  }

  return results.sort((a, b) => a.pingTime - b.pingTime);
}

async function performSpeedTest() {
  const config = loadConfig();

  if (!config.baseUrls || config.baseUrls.length === 0) {
    console.log(chalk.yellow("⚠️  配置文件中没有URL"));
    console.log(chalk.gray("使用 'cc url add url1,url2' 添加URL"));
    return null;
  }

  const results = await testUrls(config.baseUrls);
  
  // 过滤出可用的URL（响应时间不是Infinity）
  const availableResults = results.filter(result => result.pingTime !== Infinity);
  const fastest = availableResults.length > 0 ? availableResults[0] : null;

  // 显示测试结果
  const resultTable = new Table({
    head: [chalk.cyan("URL"), chalk.cyan("响应时间"), chalk.cyan("状态")],
    colWidths: [50, 15, 10],
  });

  results.forEach((result) => {
    const isAvailable = result.pingTime !== Infinity;
    const isFastest = fastest && result.url === fastest.url;
    
    let status = "";
    if (!isAvailable) {
      status = chalk.red("❌ 不可用");
    } else if (isFastest) {
      status = chalk.green("✅ 最快");
    }
    
    const timeDisplay = isAvailable
      ? chalk.green(`${result.pingTime}ms`)
      : chalk.red("超时");

    const urlDisplay = isFastest 
      ? chalk.bold.green(result.url) 
      : isAvailable 
        ? result.url 
        : chalk.red(result.url);

    resultTable.push([urlDisplay, timeDisplay, status]);
  });

  console.log(resultTable.toString());

  if (!fastest) {
    console.log(chalk.red("❌ 所有URL都无法访问"));
    console.log(chalk.yellow("💡 请检查网络连接或URL配置"));
    return null;
  }

  console.log(
    chalk.green(
      `\n🚀 最快的URL: ${fastest.url} (${fastest.pingTime}ms)`
    )
  );
  return fastest.url;
}

function updateClaudeUrl(baseUrl) {
  let settings = loadClaudeSettings();

  // 确保env对象存在
  if (!settings.env) {
    settings.env = {};
  }

  // 更新ANTHROPIC_BASE_URL
  settings.env.ANTHROPIC_BASE_URL = baseUrl;

  // 如果根级别也有ANTHROPIC_BASE_URL，也更新它
  if (settings.ANTHROPIC_BASE_URL !== undefined) {
    settings.ANTHROPIC_BASE_URL = baseUrl;
  }

  if (saveClaudeSettings(settings)) {
    console.log(chalk.green(`✅ Claude URL 已更新: ${baseUrl}`));
  }
}

function openClaudeSettings() {
  const settingsPath = getClaudeSettingsPath();
  const settingsDir = path.dirname(settingsPath);

  // 确保目录和文件存在
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
      env: {},
      permissions: { allow: [], deny: [] },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
  }

  const platform = os.platform();
  let command, args;

  switch (platform) {
    case "win32":
      command = "explorer";
      args = [settingsDir];
      break;
    case "darwin":
      command = "open";
      args = [settingsDir];
      break;
    default: // linux
      command = "xdg-open";
      args = [settingsDir];
      break;
  }

  try {
    spawn(command, args, { detached: true, stdio: "ignore" });
    console.log(chalk.green(`📁 已打开Claude配置目录: ${settingsDir}`));
    console.log(chalk.gray(`配置文件: ${settingsPath}`));
  } catch (error) {
    console.log(chalk.red(`❌ 无法打开目录: ${error.message}`));
    console.log(chalk.gray(`配置目录: ${settingsDir}`));
  }
}

// URL管理功能
function addUrls(urlsString, ...additionalUrls) {
  const config = loadConfig();

  // 首先处理第一个参数（可能包含逗号分隔的URL）
  let urls = urlsString
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url);

  // 然后添加额外的参数（每个都是单独的URL）
  if (additionalUrls && additionalUrls.length > 0) {
    urls = urls.concat(
      additionalUrls.map((url) => url.trim()).filter((url) => url)
    );
  }

  // 去重并添加到配置
  let addedCount = 0;
  urls.forEach((url) => {
    if (!config.baseUrls.includes(url)) {
      config.baseUrls.push(url);
      addedCount++;
    }
  });

  saveConfig(config);
  console.log(chalk.green(`✅ 已添加 ${addedCount} 个URL`));
  urls.forEach((url) => {
    if (!config.baseUrls.includes(url) || addedCount > 0) {
      console.log(chalk.gray(`  + ${url}`));
    }
  });
}

function removeUrl(url) {
  const config = loadConfig();
  const index = config.baseUrls.indexOf(url);

  if (index > -1) {
    config.baseUrls.splice(index, 1);
    saveConfig(config);
    console.log(chalk.green(`✅ 已删除URL: ${url}`));
  } else {
    console.log(chalk.yellow(`⚠️  URL不存在: ${url}`));
  }
}

function clearUrls() {
  const config = loadConfig();
  config.baseUrls = [];
  saveConfig(config);
  console.log(chalk.green("✅ 已清除所有URL"));
}

function listUrls() {
  const config = loadConfig();

  if (config.baseUrls.length === 0) {
    console.log(chalk.yellow("⚠️  没有配置URL"));
    return;
  }

  console.log(chalk.cyan.bold("📋 当前配置的URL:"));
  config.baseUrls.forEach((url, index) => {
    console.log(chalk.gray(`  ${index + 1}. ${url}`));
  });
}

// 列出Claude当前配置和备选URL
function listClaudeConfig() {
  console.log(chalk.cyan.bold("📋 Claude 当前配置:"));
  console.log(chalk.gray("─".repeat(50)));

  // 读取Claude设置
  const settings = loadClaudeSettings();

  // 显示当前配置
  if (settings.env) {
    const token = settings.env.ANTHROPIC_AUTH_TOKEN;
    const baseUrl = settings.env.ANTHROPIC_BASE_URL;

    console.log(chalk.green("🔑 认证Token:"));
    if (token) {
      // 隐藏token的大部分内容，只显示前后几位
      const maskedToken =
        token.length > 10
          ? `${token.substring(0, 8)}${"*".repeat(
              token.length - 16
            )}${token.substring(token.length - 8)}`
          : token;
      console.log(chalk.gray(`   ${maskedToken}`));
    } else {
      console.log(chalk.yellow("   未设置"));
    }

    console.log();
    console.log(chalk.green("🌐 Base URL:"));
    if (baseUrl) {
      console.log(chalk.gray(`   ${baseUrl}`));
    } else {
      console.log(chalk.yellow("   未设置"));
    }
  } else {
    console.log(chalk.yellow("⚠️  未找到配置信息"));
  }

  console.log();
  console.log(chalk.cyan.bold("📋 备选 URL 列表:"));
  console.log(chalk.gray("─".repeat(50)));

  // 读取备选URL配置
  const config = loadConfig();

  if (config.baseUrls && config.baseUrls.length > 0) {
    config.baseUrls.forEach((url, index) => {
      const isActive = settings.env && settings.env.ANTHROPIC_BASE_URL === url;
      const marker = isActive ? chalk.green("✅ ") : chalk.gray("   ");
      const urlDisplay = isActive ? chalk.bold.green(url) : chalk.gray(url);
      console.log(
        `${marker}${index + 1}. ${urlDisplay}${
          isActive ? chalk.green(" (当前使用)") : ""
        }`
      );
    });
  } else {
    console.log(chalk.yellow("⚠️  没有配置备选URL"));
    console.log(chalk.gray("使用 'cc url add url1,url2' 添加备选URL"));
  }
}
function executeClaude() {
  try {
    const claudeProcess = spawn("claude", [], {
      stdio: "inherit",
      shell: true,
    });

    claudeProcess.on("error", (error) => {
      console.log(chalk.red(`❌ 无法启动Claude: ${error.message}`));
      console.log(chalk.gray("请确保Claude已安装并在PATH中"));
    });
  } catch (error) {
    console.log(chalk.red(`❌ 启动Claude失败: ${error.message}`));
  }
}

// CLI 命令定义
program.name("cc").description("Claude 配置管理工具").version("1.0.0");

// URL管理命令
const urlCommand = program.command("url").description("URL管理");

urlCommand
  .command("add <urls...>")
  .description("添加URL (多个URL可用逗号分隔或空格分隔)")
  .action((urls) => {
    if (urls.length === 1) {
      // 如果只有一个参数，可能包含逗号分隔的URL
      addUrls(urls[0]);
    } else {
      // 如果有多个参数，每个都是单独的URL
      addUrls(urls.join(","));
    }
  });

urlCommand
  .command("rm <url>")
  .description("删除指定URL")
  .action((url) => {
    removeUrl(url);
  });

urlCommand
  .command("clear")
  .description("清除所有URL")
  .action(() => {
    clearUrls();
  });

urlCommand
  .command("list")
  .description("列出所有URL")
  .action(() => {
    listUrls();
  });

// Config管理命令
const configCommand = program.command("config").description("配置管理");

configCommand
  .command("open")
  .description("打开Claude配置目录")
  .action(() => {
    openClaudeSettings();
  });

configCommand
  .command("list")
  .description("列出Claude当前配置和备选URL")
  .action(() => {
    listClaudeConfig();
  });

configCommand
  .command("set <setting>")
  .description("设置Claude配置 (token=xxx 或 url=xxx)")
  .action((setting) => {
    const [key, value] = setting.split("=");

    if (!key || !value) {
      console.log(chalk.red("❌ 格式错误，请使用: token=xxx 或 url=xxx"));
      return;
    }

    let settings = loadClaudeSettings();
    if (!settings.env) {
      settings.env = {};
    }

    switch (key.toLowerCase()) {
      case "token":
        settings.env.ANTHROPIC_AUTH_TOKEN = value;
        if (saveClaudeSettings(settings)) {
          console.log(chalk.green("✅ Claude token 已更新"));
        }
        break;
      case "url":
        settings.env.ANTHROPIC_BASE_URL = value;
        if (settings.ANTHROPIC_BASE_URL !== undefined) {
          settings.ANTHROPIC_BASE_URL = value;
        }
        if (saveClaudeSettings(settings)) {
          console.log(chalk.green(`✅ Claude URL 已更新: ${value}`));
        }
        break;
      default:
        console.log(chalk.red(`❌ 不支持的配置项: ${key}`));
        console.log(chalk.gray("支持的配置项: token, url"));
    }
  });

// Test命令
program
  .command("test")
  .description("测试URL速度并更新配置")
  .action(async () => {
    const fastestUrl = await performSpeedTest();
    if (fastestUrl) {
      console.log(chalk.blue("\\n🔧 正在更新Claude设置..."));
      updateClaudeUrl(fastestUrl);
    }
  });

// 默认行为：执行claude
program.action(() => {
  executeClaude();
});

// 解析命令行参数
program.parse();
