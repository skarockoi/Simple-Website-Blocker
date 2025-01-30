let enabled = true;
let blockedDomains = [];

const generateRuleId = (domain) => {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 2147483647);
};

const loadState = async () => {
  const result = await chrome.storage.local.get(['enabled', 'blockedDomains']);
  enabled = result.enabled ?? true;
  blockedDomains = result.blockedDomains ?? [];
};

const updateRules = async () => {
  await loadState();
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  
  if (enabled) {
    const newRules = blockedDomains.map(domain => ({
      id: generateRuleId(domain),
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest', 'media', 'websocket', 'other']
      }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: currentRules.map(rule => rule.id),
      addRules: newRules
    });
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: currentRules.map(rule => rule.id),
      addRules: []
    });
  }
};

// Listeners
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.enabled || changes.blockedDomains) {
    await loadState();
    await updateRules();
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'forceUpdate') updateRules();
  return true;
});

// Initialization
loadState();
updateRules();