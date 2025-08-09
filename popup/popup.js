// popup.js

// 获取并显示已屏蔽网站数量
chrome.storage.local.get('blockedSites', (data) => {
  const count = data.blockedSites?.length || 0;
  document.getElementById('blockedCount').textContent = count;
  console.log(`当前阻止网站数量: ${count}`);
});

// 管理屏蔽列表按钮
document.getElementById('openOptions').onclick = () => {
  chrome.runtime.openOptionsPage();
};

// 检查是否为特殊页面
function isSpecialPage(url) {
  if (!url) return true;
  
  const specialProtocols = [
    'chrome:',
    'chrome-extension:',
    'chrome-search:',
    'chrome-devtools:',
    'edge:',
    'about:',
    'moz-extension:',
    'safari-extension:',
    'file:'
  ];
  
  return specialProtocols.some(protocol => url.startsWith(protocol));
}

// 获取页面类型描述
function getPageTypeDescription(url) {
  if (!url) return '未知页面';
  
  if (url.startsWith('chrome://')) return '浏览器设置页面';
  if (url.startsWith('chrome-extension://')) return '扩展程序页面';
  if (url.startsWith('chrome-search://')) return '搜索页面';
  if (url.startsWith('chrome-devtools://')) return '开发者工具';
  if (url.startsWith('edge://')) return 'Edge浏览器页面';
  if (url.startsWith('about:')) return '浏览器信息页面';
  if (url.startsWith('file://')) return '本地文件';
  if (url.startsWith('moz-extension://')) return 'Firefox扩展页面';
  if (url.startsWith('safari-extension://')) return 'Safari扩展页面';
  
  return '特殊页面';
}

// 显示当前网站
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  const blockButton = document.getElementById('blockSite');
  const currentSiteElement = document.getElementById('currentSite');
  const siteIcon = document.getElementById('siteIcon');
  
  if (tabs[0] && tabs[0].url) {
    const url = tabs[0].url;
    
    // 检查是否为特殊页面
    if (isSpecialPage(url)) {
      // 特殊页面处理
      currentSiteElement.textContent = getPageTypeDescription(url);
      currentSiteElement.style.color = '#888';
      currentSiteElement.style.fontStyle = 'italic';
      siteIcon.textContent = '🚫';
      
      // 禁用屏蔽按钮
      blockButton.disabled = true;
      blockButton.textContent = '无法屏蔽此页面';
      blockButton.style.opacity = '0.5';
      blockButton.style.cursor = 'not-allowed';
      blockButton.title = '浏览器内部页面无法被屏蔽';
      
      return;
    }
    
    try {
      const urlObj = new URL(url);
      let site = cleanSiteUrl(urlObj.hostname);
      currentSiteElement.textContent = site;
      currentSiteElement.style.color = '';
      currentSiteElement.style.fontStyle = '';
      
      // 设置网站图标
      if (urlObj.protocol === 'https:') {
        siteIcon.textContent = '🔒';
      } else if (urlObj.protocol === 'http:') {
        siteIcon.textContent = '🌐';
      } else {
        siteIcon.textContent = '📄';
      }
      
      // 启用屏蔽按钮
      blockButton.disabled = false;
      blockButton.textContent = '屏蔽当前网站';
      blockButton.style.opacity = '';
      blockButton.style.cursor = '';
      blockButton.title = '';
      
    } catch (error) {
      currentSiteElement.textContent = '无效网址';
      currentSiteElement.style.color = '#ff6b6b';
      siteIcon.textContent = '❌';
      
      // 禁用屏蔽按钮
      blockButton.disabled = true;
      blockButton.textContent = '无法屏蔽';
      blockButton.style.opacity = '0.5';
      blockButton.style.cursor = 'not-allowed';
      
      console.error('URL解析错误:', error);
    }
  } else {
    currentSiteElement.textContent = '无法获取当前页面';
    currentSiteElement.style.color = '#888';
    siteIcon.textContent = '❓';
    
    // 禁用屏蔽按钮
    blockButton.disabled = true;
    blockButton.textContent = '无法屏蔽';
    blockButton.style.opacity = '0.5';
    blockButton.style.cursor = 'not-allowed';
  }
});

// 屏蔽当前网站按钮
document.getElementById('blockSite').addEventListener('click', function() {
  // 如果按钮被禁用，直接返回
  if (this.disabled) {
    return;
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0] || !tabs[0].url) {
      alert('无法获取当前网站信息');
      return;
    }
    
    const url = tabs[0].url;
    
    // 再次检查是否为特殊页面（双重保险）
    if (isSpecialPage(url)) {
      alert('无法屏蔽浏览器内部页面');
      return;
    }
    
    try {
      const urlObj = new URL(url);
      let site = cleanSiteUrl(urlObj.hostname);
      
      chrome.storage.local.get('blockedSites', function(data) {
        let blockedSites = data.blockedSites || [];
        
        if (blockedSites.includes(site)) {
          alert('该网站已在屏蔽列表中');
          return;
        }
        
        blockedSites.push(site);
        chrome.storage.local.set({ blockedSites }, function() {
          console.log(`已屏蔽网站: ${site}`);
          
          // 更新显示的屏蔽数量
          document.getElementById('blockedCount').textContent = blockedSites.length;
          
          // 直接跳转到屏蔽页面
          chrome.tabs.update(tabs[0].id, {
            url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
          });
        });
      });
    } catch (error) {
      alert('网站URL格式错误');
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

// 初始化统计数据
document.addEventListener('DOMContentLoaded', function() {
  updateStatsDisplay();
});

// 监听来自background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'siteBlocked') {
    recordBlockEvent();
  }
});