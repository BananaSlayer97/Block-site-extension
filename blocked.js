
const urlParams = new URLSearchParams(window.location.search);
const blockedSite = urlParams.get('site');

if (blockedSite) {
  console.log(`阻止访问网站: ${blockedSite}`);
  document.getElementById('blocked-message').textContent = 
    `您正在尝试访问 ${blockedSite}，该网站已被阻止。`;
} else {
  document.getElementById('blocked-message').textContent = 
    '您正在尝试访问一个被阻止的网站。';
}

// 添加返回按钮功能（如果需要）
// document.getElementById('back-btn')?.addEventListener('click', function() {
//   window.close();
// });