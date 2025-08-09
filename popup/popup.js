// popup.js

// The cleanSiteUrl function is now loaded globally via urlUtils.js in popup.html,
// so its local definition here is no longer needed.

chrome.storage.local.get('blockedSites', (data) => {
  const count = data.blockedSites?.length || 0;
  console.log(`当前阻止网站数量: ${count}`);
});

document.getElementById('edit-block-list').onclick = () => {
  chrome.runtime.openOptionsPage();
};

// Display the current site in the popup
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  if (tabs[0] && tabs[0].url) {
    try {
      const url = new URL(tabs[0].url);
      // Use the globally available cleanSiteUrl function
      let site = cleanSiteUrl(url.hostname);
      document.getElementById('current-site').textContent = site;
    } catch (error) {
      document.getElementById('current-site').textContent = 'Invalid URL';
    }
  }
});

// 直接在当前网址进行封锁
document.getElementById('block-current-site').addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0] || !tabs[0].url) {
      alert('无法获取当前网站信息');
      return;
    }
    
    try {
      const url = new URL(tabs[0].url);
      // Use the globally available cleanSiteUrl function
      let site = cleanSiteUrl(url.hostname);
      
      // 检查是否为特殊页面
      if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
        alert('无法阻止浏览器内部页面');
        return;
      }
      
      chrome.storage.local.get('blockedSites', function(data) {
        let blockedSites = data.blockedSites || [];
        
        if (blockedSites.includes(site)) {
          alert('该网站已在阻止列表中');
          return;
        }
        
        blockedSites.push(site);
        chrome.storage.local.set({ blockedSites }, function() {
          console.log(`已阻止网站: ${site}`);
          alert(`'${site}' 已添加到阻止列表。刷新页面或导航离开以使阻止生效。`);
          // 关闭当前标签页
          chrome.tabs.remove(tabs[0].id);
          // 跳转到阻止页面
          chrome.tabs.create({ 
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