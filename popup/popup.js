chrome.storage.local.get('blockedSites', (data) => {
    const count = data.blockedSites?.length || 0;
    document.getElementById('blocked-count').textContent = count;
  });
  
  document.getElementById('open-options').onclick = () => {
    chrome.runtime.openOptionsPage();
  };