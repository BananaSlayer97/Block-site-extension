// blocked.js

// 等待 i18n 初始化完成
async function initializeBlockedPage() {
  await i18n.initialize();
  i18n.updateUI();
  
  // 显示被屏蔽的网站
  displayBlockedSite();
}

// 显示被屏蔽的网站
function displayBlockedSite() {
  const urlParams = new URLSearchParams(window.location.search);
  const site = urlParams.get('site');
  const reason = urlParams.get('reason') || 'manual';
  
  if (site) {
    document.getElementById('blockedSite').textContent = site;
  }
  
  // 根据屏蔽原因显示不同的消息
  const reasonElement = document.getElementById('blockReason');
  switch (reason) {
    case 'content-filter':
      reasonElement.textContent = i18n.getMessage('blockedByFilter');
      break;
    case 'adult-content':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('adultContent') + ')';
      break;
    case 'gambling':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('gambling') + ')';
      break;
    case 'social-media':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('socialMedia') + ')';
      break;
    case 'gaming':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('gaming') + ')';
      break;
    case 'shopping':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('shopping') + ')';
      break;
    case 'news':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('news') + ')';
      break;
    case 'entertainment':
      reasonElement.textContent = i18n.getMessage('blockedByFilter') + ' (' + i18n.getMessage('entertainment') + ')';
      break;
    default:
      reasonElement.textContent = i18n.getMessage('blockedByFilter');
  }
}

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
      console.log('拦截事件已记录');
    });
  });
}

// 返回上一页
document.getElementById('goBack').addEventListener('click', function() {
  window.history.back();
});

// 打开设置页面
document.getElementById('openOptions').addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

// 记录拦截事件
recordBlockEvent();

// 初始化页面
document.addEventListener('DOMContentLoaded', initializeBlockedPage);
