// popup.js

// Include the utility function directly or ensure it's loaded before this script
// Re-defining cleanSiteUrl here for now, as direct module imports are not standard
// for plain JS Chrome extensions without a build step.
// A better approach would be to include urlUtils.js as a script in options.html and popup.html
// before options.js and popup.js, making cleanSiteUrl globally available.
// I will update the HTML files to include this utility script.
function cleanSiteUrl(urlString) {
  let site = urlString.replace(/^https?:\/\//, ''); // Remove http/https
  site = site.split('/')[0]; // Get only the domain part
  site = site.replace(/^www\./, ''); // Remove www.
  return site;
}

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
  let site = cleanSiteUrl(url.hostname); // Use the utility function
  document.getElementById('current-site').textContent = site;
});

// 直接在当前网址进行封锁
document.getElementById('block-current-site').addEventListener('click', function() {
  // 获得当前访问网址
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const url = new URL(tabs[0].url);
    let site = cleanSiteUrl(url.hostname); // Use the utility function
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