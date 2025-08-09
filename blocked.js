// blocked.js

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
async function initializeBlockedPage() {
  try {
    showLoadingState();
    
    // 确保 i18n 完全初始化
    await i18n.initialize();
    
    // 等待一小段时间确保 DOM 准备就绪
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 更新 UI
    i18n.updateUI();
    
    // 显示被屏蔽的网站
    displayBlockedSite();
    
    hideLoadingState();
    console.log('Blocked page initialized successfully');
  } catch (error) {
    console.error('Failed to initialize blocked page:', error);
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
  const reasonMessages = {
    'content-filter': i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽',
    'adult-content': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('adultContent') || '成人内容') + ')',
    'gambling': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('gambling') || '赌博') + ')',
    'social-media': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('socialMedia') || '社交媒体') + ')',
    'gaming': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('gaming') || '游戏') + ')',
    'shopping': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('shopping') || '购物') + ')',
    'news': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('news') || '新闻') + ')',
    'entertainment': (i18n.getMessage('blockedByFilter') || '此网站被智能内容过滤器屏蔽') + ' (' + (i18n.getMessage('entertainment') || '娱乐') + ')',
    'manual': i18n.getMessage('blockedManually') || '此网站已被手动屏蔽'
  };
  
  reasonElement.textContent = reasonMessages[reason] || reasonMessages['content-filter'];
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

// 添加按钮点击效果
function addButtonEffects() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.02)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
    
    button.addEventListener('mousedown', function() {
      this.style.transform = 'translateY(0) scale(0.98)';
    });
    
    button.addEventListener('mouseup', function() {
      this.style.transform = 'translateY(-2px) scale(1.02)';
    });
  });
}

// 返回上一页
document.getElementById('goBack').addEventListener('click', function() {
  // 添加点击反馈
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    window.history.back();
  }, 150);
});

// 打开设置页面
document.getElementById('openOptions').addEventListener('click', function() {
  // 添加点击反馈
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    chrome.runtime.openOptionsPage();
  }, 150);
});

// 键盘快捷键支持
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.key === 'Backspace') {
    window.history.back();
  } else if (e.key === 'Enter' && e.ctrlKey) {
    chrome.runtime.openOptionsPage();
  }
});

// 记录拦截事件
recordBlockEvent();

// 确保 DOM 完全加载后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeBlockedPage();
    addButtonEffects();
  });
} else {
  initializeBlockedPage();
  addButtonEffects();
}
