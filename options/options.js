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
    console.log(`Removed from the blacklist: ${site}`);
    chrome.storage.local.get('blockedSites', (data) => {
      console.log('Memory acknowledgement:', data.blockedSites);
    });
  });
  renderList();
}

document.getElementById('add-site').addEventListener('click', function() {
  let site = document.getElementById('site-input').value.trim();
  
  // Use the globally available cleanSiteUrl function
  site = cleanSiteUrl(site); 
  
  if (site && site.includes('.') && !site.includes(' ') && !blockedSites.includes(site)) {
    blockedSites.push(site);
    chrome.storage.local.set({ blockedSites }, function() {
      console.log(`You have been added to the blacklist: ${site}`);
      chrome.storage.local.get('blockedSites', (data) => {
        console.log('Memory acknowledgement:', data.blockedSites);
      });
    });
    document.getElementById('site-input').value = '';
    renderList();
  } else {
    alert('Please provide a valid website domain name, for example: example.com');
  }
});

chrome.storage.local.get('blockedSites', function(data) {
  blockedSites = data.blockedSites || [];
  console.log("The blacklist has been loaded", blockedSites);
  renderList();
});