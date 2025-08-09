// options.js

// 添加加载状态管理
let isInitializing = true;

// 显示加载状态
function showLoadingState() {
  document.body.style.opacity = '0.7';
  document.body.style.pointerEvents = 'none';
}

// 隐藏加载状态
function hideLoadingState() {
  document.body.style.opacity = '1';
  document.body.style.pointerEvents = 'auto';
  isInitializing = false;
}

// 等待 i18n 初始化完成
async function initializeOptions() {
  try {
    showLoadingState();
    
    // 确保 i18n 完全初始化
    await i18n.initialize();
    
    // 等待一小段时间确保 DOM 准备就绪
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 更新 UI
    i18n.updateUI();
    
    // 初始化语言选择器
    initializeLanguageSelector();
    
    // 加载已屏蔽的网站
    loadBlockedSites();
    
    // 加载内容过滤设置
    loadContentFilterSettings();
    
    hideLoadingState();
    console.log('Options page initialized successfully');
  } catch (error) {
    console.error('Failed to initialize options page:', error);
    hideLoadingState();
    
    // 显示错误信息
    showErrorMessage('初始化失败，请刷新页面重试');
  }
}

// 显示错误信息
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ff0040, #ff4080);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 1000;
    font-family: 'Fira Code', monospace;
    box-shadow: 0 0 20px rgba(255, 0, 64, 0.3);
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// 初始化语言选择器
function initializeLanguageSelector() {
  const select = document.getElementById('languageSelect');
  if (!select) {
    console.error('Language selector not found');
    return;
  }
  
  const supportedLocales = i18n.getSupportedLocales();
  const currentLocale = i18n.getCurrentLocale();
  
  // 清空现有选项
  select.innerHTML = '';
  
  // 添加语言选项
  supportedLocales.forEach(locale => {
    const option = document.createElement('option');
    option.value = locale.code;
    option.textContent = `${locale.flag || ''} ${locale.nativeName}`;
    
    if (locale.code === currentLocale) {
      option.selected = true;
    }
    
    select.appendChild(option);
  });
  
  // 监听语言切换
  select.addEventListener('change', async (e) => {
    if (isInitializing) return;
    
    const newLocale = e.target.value;
    showLoadingState();
    
    try {
      const success = await i18n.switchLanguage(newLocale);
      
      if (success) {
        // 重新加载页面内容以应用新语言
        await new Promise(resolve => setTimeout(resolve, 100));
        loadBlockedSites();
      }
    } catch (error) {
      console.error('Failed to switch language:', error);
      showErrorMessage('语言切换失败');
    } finally {
      hideLoadingState();
    }
  });
}

// 渲染屏蔽网站列表
function renderList(sites) {
  const list = document.getElementById('siteList');
  if (!list) {
    console.error('Site list element not found');
    return;
  }
  
  list.innerHTML = '';
  
  if (sites.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">🌐</div>
      <div class="empty-title">${i18n.getMessage('noBlockedSites') || '暂无屏蔽网站'}</div>
      <div class="empty-description">${i18n.getMessage('addSiteToStart') || '添加网站开始使用'}</div>
    `;
    list.appendChild(emptyState);
    return;
  }
  
  sites.forEach(site => {
    const li = document.createElement('li');
    li.className = 'site-item';
    
    const siteInfo = document.createElement('div');
    siteInfo.className = 'site-info';
    
    const favicon = document.createElement('div');
    favicon.className = 'site-favicon';
    favicon.textContent = site.charAt(0).toUpperCase();
    
    const siteSpan = document.createElement('span');
    siteSpan.textContent = site;
    siteSpan.className = 'site-name';
    
    siteInfo.appendChild(favicon);
    siteInfo.appendChild(siteSpan);
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="material-icons">delete</i>';
    removeBtn.className = 'btn-remove';
    removeBtn.title = i18n.getMessage('remove') || '移除';
    
    // 使用 addEventListener 而不是 onclick
    removeBtn.addEventListener('click', () => removeSite(site));
    
    li.appendChild(siteInfo);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

// 移除网站
function removeSite(site) {
  chrome.storage.local.get('blockedSites', function(data) {
    let blockedSites = data.blockedSites || [];
    blockedSites = blockedSites.filter(s => s !== site);
    
    chrome.storage.local.set({ blockedSites }, function() {
      console.log(`已移除网站: ${site}`);
      renderList(blockedSites);
    });
  });
}

// 加载已屏蔽的网站
function loadBlockedSites() {
  chrome.storage.local.get('blockedSites', function(data) {
    const blockedSites = data.blockedSites || [];
    renderList(blockedSites);
  });
}

// 添加网站按钮事件
document.getElementById('addSite').addEventListener('click', function() {
  const input = document.getElementById('siteInput');
  const site = input.value.trim();
  
  if (!site) {
    return;
  }
  
  // 简单的URL验证
  const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  if (!urlPattern.test(site)) {
    alert(i18n.getMessage('invalidUrlFormat'));
    return;
  }
  
  chrome.storage.local.get('blockedSites', function(data) {
    let blockedSites = data.blockedSites || [];
    
    if (blockedSites.includes(site)) {
      alert(i18n.getMessage('siteAlreadyBlocked'));
      return;
    }
    
    blockedSites.push(site);
    chrome.storage.local.set({ blockedSites }, function() {
      console.log(`已添加网站: ${site}`);
      input.value = '';
      renderList(blockedSites);
    });
  });
});

// 回车键添加网站
document.getElementById('siteInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('addSite').click();
  }
});

// 加载内容过滤设置
function loadContentFilterSettings() {
  chrome.storage.local.get('contentFilters', function(data) {
    const filters = data.contentFilters || {};
    
    // 设置各个过滤器的状态
    Object.keys(filters).forEach(filterId => {
      const checkbox = document.getElementById(filterId);
      if (checkbox) {
        checkbox.checked = filters[filterId];
      }
    });
  });
}

// 保存内容过滤设置
function saveContentFilterSettings() {
  const filterIds = ['adultContent', 'gambling', 'socialMedia', 'gaming', 'shopping', 'news', 'entertainment'];
  const filters = {};
  
  filterIds.forEach(filterId => {
    const checkbox = document.getElementById(filterId);
    if (checkbox) {
      filters[filterId] = checkbox.checked;
    }
  });
  
  chrome.storage.local.set({ contentFilters: filters }, function() {
    console.log('内容过滤设置已保存:', filters);
    
    // 通知 background script 更新规则
    chrome.runtime.sendMessage({
      action: 'updateContentFilters',
      filters: filters
    });
  });
}

// 为所有内容过滤器添加事件监听
document.addEventListener('DOMContentLoaded', function() {
  const filterIds = ['adultContent', 'gambling', 'socialMedia', 'gaming', 'shopping', 'news', 'entertainment'];
  
  filterIds.forEach(filterId => {
    const checkbox = document.getElementById(filterId);
    if (checkbox) {
      checkbox.addEventListener('change', saveContentFilterSettings);
    }
  });
  
  // 初始化页面
  initializeOptions();
});

// 确保 DOM 完全加载后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOptions);
} else {
  initializeOptions();
}