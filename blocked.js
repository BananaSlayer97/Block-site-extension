// blocked.js

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
      console.log('拦截统计已更新:', stats[today]);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const site = urlParams.get('site');
    const reason = urlParams.get('reason');
    
    if (site) {
        document.getElementById('siteName').textContent = site;
        // 记录拦截事件
        recordBlockEvent();
    }
    
    // 如果是内容过滤触发的屏蔽，显示特殊提示
    if (reason === 'content-filter') {
        document.getElementById('contentFilterNotice').style.display = 'block';
        document.querySelector('.message').textContent = 
            '此网站被智能内容过滤功能识别为不当内容并自动屏蔽。';
    }
    
    // 现有的事件绑定代码...
    document.getElementById('goBack').addEventListener('click', function() {
        window.history.back();
    });
    
    document.getElementById('openOptions').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});
