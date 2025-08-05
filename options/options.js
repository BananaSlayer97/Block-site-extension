// options.js
let blockedSites = [];

// Include the utility function directly or ensure it's loaded before this script
// For this project's structure, we'll assume urlUtils.js is loaded before options.js
// or we can define the function here for simplicity if it's small.
// Given the request to create a new file, I'll assume it's loaded.
// If not, we might need to adjust manifest.json or script loading order.

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
  
  site = cleanSiteUrl(site); // Use the utility function
  
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