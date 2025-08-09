// 定义规则ID常量
const RULE_ID_START = 1000;
const CONTENT_FILTER_RULE_START = 2000; // 内容过滤规则起始ID

// 初始化变量
let blockList = [];
let contentFilterRules = []; // 添加内容过滤规则数组
let isUpdatingRules = false;

// 内容过滤配置（与 options.js 保持一致）
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

// 从存储加载所有设置
chrome.storage.local.get(['blockedSites', 'contentFilters', 'filterLevel'], (data) => {
  blockList = data.blockedSites || [];
  loadContentFilterRules(data.contentFilters, data.filterLevel);
  console.log("初始黑名单:", blockList);
  console.log("初始内容过滤规则:", contentFilterRules);
  updateRules();
});

// 加载内容过滤规则
function loadContentFilterRules(filters, level) {
  filters = filters || {};
  level = level || 'moderate';
  
  contentFilterRules = [];
  
  Object.keys(filters).forEach(filterType => {
    if (filters[filterType] && CONTENT_FILTERS[filterType]) {
      const config = CONTENT_FILTERS[filterType];
      
      let keywords = config.keywords;
      let domains = config.domains;
      
      // 根据过滤强度调整
      if (level === 'loose') {
        keywords = []; // 宽松模式只使用明确域名
      }
      
      contentFilterRules.push(...keywords, ...domains);
    }
  });
  
  console.log('内容过滤规则已加载:', contentFilterRules);
}

// 更新拦截规则
function updateRules() {
  if (isUpdatingRules) {
    console.log("规则更新正在进行中，跳过此次更新");
    return;
  }
  
  isUpdatingRules = true;
  
  // 首先清除所有现有规则
  chrome.declarativeNetRequest.getDynamicRules()
    .then((existingRules) => {
      const existingRuleIds = existingRules.map(rule => rule.id);
      
      if (existingRuleIds.length === 0) {
        addNewRules();
        return;
      }
      
      return chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      }).then(() => {
        console.log("已清除现有规则");
        return new Promise(resolve => {
          setTimeout(() => {
            chrome.declarativeNetRequest.getDynamicRules().then(rules => {
              console.log("清除后剩余规则数量:", rules.length);
              resolve();
            });
          }, 200);
        });
      }).then(() => {
        addNewRules();
      });
    })
    .catch(error => {
      console.error("获取或清除规则出错:", error);
      isUpdatingRules = false;
    });
}

// 添加新规则（合并手动屏蔽和内容过滤）
function addNewRules() {
  const allSites = [...new Set([...blockList, ...contentFilterRules])];
  
  if (allSites.length === 0) {
    console.log("没有需要屏蔽的网站");
    isUpdatingRules = false;
    return;
  }
  
  chrome.declarativeNetRequest.getDynamicRules().then(existingRules => {
    const existingIds = existingRules.map(rule => rule.id);
    console.log("添加规则前的现有规则ID:", existingIds);
    
    const rules = allSites.map((site, index) => {
      const cleanSite = site.replace(/^https?:\/\//, '').split('/')[0];
      const isContentFilter = contentFilterRules.includes(site);
      const ruleId = isContentFilter ? CONTENT_FILTER_RULE_START + index : RULE_ID_START + index;
      
      // 检查ID冲突
      if (existingIds.includes(ruleId)) {
        console.warn(`规则ID ${ruleId} 已存在，跳过添加`);
        return null;
      }
      
      return {
        id: ruleId,
        priority: isContentFilter ? 2 : 1, // 内容过滤规则优先级更高
        action: {
          type: "redirect",
          redirect: {
            url: chrome.runtime.getURL("blocked.html") + 
                 "?site=" + encodeURIComponent(cleanSite) + 
                 (isContentFilter ? "&reason=content-filter" : "")
          }
        },
        condition: {
          urlFilter: `*://*${cleanSite}/*`,
          resourceTypes: ["main_frame"]
        }
      };
    }).filter(rule => rule !== null);
    
    if (rules.length === 0) {
      console.log("没有新规则需要添加");
      isUpdatingRules = false;
      return;
    }
    
    return chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    })
    .then(() => {
      console.log(`已成功添加 ${rules.length} 条拦截规则:`, rules);
      return chrome.declarativeNetRequest.getDynamicRules();
    })
    .then(currentRules => {
      console.log("当前活跃规则:", currentRules);
      console.log(`总共 ${currentRules.length} 条规则生效`);
    });
  })
  .catch(error => {
    console.error("添加规则出错:", error);
  })
  .finally(() => {
    isUpdatingRules = false;
  });
}

// 在 addNewRules 函数中，当添加规则时记录统计
// 监听来自 options 页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContentFilters') {
    console.log('收到内容过滤更新请求');
    chrome.storage.local.get(['contentFilters', 'filterLevel'], (data) => {
      loadContentFilterRules(data.contentFilters, data.filterLevel);
      updateRules();
    });
  }
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
  let needUpdate = false;
  
  if (changes.blockedSites) {
    console.log("检测到黑名单更新:", changes.blockedSites.newValue);
    blockList = changes.blockedSites.newValue || [];
    needUpdate = true;
  }
  
  if (changes.contentFilters || changes.filterLevel) {
    console.log("检测到内容过滤设置更新");
    chrome.storage.local.get(['contentFilters', 'filterLevel'], (data) => {
      loadContentFilterRules(data.contentFilters, data.filterLevel);
      updateRules();
    });
    return; // 避免重复更新
  }
  
  if (needUpdate) {
    updateRules();
  }
});

// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log("扩展已安装或更新，正在初始化规则...");
  chrome.storage.local.get(['blockedSites', 'contentFilters', 'filterLevel'], (data) => {
    blockList = data.blockedSites || [];
    loadContentFilterRules(data.contentFilters, data.filterLevel);
    updateRules();
  });
});

// 在规则添加成功后，发送消息给popup
chrome.runtime.sendMessage({ action: 'siteBlocked' }).catch(() => {
  // 忽略错误，popup可能未打开
});