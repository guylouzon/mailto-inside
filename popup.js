document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enabled-toggle');
  chrome.storage.local.get({ enabled: true }, (res) => {
    toggle.checked = res.enabled;
  });
  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: toggle.checked });
  });
});