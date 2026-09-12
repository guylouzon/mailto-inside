document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enabled-toggle');
  chrome.storage.sync.get({ enabled: true }, (res) => {
    toggle.checked = res.enabled;
  });
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
  });
});
