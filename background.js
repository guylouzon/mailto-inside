// Handles background logic for sending email via Gmail API
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'SEND_EMAIL') {
    try {
      // Get OAuth token
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
          if (chrome.runtime.lastError || !token) reject(chrome.runtime.lastError);
          else resolve(token);
        });
      });
      // Build raw email
      const email = message.email;
      let headers = '';
      headers += `To: ${email.to}\r\n`;
      if (email.cc) headers += `Cc: ${email.cc}\r\n`;
      if (email.bcc) headers += `Bcc: ${email.bcc}\r\n`;
      headers += `Subject: ${email.subject}\r\n`;
      headers += 'Content-Type: text/plain; charset="UTF-8"\r\n';
      const raw = btoa(unescape(encodeURIComponent(headers + '\r\n' + email.body))).replace(/\+/g, '-').replace(/\//g, '_');
      // Send email via Gmail API
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      sendResponse({ success: res.ok });
    } catch (e) {
      sendResponse({ success: false, error: e.toString() });
    }
    return true; // Keep the message channel open for async response
  }
});

// In your extension's background script
chrome.identity.getAuthToken({ interactive: false }, function(token) {
  if (token) {
    // User is already logged in, use token for Gmail API
    sendEmailWithToken(token);
  } else {
    // Prompt user to sign in
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      sendEmailWithToken(token);
    });
  }
});

function sendEmailWithToken(token) {
  fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: btoa(emailContent) // Base64 encoded email
    })
  });
}
