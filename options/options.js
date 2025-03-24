let blockedSites = [];

// 渲染黑名单列表
function renderList() {
  const list = document.getElementById('site-list');
  list.innerHTML = '';
  
  blockedSites.forEach(site => {
    const li = document.createElement('li');
    
    const siteSpan = document.createElement('span');
    siteSpan.textContent = site;
    li.appendChild(siteSpan);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'delete';
    deleteBtn.addEventListener('click', function() {
      removeSite(site);
    });
    
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

// 删除网站
function removeSite(site) {
  blockedSites = blockedSites.filter(s => s !== site);
  chrome.storage.local.set({ blockedSites }, function() {
    console.log(`remove done: ${site}`);
  });
  renderList();
}

// 添加网站
document.getElementById('add-site').addEventListener('click', function() {
  let site = document.getElementById('site-input').value.trim();
  
  // 移除 http:// 或 https:// 前缀
  site = site.replace(/^https?:\/\//, '');
  // 只保留主域名部分
  site = site.split('/')[0];
  // 移除 www.
  site = site.replace(/^www\./, '');

  // 简单验证 - 至少有一个点，不含空格
  if (site && site.includes('.') && !site.includes(' ') && !blockedSites.includes(site)) {
    blockedSites.push(site);
    chrome.storage.local.set({ blockedSites }, function() {
      console.log(`add done: ${site}`);
    });
    document.getElementById('site-input').value = '';
    renderList();
  } else {
    alert('input right website， like ：example.com');
  }
});

// 初始化
chrome.storage.local.get('blockedSites', function(data) {
  blockedSites = data.blockedSites || [];
  console.log("inital add done:", blockedSites);
  renderList();
});