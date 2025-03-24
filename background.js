// 定义一个规则ID常量，以确保一致性
const RULE_ID_START = 1000;

// 初始化阻止列表
let blockList = [];

// 从存储加载黑名单
chrome.storage.local.get('blockedSites', (data) => {
  if (data.blockedSites) {
    blockList = data.blockedSites;
    console.log("初始黑名单:", blockList);
    updateRules();
  }
});

// 更新拦截规则 - 完全重写的版本
function updateRules() {
  // 首先清除所有现有规则
  chrome.declarativeNetRequest.getDynamicRules()
    .then((existingRules) => {
      const existingRuleIds = existingRules.map(rule => rule.id);
      
      // 如果没有既有规则要清除，直接添加新规则
      if (existingRuleIds.length === 0) {
        addNewRules();
        return;
      }
      
      // 清除所有现有规则
      return chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      }).then(() => {
        console.log("已清除现有规则");
        addNewRules();
      });
    })
    .catch(error => {
      console.error("获取或清除规则出错:", error);
    });
}

// 单独封装添加新规则的函数
function addNewRules() {
  if (blockList.length === 0) {
    console.log("黑名单为空，无需添加规则");
    return;
  }
  
  // 创建规则数组
  const rules = blockList.map((site, index) => {
    // 确保网站格式正确
    const cleanSite = site.replace(/^https?:\/\//, '').split('/')[0];
    
    return {
      id: RULE_ID_START + index,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          url: chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(cleanSite)
        }
      },
      condition: {
        // 使用域名匹配模式
        urlFilter: `*://*.${cleanSite}/*`,
        resourceTypes: ["main_frame"]
      }
    };
  });
  
  // 添加新规则
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules
  })
  .then(() => {
    console.log(`已成功添加 ${rules.length} 条拦截规则:`, rules);
    
    // 验证规则是否真的被添加
    return chrome.declarativeNetRequest.getDynamicRules();
  })
  .then(currentRules => {
    console.log("当前活跃规则:", currentRules);
  })
  .catch(error => {
    console.error("添加规则出错:", error);
  });
}

// 监听黑名单更新
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites) {
    console.log("检测到黑名单更新:", changes.blockedSites.newValue);
    blockList = changes.blockedSites.newValue || [];
    updateRules();
  }
});

// 添加安装或更新监听器，确保扩展初始化时规则被正确应用
chrome.runtime.onInstalled.addListener(() => {
  console.log("扩展已安装或更新，正在初始化规则...");
  chrome.storage.local.get('blockedSites', (data) => {
    blockList = data.blockedSites || [];
    updateRules();
  });
});