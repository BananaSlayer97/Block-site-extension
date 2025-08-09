// popup.js

// 等待 i18n 初始化完成
async function initializePopup() {
  await i18n.initialize();
  i18n.updateUI();
  
  // 获取并显示已屏蔽网站数量
  chrome.storage.local.get('blockedSites', (data) => {
    const count = data.blockedSites?.length || 0;
    document.getElementById('blockedCount').textContent = count;
    console.log(`当前阻止网站数量: ${count}`);
  });
  
  // 显示当前网站
  displayCurrentSite();
  
  // 更新统计显示
  updateStatsDisplay();
}

// 管理屏蔽列表按钮
document.getElementById('openOptions').onclick = () => {
  chrome.runtime.openOptionsPage();
};

// 检查是否为特殊页面
function isSpecialPage(url) {
  if (!url) return true;
  
  const specialProtocols = [
    'chrome:', 'chrome-extension:', 'chrome-search:', 'chrome-devtools:',
    'edge:', 'about:', 'moz-extension:', 'safari-extension:', 'file:'
  ];
  
  return specialProtocols.some(protocol => url.startsWith(protocol));
}

// 获取页面类型描述（国际化版本）
function getPageTypeDescription(url) {
  if (!url) return i18n.getMessage('unknownPage');
  
  if (url.startsWith('chrome://')) return i18n.getMessage('browserSettingsPage');
  if (url.startsWith('chrome-extension://')) return i18n.getMessage('extensionPage');
  if (url.startsWith('chrome-search://')) return i18n.getMessage('searchPage');
  if (url.startsWith('chrome-devtools://')) return i18n.getMessage('devToolsPage');
  if (url.startsWith('edge://')) return i18n.getMessage('edgeBrowserPage');
  if (url.startsWith('about:')) return i18n.getMessage('browserInfoPage');
  if (url.startsWith('file://')) return i18n.getMessage('localFile');
  
  return i18n.getMessage('specialPage');
}

// 显示当前网站
function displayCurrentSite() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const blockButton = document.getElementById('blockSite');
    const currentSiteElement = document.getElementById('currentSite');
    const siteIcon = document.getElementById('siteIcon');
    
    if (tabs[0] && tabs[0].url) {
      const url = tabs[0].url;
      
      if (isSpecialPage(url)) {
        currentSiteElement.textContent = getPageTypeDescription(url);
        currentSiteElement.style.color = '#888';
        currentSiteElement.style.fontStyle = 'italic';
        siteIcon.textContent = '🚫';
        
        blockButton.disabled = true;
        blockButton.textContent = i18n.getMessage('cannotBlockInternalPage');
        blockButton.style.opacity = '0.5';
        blockButton.style.cursor = 'not-allowed';
        blockButton.title = i18n.getMessage('cannotBlockInternalPage');
        
        return;
      }
      
      try {
        const urlObj = new URL(url);
        let site = cleanSiteUrl(urlObj.hostname);
        currentSiteElement.textContent = site;
        currentSiteElement.style.color = '';
        currentSiteElement.style.fontStyle = '';
        
        if (urlObj.protocol === 'https:') {
          siteIcon.textContent = '🔒';
        } else if (urlObj.protocol === 'http:') {
          siteIcon.textContent = '🌐';
        } else {
          siteIcon.textContent = '📄';
        }
        
        blockButton.disabled = false;
        blockButton.textContent = i18n.getMessage('blockSite');
        blockButton.style.opacity = '';
        blockButton.style.cursor = '';
        blockButton.title = '';
        
      } catch (error) {
        currentSiteElement.textContent = i18n.getMessage('invalidUrl');
        currentSiteElement.style.color = '#ff6b6b';
        siteIcon.textContent = '❌';
        
        blockButton.disabled = true;
        blockButton.textContent = i18n.getMessage('cannotBlock');
        blockButton.style.opacity = '0.5';
        blockButton.style.cursor = 'not-allowed';
        
        console.error('URL解析错误:', error);
      }
    } else {
      currentSiteElement.textContent = i18n.getMessage('cannotGetCurrentPage');
      currentSiteElement.style.color = '#888';
      siteIcon.textContent = '❓';
      
      blockButton.disabled = true;
      blockButton.textContent = i18n.getMessage('cannotBlock');
      blockButton.style.opacity = '0.5';
      blockButton.style.cursor = 'not-allowed';
    }
  });
}

// 屏蔽当前网站按钮
document.getElementById('blockSite').addEventListener('click', function() {
  if (this.disabled) return;
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0] || !tabs[0].url) {
      alert(i18n.getMessage('cannotGetSiteInfo'));
      return;
    }
    
    const url = tabs[0].url;
    
    if (isSpecialPage(url)) {
      alert(i18n.getMessage('cannotBlockInternalPage'));
      return;
    }
    
    try {
      const urlObj = new URL(url);
      let site = cleanSiteUrl(urlObj.hostname);
      
      chrome.storage.local.get('blockedSites', function(data) {
        let blockedSites = data.blockedSites || [];
        
        if (blockedSites.includes(site)) {
          alert(i18n.getMessage('siteAlreadyBlocked'));
          return;
        }
        
        blockedSites.push(site);
        chrome.storage.local.set({ blockedSites }, function() {
          console.log(`已屏蔽网站: ${site}`);
          
          document.getElementById('blockedCount').textContent = blockedSites.length;
          
          chrome.tabs.update(tabs[0].id, {
            url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
          });
        });
      });
    } catch (error) {
      alert(i18n.getMessage('invalidUrlFormat'));
      console.error('URL解析错误:', error);
    }
  });
});

// 获取今天的日期字符串
function getTodayString() {
  const today = new Date();
  return today.getFullYear() + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
}

// 记录拦截事件
function recordBlockEvent() {
  const today = getTodayString();
  chrome.storage.local.get(['blockStats'], function(data) {
    let stats = data.blockStats || {};
    if (!stats[today]) {
      stats[today] = { count: 0, focusTime: 0 };
    }
    stats[today].count += 1;
    
    chrome.storage.local.set({ blockStats: stats }, function() {
      updateStatsDisplay();
    });
  });
}

// 更新统计显示
function updateStatsDisplay() {
  const today = getTodayString();
  chrome.storage.local.get(['blockStats'], function(data) {
    const stats = data.blockStats || {};
    const todayStats = stats[today] || { count: 0, focusTime: 0 };
    
    document.getElementById('todayBlocked').textContent = todayStats.count;
    
    // 计算总专注时间（假设每次拦截节省5分钟）
    const totalMinutes = todayStats.count * 5;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      document.getElementById('focusTime').textContent = `${hours}h${minutes > 0 ? minutes + 'm' : ''}`;
    } else {
      document.getElementById('focusTime').textContent = `${minutes}m`;
    }
  });
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'siteBlocked') {
    recordBlockEvent();
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', initializePopup);