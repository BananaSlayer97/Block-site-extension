// i18n.js - 国际化管理器

class I18nManager {
  constructor() {
    this.currentLocale = null;
    this.messages = {};
    this.config = null;
    this.fallbackLocale = 'en';
    this.isInitialized = false;
  }

  // 初始化国际化系统
  async initialize() {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 检测用户语言
      this.currentLocale = await this.detectUserLocale();
      
      // 加载消息
      await this.loadMessages(this.currentLocale);
      
      this.isInitialized = true;
      console.log(`I18n initialized with locale: ${this.currentLocale}`);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      this.currentLocale = this.fallbackLocale;
      await this.loadMessages(this.fallbackLocale);
    }
  }

  // 加载配置文件
  async loadConfig() {
    try {
      const response = await fetch(chrome.runtime.getURL('config/locales.json'));
      this.config = await response.json();
      this.fallbackLocale = this.config.defaultLocale || 'en';
    } catch (error) {
      console.error('Failed to load i18n config:', error);
      // 使用默认配置
      this.config = {
        supportedLocales: [
          { code: 'zh_CN', name: 'Chinese', nativeName: '简体中文' },
          { code: 'en', name: 'English', nativeName: 'English' }
        ],
        defaultLocale: 'zh_CN',
        fallbackChain: ['en', 'zh_CN']
      };
    }
  }

  // 检测用户语言
  async detectUserLocale() {
    // 1. 检查用户手动设置的语言
    const stored = await this.getStoredLocale();
    if (stored && this.isLocaleSupported(stored)) {
      return stored;
    }

    // 2. 使用浏览器语言
    const browserLocale = chrome.i18n.getUILanguage();
    const bestMatch = this.findBestLocale(browserLocale);
    
    return bestMatch;
  }

  // 获取存储的语言设置
  async getStoredLocale() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userLocale'], (data) => {
        resolve(data.userLocale);
      });
    });
  }

  // 检查语言是否支持
  isLocaleSupported(locale) {
    return this.config.supportedLocales.some(l => l.code === locale);
  }

  // 找到最佳匹配的语言
  findBestLocale(userLocale) {
    const supported = this.config.supportedLocales.map(l => l.code);
    
    // 精确匹配
    if (supported.includes(userLocale)) {
      return userLocale;
    }
    
    // 标准化格式匹配 (zh-CN -> zh_CN)
    const normalized = userLocale.replace('-', '_');
    if (supported.includes(normalized)) {
      return normalized;
    }
    
    // 语言族匹配 (zh-HK -> zh_CN)
    const languageFamily = userLocale.split(/[-_]/)[0];
    const familyMatch = supported.find(locale => 
      locale.split(/[-_]/)[0] === languageFamily
    );
    
    if (familyMatch) {
      return familyMatch;
    }
    
    // 返回默认语言
    return this.config.defaultLocale;
  }

  // 加载语言消息
  async loadMessages(locale) {
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
      const messages = await response.json();
      this.messages[locale] = messages;
      return messages;
    } catch (error) {
      console.warn(`Failed to load locale ${locale}:`, error);
      
      // 尝试回退语言
      if (locale !== this.fallbackLocale) {
        return this.loadMessages(this.fallbackLocale);
      }
      
      return {};
    }
  }

  // 获取翻译消息
  getMessage(key, substitutions = []) {
    if (!this.isInitialized) {
      console.warn('I18n not initialized, using Chrome i18n API');
      return chrome.i18n.getMessage(key, substitutions) || key;
    }

    // 尝试当前语言
    let message = this.getMessageFromLocale(key, this.currentLocale);
    if (message) {
      return this.substituteMessage(message, substitutions);
    }

    // 尝试回退语言链
    for (const fallbackLocale of this.config.fallbackChain) {
      message = this.getMessageFromLocale(key, fallbackLocale);
      if (message) {
        console.warn(`Using fallback locale ${fallbackLocale} for key: ${key}`);
        return this.substituteMessage(message, substitutions);
      }
    }

    // 最后尝试 Chrome 内置 API
    const chromeMessage = chrome.i18n.getMessage(key, substitutions);
    if (chromeMessage) {
      return chromeMessage;
    }

    console.error(`No translation found for key: ${key}`);
    return key;
  }

  // 从特定语言获取消息
  getMessageFromLocale(key, locale) {
    const messages = this.messages[locale];
    if (!messages) return null;
    
    const messageObj = messages[key];
    if (!messageObj) return null;
    
    return messageObj.message || messageObj;
  }

  // 替换消息中的占位符
  substituteMessage(message, substitutions) {
    if (!substitutions || substitutions.length === 0) {
      return message;
    }
    
    let result = message;
    substitutions.forEach((sub, index) => {
      result = result.replace(new RegExp(`\\$${index + 1}`, 'g'), sub);
    });
    
    return result;
  }

  // 切换语言
  async switchLanguage(locale) {
    if (!this.isLocaleSupported(locale)) {
      console.error(`Unsupported locale: ${locale}`);
      return false;
    }

    this.currentLocale = locale;
    
    // 加载新语言的消息
    await this.loadMessages(locale);
    
    // 保存用户选择
    chrome.storage.local.set({ userLocale: locale });
    
    // 更新 UI
    this.updateUI();
    
    console.log(`Language switched to: ${locale}`);
    return true;
  }

  // 更新整个页面的 UI
  updateUI() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.getMessage(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
        element.placeholder = text;
      } else if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = text;
      } else {
        element.textContent = text;
      }
    });

    // 更新页面标题
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
      const titleKey = titleElement.getAttribute('data-i18n');
      document.title = this.getMessage(titleKey);
    }

    // 处理 RTL 语言
    const currentLocaleConfig = this.config.supportedLocales.find(l => l.code === this.currentLocale);
    if (currentLocaleConfig && currentLocaleConfig.rtl) {
      document.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }

  // 获取支持的语言列表
  getSupportedLocales() {
    return this.config ? this.config.supportedLocales : [];
  }

  // 获取当前语言
  getCurrentLocale() {
    return this.currentLocale;
  }

  // 获取当前语言的配置信息
  getCurrentLocaleConfig() {
    return this.config.supportedLocales.find(l => l.code === this.currentLocale);
  }
}

// 创建全局实例
const i18n = new I18nManager();

// 导出给其他脚本使用
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}