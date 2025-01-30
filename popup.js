document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const domainInput = document.getElementById('domainInput');
  const addButton = document.getElementById('addButton');
  const blocklist = document.getElementById('blocklist');
  
  let enabled = true;
  let blockedDomains = [];

  const init = async () => {
    const result = await chrome.storage.local.get(['enabled', 'blockedDomains']);
    enabled = result.enabled ?? true;
    blockedDomains = result.blockedDomains ?? [];
    toggle.checked = enabled;
    renderBlocklist();
  };

  const handleAddDomain = async () => {
    const domain = domainInput.value
      .trim()
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/\/+$/, '');

    if (!domain || !isValidDomain(domain)) return;

    if (!blockedDomains.includes(domain)) {
      blockedDomains = [...blockedDomains, domain];
      domainInput.value = '';
      await chrome.storage.local.set({ blockedDomains });
      renderBlocklist();
      if (enabled) chrome.runtime.sendMessage({ action: 'forceUpdate' });
    }
  };

  const handleRemoveDomain = async (domain) => {
    blockedDomains = blockedDomains.filter(d => d !== domain);
    await chrome.storage.local.set({ blockedDomains });
    renderBlocklist();
    if (enabled) chrome.runtime.sendMessage({ action: 'forceUpdate' });
  };

  const renderBlocklist = () => {
    blocklist.innerHTML = blockedDomains.map(domain => `
      <li data-domain="${domain}">
        <span>${domain}</span>
        <button type="button" class="remove-btn">Remove</button>
      </li>
    `).join('');
  };

  const isValidDomain = (domain) => {
    return /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/i.test(domain);
  };

  // Event Listeners
  domainInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') await handleAddDomain();
  });

  addButton.addEventListener('click', handleAddDomain);

  toggle.addEventListener('change', async () => {
    enabled = toggle.checked;
    await chrome.storage.local.set({ enabled });
    chrome.runtime.sendMessage({ action: 'forceUpdate' });
  });

  blocklist.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const domain = e.target.closest('li').dataset.domain;
      handleRemoveDomain(domain);
    }
  });

  init();
});