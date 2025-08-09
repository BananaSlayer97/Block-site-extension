// 定义一个规则ID常量，以确保一致性
const RULE_ID_START = 1000;

// 初始化阻止列表
let blockList = [];
let isUpdatingRules = false; // 添加标志防止并发更新

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
  // 防止并发更新
  if (isUpdatingRules) {
    console.log("规则更新正在进行中，跳过此次更新");
    return;
  }
  
  isUpdatingRules = true;
  
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
        // 增加延迟确保清除操作完成，并验证清除结果
        return new Promise(resolve => {
          setTimeout(() => {
            chrome.declarativeNetRequest.getDynamicRules().then(rules => {
              console.log("清除后剩余规则数量:", rules.length);
              resolve();
            });
          }, 200); // 增加延迟时间
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

// 单独封装添加新规则的函数
// 改进域名匹配逻辑
function addNewRules() {
  if (blockList.length === 0) {
    console.log("黑名单为空，无需添加规则");
    isUpdatingRules = false;
    return;
  }
  
  // 先获取当前规则，确保没有冲突
  chrome.declarativeNetRequest.getDynamicRules().then(existingRules => {
    const existingIds = existingRules.map(rule => rule.id);
    console.log("添加规则前的现有规则ID:", existingIds);
    
    const rules = blockList.map((site, index) => {
      const cleanSite = site.replace(/^https?:\/\//, '').split('/')[0];
      const ruleId = RULE_ID_START + index;
      
      // 检查ID冲突
      if (existingIds.includes(ruleId)) {
        console.warn(`规则ID ${ruleId} 已存在，跳过添加`);
        return null;
      }
      
      return {
        id: ruleId,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            url: chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(cleanSite)
          }
        },
        condition: {
          // 同时匹配主域名和子域名
          urlFilter: `*://*${cleanSite}/*`,
          resourceTypes: ["main_frame"]
        }
      };
    }).filter(rule => rule !== null); // 过滤掉null值
    
    if (rules.length === 0) {
      console.log("没有新规则需要添加");
      isUpdatingRules = false;
      return;
    }
    
    // 添加新规则
    return chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    })
    .then(() => {
      console.log(`已成功添加 ${rules.length} 条拦截规则:`, rules);
      
      // 验证规则是否真的被添加
      return chrome.declarativeNetRequest.getDynamicRules();
    })
    .then(currentRules => {
      console.log("当前活跃规则:", currentRules);
    });
  })
  .catch(error => {
    console.error("添加规则出错:", error);
  })
  .finally(() => {
    isUpdatingRules = false;
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