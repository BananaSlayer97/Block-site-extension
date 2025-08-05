// blocked.js
const urlParams = new URLSearchParams(window.location.search);
const blockedSite = urlParams.get('site');
if (blockedSite) {
  console.log(`Blocked site: ${blockedSite}`);
  document.getElementById('blocked-message').textContent = `You are trying to access ${blockedSite}, which is blocked.`;
}

document.getElementById('back-btn').addEventListener('click', function() {
  console.log('Opening a new tab...');
  // Open a new tab, for example, to the Chrome new tab page or Google
  chrome.tabs.create({ url: 'chrome://newtab/' });
});