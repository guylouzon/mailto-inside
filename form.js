// Handles the mailto form logic, parsing, and sending
function parseMailto(href) {
  const url = new URL(href); // Use the URL constructor to parse the href.replace('mailto:', 'mailto://'));
  console.log('Parsing mailto URL:', url.href); // Add this for debugging
  const params = Object.fromEntries(url.searchParams.entries());
  console.log('Parsed mailto params:', params); // Add this for debugging
  console.log(decodeURIComponent(url.pathname || '')); // Add this for debugging
  return {
    to: decodeURIComponent(url.pathname || ''),
    cc: params.cc || '',
    bcc: params.bcc || '',
    subject: params.subject || '',
    body: params.body || ''
  };
}

function showForm(data) {
  const form = document.getElementById('mailto-form');
  form.style.display = 'block';
  form.to.value = data.to;
  form.cc.value = data.cc;
  form.bcc.value = data.bcc;
  form.subject.value = data.subject;
  form.body.value = data.body;
}

window.addEventListener('show-mailto-form', function(e) {
  const data = parseMailto(e.detail);
  showForm(data);
});

document.getElementById('close-btn').onclick = function() {
  document.getElementById('mailto-form').style.display = 'none';
};

document.getElementById('mailto-form').onsubmit = async function(e) {
  e.preventDefault();
  document.getElementById('mailto-status').textContent = 'Sending...';
  const email = {
    to: this.to.value,
    cc: this.cc.value,
    bcc: this.bcc.value,
    subject: this.subject.value,
    body: this.body.value
  };
  chrome.runtime.sendMessage({ type: 'SEND_EMAIL', email }, function(response) {
    if (response && response.success) {
      document.getElementById('mailto-status').textContent = 'Email sent!';
    } else {
      document.getElementById('mailto-status').textContent = 'Failed to send email.';
    }
  });
};
