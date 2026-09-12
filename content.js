// Mailto to Gmail — content script
// Intercepts mailto: links, shows a small compose form, and hands the
// message off to Gmail's web compose URL. No API calls, no OAuth,
// nothing is ever transmitted by this extension itself.
(function () {
  'use strict';

  const CONTAINER_ID = 'm2g-form-container';
  let enabled = true;

  // Load the on/off preference and keep it in sync with the popup toggle.
  if (chrome?.storage?.sync) {
    chrome.storage.sync.get({ enabled: true }, (res) => {
      enabled = res.enabled;
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.enabled) {
        enabled = changes.enabled.newValue;
      }
    });
  }

  function parseMailto(href) {
    try {
      const url = new URL(href);
      const params = Object.fromEntries(url.searchParams.entries());
      return {
        to: decodeURIComponent(url.pathname || ''),
        cc: params.cc || '',
        bcc: params.bcc || '',
        subject: params.subject || '',
        body: params.body || ''
      };
    } catch (e) {
      // Malformed mailto href — fall back to a best-effort strip of the scheme.
      return {
        to: href.replace(/^mailto:/i, '').split('?')[0],
        cc: '',
        bcc: '',
        subject: '',
        body: ''
      };
    }
  }

  function isLikelyValidRecipients(value) {
    if (!value) return false;
    return value
      .split(',')
      .every((addr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.trim()));
  }

  function buildGmailComposeUrl({ to, cc, bcc, subject, body }) {
    const params = new URLSearchParams();
    params.set('view', 'cm');
    params.set('fs', '1');
    if (to) params.set('to', to);
    if (cc) params.set('cc', cc);
    if (bcc) params.set('bcc', bcc);
    if (subject) params.set('su', subject);
    if (body) params.set('body', body);
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  function ensureForm() {
    let container = document.getElementById(CONTAINER_ID);
    if (container) return container;

    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'm2g-container';
    container.innerHTML = `
      <form class="m2g-form">
        <button type="button" class="m2g-close" aria-label="Close">&times;</button>
        <label>To
          <input type="text" name="to" autocomplete="off" required>
        </label>
        <label>Cc
          <input type="text" name="cc" autocomplete="off">
        </label>
        <label>Bcc
          <input type="text" name="bcc" autocomplete="off">
        </label>
        <label>Subject
          <input type="text" name="subject" autocomplete="off">
        </label>
        <label>Message
          <textarea name="body" rows="6"></textarea>
        </label>
        <div class="m2g-actions">
          <button type="submit">Open in Gmail</button>
          <span class="m2g-status"></span>
        </div>
      </form>
    `;
    document.documentElement.appendChild(container);

    const form = container.querySelector('form');
    container.querySelector('.m2g-close').addEventListener('click', () => hideForm(container));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = container.querySelector('.m2g-status');
      const data = {
        to: form.to.value.trim(),
        cc: form.cc.value.trim(),
        bcc: form.bcc.value.trim(),
        subject: form.subject.value.trim(),
        body: form.body.value
      };
      if (!isLikelyValidRecipients(data.to)) {
        status.textContent = 'Enter a valid "To" address.';
        status.classList.add('m2g-error');
        return;
      }
      status.classList.remove('m2g-error');
      // window.open with an explicit https URL — no fetch, no token,
      // nothing sent through the extension. The browser just navigates
      // a new tab to Gmail's own compose page.
      window.open(buildGmailComposeUrl(data), '_blank', 'noopener,noreferrer');
      status.textContent = 'Opened in Gmail.';
    });

    return container;
  }

  function positionForm(container, x, y) {
    const width = 340;
    const height = 400;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x + 16;
    let top = y + 16;
    if (left + width > vw) left = x - width - 16;
    if (top + height > vh) top = y - height - 16;
    left = Math.max(8, left);
    top = Math.max(8, top);
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
  }

  function showForm(href, x, y) {
    const container = ensureForm();
    const data = parseMailto(href);
    const form = container.querySelector('form');
    form.to.value = data.to;
    form.cc.value = data.cc;
    form.bcc.value = data.bcc;
    form.subject.value = data.subject;
    try {
      form.body.value = decodeURIComponent(data.body || '');
    } catch (e) {
      form.body.value = data.body || '';
    }
    const status = container.querySelector('.m2g-status');
    status.textContent = '';
    status.classList.remove('m2g-error');
    positionForm(container, x, y);
    container.classList.add('m2g-show');
  }

  function hideForm(container) {
    container.classList.remove('m2g-show');
  }

  document.addEventListener(
    'click',
    function (e) {
      if (!enabled) return;
      let target = e.target;
      while (target && target.tagName !== 'A') target = target.parentElement;
      if (target && target.href && target.href.toLowerCase().startsWith('mailto:')) {
        e.preventDefault();
        showForm(target.href, e.clientX, e.clientY);
      }
    },
    true
  );

  // Click-away to dismiss the form.
  document.addEventListener('click', function (e) {
    const container = document.getElementById(CONTAINER_ID);
    if (container && container.classList.contains('m2g-show') && !container.contains(e.target)) {
      hideForm(container);
    }
  });
})();
