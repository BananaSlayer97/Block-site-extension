// options.js
let blockedSites = [];

// The cleanSiteUrl function is now loaded globally via urlUtils.js in options.html,
// so its local definition here is no longer needed.

function renderList() {
  const list = document.getElementById('site-list');
  list.innerHTML = '';
  
  blockedSites.forEach(site => {
    const li = document.createElement('li');
    
    const siteSpan = document.createElement('span');
    siteSpan.textContent = site;
    li.appendChild(siteSpan);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<span class="material-icons">delete</span>'; // 使用 Material Icons
    deleteBtn.addEventListener('click', function() {
      removeSite(site);
    });
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function removeSite(site) {
  blockedSites = blockedSites.filter(s => s !== site);
  chrome.storage.local.set({ blockedSites }, function() {
    if (chrome.runtime.lastError) {
      console.error('保存失败:', chrome.runtime.lastError);
      alert('删除失败，请重试');
      return;
    }
    console.log(`已从黑名单移除: ${site}`);
    renderList();
  });
}

document.getElementById('add-site').addEventListener('click', function() {
  let site = document.getElementById('site-input').value.trim();
  
  // Use the globally available cleanSiteUrl function
  site = cleanSiteUrl(site);
  
  // 更严格的域名验证
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  
  if (!site) {
    alert('请输入网站域名');
    return;
  }
  
  if (!domainRegex.test(site)) {
    alert('请输入有效的域名格式，例如: example.com');
    return;
  }
  
  if (blockedSites.includes(site)) {
    alert('该网站已在阻止列表中');
    return;
  }
  
  blockedSites.push(site);
  chrome.storage.local.set({ blockedSites }, function() {
    if (chrome.runtime.lastError) {
      console.error('保存失败:', chrome.runtime.lastError);
      alert('添加失败，请重试');
      return;
    }
    console.log(`已添加到黑名单: ${site}`);
    document.getElementById('site-input').value = '';
    renderList();
  });
});

chrome.storage.local.get('blockedSites', function(data) {
  blockedSites = data.blockedSites || [];
  console.log("The blacklist has been loaded", blockedSites);
  renderList();
});