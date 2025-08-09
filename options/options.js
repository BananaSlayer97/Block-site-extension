// options.js
let blockedSites = [];

// The cleanSiteUrl function is now loaded globally via urlUtils.js in options.html,
// so its local definition here is no longer needed.

function renderList() {
  const list = document.getElementById('siteList'); // 修正ID
  list.innerHTML = '';
  
  if (blockedSites.length === 0) {
    // 显示空状态
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">🌐</div>
      <div class="empty-title">暂无屏蔽网站</div>
      <div class="empty-description">添加您想要屏蔽的网站域名</div>
    `;
    list.appendChild(emptyState);
    return;
  }
  
  blockedSites.forEach(site => {
    const li = document.createElement('li');
    li.className = 'site-item';
    
    li.innerHTML = `
      <div class="site-info">
        <div class="site-favicon">${site.charAt(0).toUpperCase()}</div>
        <span class="site-name">${site}</span>
      </div>
      <button class="btn-remove" data-site="${site}">
        <i class="material-icons">delete</i>
      </button>
    `;
    
    // 为删除按钮添加事件监听器
    const removeBtn = li.querySelector('.btn-remove');
    removeBtn.addEventListener('click', function() {
      removeSite(site);
    });
    
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

// 页面加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
  // 绑定添加按钮事件
  document.getElementById('addSite').addEventListener('click', function() {
    let site = document.getElementById('siteInput').value.trim(); // 修正ID
    
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
      document.getElementById('siteInput').value = ''; // 修正ID
      renderList();
    });
  });
  
  // 支持回车键添加
  document.getElementById('siteInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('addSite').click();
    }
  });

  // 加载已保存的网站列表
  loadSites();
  
  // 加载内容过滤设置
  loadContentFilterSettings();
  
  // 绑定内容过滤事件
  bindContentFilterEvents();
  
  // 绑定过滤强度事件
  bindFilterLevelEvents();
});

function loadSites() {
  chrome.storage.local.get(['blockedSites'], function(result) {
    blockedSites = result.blockedSites || [];
    renderList();
  });
}

// 内容过滤配置
const CONTENT_FILTERS = {
    adultContent: {
        keywords: ['adult', 'xxx', 'porn', '18+', 'sex', 'nude'],
        domains: ['pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com']
    },
    gambling: {
        keywords: ['casino', 'poker', 'bet', 'gambling', 'lottery'],
        domains: ['bet365.com', 'pokerstars.com', 'casino.com']
    },
    socialMedia: {
        keywords: [],
        domains: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'snapchat.com']
    },
    entertainment: {
        keywords: ['game', 'video', 'movie', 'tv'],
        domains: ['youtube.com', 'netflix.com', 'twitch.tv', 'steam.com']
    }
};

// 加载内容过滤设置
function loadContentFilterSettings() {
    chrome.storage.local.get(['contentFilters', 'filterLevel'], function(data) {
        const filters = data.contentFilters || {};
        const level = data.filterLevel || 'moderate';
        
        // 设置开关状态
        document.getElementById('adultContentFilter').checked = filters.adultContent || false;
        document.getElementById('gamblingFilter').checked = filters.gambling || false;
        document.getElementById('socialMediaFilter').checked = filters.socialMedia || false;
        document.getElementById('entertainmentFilter').checked = filters.entertainment || false;
        
        // 设置过滤强度
        updateFilterLevelUI(level);
    });
}

// 绑定内容过滤事件
function bindContentFilterEvents() {
    // 过滤开关事件
    const filterCheckboxes = [
        'adultContentFilter',
        'gamblingFilter', 
        'socialMediaFilter',
        'entertainmentFilter'
    ];
    
    filterCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                // 更新过滤项的视觉状态
                const filterItem = checkbox.closest('.filter-item');
                if (checkbox.checked) {
                    filterItem.classList.add('active');
                } else {
                    filterItem.classList.remove('active');
                }
                saveContentFilterSettings();
            });
        }
    });
}

// 绑定过滤强度选择器事件
function bindFilterLevelEvents() {
    document.querySelectorAll('.level-option').forEach(option => {
        option.addEventListener('click', function() {
            const level = this.dataset.level;
            updateFilterLevelUI(level);
            saveContentFilterSettings();
        });
    });
}

// 更新过滤强度UI
function updateFilterLevelUI(level) {
    document.querySelectorAll('.level-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.level === level) {
            option.classList.add('active');
            option.querySelector('input').checked = true;
        }
    });
}

// 保存内容过滤设置
function saveContentFilterSettings() {
    const contentFilters = {
        adultContent: document.getElementById('adultContentFilter').checked,
        gambling: document.getElementById('gamblingFilter').checked,
        socialMedia: document.getElementById('socialMediaFilter').checked,
        entertainment: document.getElementById('entertainmentFilter').checked
    };
    
    const activeLevel = document.querySelector('.level-option.active');
    const filterLevel = activeLevel ? activeLevel.dataset.level : 'moderate';
    
    chrome.storage.local.set({
        contentFilters: contentFilters,
        filterLevel: filterLevel
    }, function() {
        console.log('内容过滤设置已保存');
        // 通知 background.js 更新规则
        chrome.runtime.sendMessage({action: 'updateContentFilters'});
    });
}

// 获取当前启用的过滤规则
function getActiveFilterRules() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['contentFilters', 'filterLevel'], function(data) {
            const filters = data.contentFilters || {};
            const level = data.filterLevel || 'moderate';
            
            let rules = [];
            
            Object.keys(filters).forEach(filterType => {
                if (filters[filterType] && CONTENT_FILTERS[filterType]) {
                    const config = CONTENT_FILTERS[filterType];
                    
                    // 根据过滤强度调整规则
                    let keywords = config.keywords;
                    let domains = config.domains;
                    
                    if (level === 'strict') {
                        // 严格模式：使用所有关键词和域名
                    } else if (level === 'loose') {
                        // 宽松模式：只使用明确的域名
                        keywords = [];
                    }
                    
                    rules.push(...keywords, ...domains);
                }
            });
            
            resolve(rules);
        });
    });
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getActiveFilterRules, CONTENT_FILTERS };
}