chrome.storage.local.get('blockedSites', (data) => {
    const count = data.blockedSites?.length || 0;
    document.getElementById('blocked-count').textContent = count;
  });
  
  document.getElementById('open-options').onclick = () => {
    chrome.runtime.openOptionsPage();
  };


  // 直接在当前网址进行封锁 
document.getElementById('block-rightnow').addEventListener('click', function() {
  // 获得当前访问网址
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const url = new URL(tabs[0].url);
    let site = url.hostname;
    // 移除 www.
    site = site.replace(/^www\./, '');
   // 从 chrome.storage.local 获取当前的 blockedSites
   chrome.storage.local.get('blockedSites', function(data) {
    let blockedSites = data.blockedSites || [];
    // 检查是否已存在
    if (blockedSites.includes(site)) {
      alert('already blocked');
      return;
    }
    // 添加到黑名单
    blockedSites.push(site);
    // 保存回 chrome.storage.local
    chrome.storage.local.set({ blockedSites }, function() {
      console(`block done ${site}`);
    });
    //关闭当前标签页
    chrome.tabs.remove(tabs[0].id);
    // 跳转到 blocked.html
    chrome.tabs.create({ url: 'blocked.html' });
  });

  });
});