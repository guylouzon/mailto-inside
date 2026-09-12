// Intercept mailto links and show the custom form
(function() {
  let clickPosition = { x: 0, y: 0 };
  
  document.addEventListener('click', function(e) {
    let target = e.target;
    const href = target && target.tagName === 'A' && target.href.startsWith('mailto:') ? target.href.substr(7) : null;
    while (target && target.tagName !== 'A') target = target.parentElement;
    if (target && target.tagName === 'A' && target.href.startsWith('mailto:')) {
      e.preventDefault();
      
      // Store the click position
      clickPosition.x = e.clientX;
      clickPosition.y = e.clientY;
      
      window.postMessage({ 
        type: 'SHOW_MAILTO_FORM', 
        href: target.href,
        clickX: e.clientX,
        clickY: e.clientY
      }, '*');
    }
  }, true);
  
  // Inject the form container if not present
  if (!document.getElementById('mailto-interceptor-form-container')) {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #mailto-interceptor-form-container {
        width: 698px;
        height: 431px;
      }
      .mailto-form-container{
        position: fixed;
        background: #fff;
        z-index: 9999;
        padding: 20px;
        border: 1px solid #ccc;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        box-sizing: border-box;
        width: 698px;
        height: 431px;
        resize: both;
        overflow: auto;
        transition: opacity 0.2s ease-in-out;
      }
      .mailto-form {
        display: none;
        position: relative;
        height: 100%;
      }
      .mailto-form.show {
        display: block;
      }
      .mailto-form label {
        display: block;
        margin-bottom: 1px;
      }
      .mailto-form input[type="text"],
      .mailto-form input[type="email"],
      .mailto-form input[type="password"],
      .mailto-form textarea {
        width: 100%;
        box-sizing: border-box;
        margin-top: 4px;
        margin-bottom: 0;
        display: block;
      }
      .mailto-status {
        margin-left: 10px;
      }
      .mailto-close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 28px;
        height: 28px;
        background: #e53935;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: background 0.2s;
      }
      .mailto-close-btn:hover {
        background: #b71c1c;
      }
    `;
    document.head.appendChild(style);
    
    const container = document.createElement('div');
    container.id = 'mailto-interceptor-form-container';
    container.innerHTML = `
      <form id="mailto-form" class="mailto-form mailto-form-container">
        <button type="button" id="close-btn" class="mailto-close-btn" aria-label="Close">&times;</button>
        <label>To: <input id="mailto-to" name="to" type="text" value=""></label><br>
        <label>CC: <input name="cc" type="text"></label><br>
        <label>BCC: <input name="bcc" type="text"></label><br>
        <label>Subject: <input name="subject" type="text"></label><br>
        <label>Content:<br><textarea name="body" rows="5" cols="40"></textarea></label><br>
        <button type="submit">Send</button>
        <span id="mailto-status" class="mailto-status"></span>
      </form>
    `;
    document.body.appendChild(container);
    
    // Add close button functionality
    document.getElementById('close-btn').addEventListener('click', function() {
      document.getElementById('mailto-form').classList.remove('show');
    });
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('form.js');
    document.body.appendChild(script);
  }
  
  // Function to position the form near the click location
  function positionForm(clickX, clickY) {
    const form = document.getElementById('mailto-form');
    const div0 = document.getElementById('mailto-interceptor-form-container');
    const formWidth = 698;
    const formHeight = 431;
    const padding = 20; // Distance from click point
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate initial position (offset from click point)
    let left = clickX + padding;
    let top = clickY + padding;
    
    // Adjust if form would go off-screen to the right
    if (left + formWidth > viewportWidth) {
      left = clickX - formWidth - padding;
    }
    
    // Adjust if form would go off-screen at the bottom
    if (top + formHeight > viewportHeight) {
      top = clickY - formHeight - padding;
    }
    
    // Ensure form doesn't go off-screen to the left or top
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    // Apply the position
    form.style.left = left + 'px';
    form.style.top = top + 'px';
    div0.style.left = left + 'px';
    div0.style.top = top + 'px';
  }
  
  // Listen for message to show the form
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SHOW_MAILTO_FORM') {
      console.log('Showing mailto form for:', event.data.href);
      
      const form = document.getElementById('mailto-form');
      
      // Position the form near the click location
      positionForm(event.data.clickX || 0, event.data.clickY || 0);
      
      // Show the form
      form.classList.add('show');
      
      // Dispatch the custom event for form.js
      window.dispatchEvent(new CustomEvent('show-mailto-form', {
        detail: event.data.href
      }));
    }
  });
})();