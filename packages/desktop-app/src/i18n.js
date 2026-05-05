import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ALL_LANGUAGES } from './constants';

const resources = {
  'zh-CN': {
    translation: {
      appTitle: "Live Translator Hub",
      cursorEngine: "Cursor 本地化引擎",
      claudeEngine: "Claude 本地化引擎",
      statusCardTitle: "安装环境状态",
      installStatus: "安装状态",
      patchStatus: "本地化状态",
      notFound: "未检测到安装",
      original: "未注入",
      deployBtn: "部署本地化",
      restoreBtn: "恢复官方原版",
      // Advanced Settings
      runtimeEngine: "运行时翻译引擎",
      engineNone: "无 (仅静态字典)",
      advancedSettings: "高级设置",
      advRegex: "启用正则匹配",
      advLoading: "显示加载动画",
      advBridge: "启用跨 Webview 桥接",
      advNested: "支持嵌套字典寻址",
      advResetCache: "部署时重置翻译缓存",
      advInjectWebview: "注入插件 Webview 层（深度本地化）",
      skipSelectors: "黑名单 CSS 选择器",
      terminalTitle: "部署日志终端",
      waitingExecution: "等待任务执行...",
      sudoTitle: "需要系统管理员权限",
      sudoDesc: "写入应用资源需要提权操作。<br/>请在系统弹窗中输入开机密码。",
      configPanel: "全局配置",
      targetLang: "目标注入语言 (Target Language)",
      interfaceLang: "界面显示语言 (Interface Language)",
      scanning: "正在扫描应用目录...",
      navApiKeys: "AI 密钥管理",
      navDictGen: "字典生成器",
      browseApp: "手动指定路径...",
      notDetected: "未检测到",
      appMissing: "请安装 Cursor",
      appMissingClaude: "请安装 Claude Desktop",
      appReady: "已检测到应用",
      appReadyClaude: "已检测到应用",
      sectionPatcher: "本地化部署",
      sectionDictionary: "资源生成",
      // Status cards
      claudeApp: "Claude 桌面应用",
      cursorApp: "Cursor 应用",
      patcherStatus: "注入状态",
      patched: "已注入",
      unpatched: "未注入",
      patchedDesc: "翻译引擎已激活",
      unpatchedDesc: "尚未注入翻译",
      // Deploy / Actions
      deployConfig: "部署配置",
      deployNow: "部署本地化",
      restoreOfficial: "恢复官方原版",
      pluginScanner: "Webview 插件扫描器",
      // Hub localization
      localizing: "正在本地化...",
      localizeHub: "AI 本地化 Hub",
      // API Keys
      test: "测试连接",
      testSuccess: "连接成功",
      testFailed: "连接失败",
      engineLabel: "{{name}} 引擎",
      apiKey: "API 密钥",
      model: "模型",
      modelName: "模型名称",
      baseUrl: "Base URL",
      preset: "预设",
      customModel: "自定义模型...",
      enterModelName: "输入模型名称...",
      savedMsg: "保存成功",
      saveAll: "保存所有配置",
      // Update
      updateAvailable: "新版本 v{{version}} 可用",
      updateDownloadBtn: "下载更新",
      updateDownloading: "正在下载更新...",
      updateProgress: "{{percent}}% ({{speed}})",
      updateReady: "更新已就绪，重启后生效",
      updateInstallBtn: "立即重启",
      updateCheckBtn: "检查更新",
      updateChecking: "正在检查更新...",
      updateLatest: "已是最新版本",
      updateDismiss: "忽略",
    }
  },
  'en-US': {
    translation: {
      appTitle: "Live Translator Hub",
      cursorEngine: "Cursor Engine",
      claudeEngine: "Claude Engine",
      statusCardTitle: "Installation Status",
      installStatus: "Installed",
      patchStatus: "Patch Status",
      notFound: "Not Found",
      original: "Original",
      deployBtn: "Deploy Translation",
      restoreBtn: "Restore Original",
      // Advanced Settings
      runtimeEngine: "Runtime Engine",
      engineNone: "None (Static Dict Only)",
      advancedSettings: "Advanced Settings",
      advRegex: "Enable Regex",
      advLoading: "Loading Animation",
      advBridge: "Webview Bridge",
      advNested: "Nested Dictionary",
      advResetCache: "Reset Cache on Deploy",
      advInjectWebview: "Inject Webviews (Extensions)",
      skipSelectors: "Skip CSS Selectors",
      terminalTitle: "Deployment Logs",
      waitingExecution: "Waiting for execution...",
      sudoTitle: "Authentication Required",
      sudoDesc: "Writing to application resources requires administrator privileges.<br/>Please enter your password when prompted.",
      configPanel: "Settings",
      targetLang: "Target Language",
      interfaceLang: "Interface Language",
      scanning: "Scanning...",
      navApiKeys: "AI Key Manager",
      navDictGen: "Dict Generator",
      browseApp: "Browse...",
      notDetected: "Not Detected",
      appMissing: "Please install Cursor",
      appMissingClaude: "Please install Claude Desktop",
      appReady: "Application found",
      appReadyClaude: "Application found",
      sectionPatcher: "Deployment",
      sectionDictionary: "Resources",
      // Status cards
      claudeApp: "Claude Desktop",
      cursorApp: "Cursor Application",
      patcherStatus: "Injection Status",
      patched: "Patched",
      unpatched: "Not Patched",
      patchedDesc: "Translation engine active",
      unpatchedDesc: "Not yet patched",
      // Deploy / Actions
      deployConfig: "Deploy Configuration",
      deployNow: "Deploy Translation",
      restoreOfficial: "Restore Original",
      pluginScanner: "Webview Plugin Scanner",
      // Hub localization
      localizing: "Localizing...",
      localizeHub: "AI Localize Hub",
      // API Keys
      test: "Test Connection",
      testSuccess: "Success",
      testFailed: "Failed",
      engineLabel: "{{name}} Engine",
      apiKey: "API Key",
      model: "Model",
      modelName: "Model Name",
      baseUrl: "Base URL",
      preset: "Preset",
      customModel: "Custom Model...",
      enterModelName: "Enter model name...",
      savedMsg: "Successfully Saved",
      saveAll: "Save All Configurations",
      // Update
      updateAvailable: "Update v{{version}} available",
      updateDownloadBtn: "Download Update",
      updateDownloading: "Downloading update...",
      updateProgress: "{{percent}}% ({{speed}})",
      updateReady: "Update ready, restart to install",
      updateInstallBtn: "Restart Now",
      updateCheckBtn: "Check for Updates",
      updateChecking: "Checking for updates...",
      updateLatest: "You're up to date",
      updateDismiss: "Dismiss",
    }
  }
};

const SUPPORTED_CODES = Object.keys(ALL_LANGUAGES);

SUPPORTED_CODES.forEach(code => {
  if (!resources[code]) {
    resources[code] = { translation: { ...resources['en-US'].translation } };
  }
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-CN',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false }
  });

export default i18n;
