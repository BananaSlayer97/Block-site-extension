// popup.js

// The cleanSiteUrl function is now loaded globally via urlUtils.js in popup.html,
// so its local definition here is no longer needed.

chrome.storage.local.get('blockedSites', (data) => {
    // The 'blocked-count' element is commented out in popup.html, so this line is no longer needed.
    // const count = data.blockedSites?.length || 0;
    // document.getElementById('blocked-count').textContent = count;
});

document.getElementById('edit-block-list').onclick = () => {
    chrome.runtime.openOptionsPage();
};

// Display the current site in the popup
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  const url = new URL(tabs[0].url);
  // Use the globally available cleanSiteUrl function
  let site = cleanSiteUrl(url.hostname); 
  document.getElementById('current-site').textContent = site;
});

// 直接在当前网址进行封锁
document.getElementById('block-current-site').addEventListener('click', function() {
  // 获得当前访问网址
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const url = new URL(tabs[0].url);
    // Use the globally available cleanSiteUrl function
    let site = cleanSiteUrl(url.hostname); 
   // 从 chrome.storage.local 获取当前的 blockedSites
   chrome.storage.local.get('blockedSites', function(data) {
    let blockedSites = data.blockedSites || [];
    // 检查是否已存在
    if (blockedSites.includes(site)) {
      alert('This site is already blocked!');
      return;
    }
    // 添加到黑名单
    blockedSites.push(site);
    // 保存回 chrome.storage.local
    chrome.storage.local.set({ blockedSites }, function() {
      console.log(`Block done: ${site}`);
      alert(`'${site}' has been added to your block list. Refresh the page or navigate away for the block to take effect.`);
    });
  });
  });
});