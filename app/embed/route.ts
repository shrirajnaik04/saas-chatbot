export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return new Response("Token required", { status: 400 })
  }

  // Get tenant configuration
  const config = await getTenantConfig(token)

  const embedScript = `
(function() {
  const config = ${JSON.stringify(config)};
  
  // Create chatbot container
  const chatContainer = document.createElement('div');
  chatContainer.id = 'ai-chatbot-container';
  chatContainer.innerHTML = \`
    <div id="chatbot-bubble" style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: \${config.primaryColor};
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: all 0.3s ease;
    ">
      <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04.97 4.37L1 23l6.63-1.97C9.96 21.64 11.46 22 13 22h7c1.1 0 2-.9 2-2V12c0-5.52-4.48-10-10-10z"/>
      </svg>
    </div>
    
    <div id="chatbot-window" style="
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      display: none;
      flex-direction: column;
      z-index: 1001;
      overflow: hidden;
    ">
      <div style="
        background: \${config.primaryColor};
        color: white;
        padding: 16px;
        font-weight: 600;
      ">
        \${config.botName}
      </div>
      
      <div id="chat-messages" style="
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #f9fafb;
      ">
        <div style="
          background: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        ">
          \${config.welcomeMessage}
        </div>
      </div>
      
      <div style="
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: white;
      ">
        <div style="display: flex; gap: 8px;">
          <input 
            id="chat-input" 
            type="text" 
            placeholder="Type your message..."
            style="
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              outline: none;
            "
          />
          <button 
            id="send-button"
            style="
              background: \${config.primaryColor};
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
            "
          >
            Send
          </button>
        </div>
      </div>
    </div>
  \`;
  
  document.body.appendChild(chatContainer);
  
  // Event listeners
  const bubble = document.getElementById('chatbot-bubble');
  const window = document.getElementById('chatbot-window');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messagesContainer = document.getElementById('chat-messages');
  
  let isOpen = false;
  
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    window.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      input.focus();
    }
  });
  
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = \`
      background: \${config.primaryColor};
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      margin-left: 20%;
      text-align: right;
    \`;
    userMsg.textContent = message;
    messagesContainer.appendChild(userMsg);
    
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Send to API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          token: '${token}'
        })
      });
      
      const reader = response.body.getReader();
      const botMsg = document.createElement('div');
      botMsg.style.cssText = \`
        background: white;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        margin-right: 20%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      \`;
      messagesContainer.appendChild(botMsg);
      
      let botResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                botResponse += data.choices[0].delta.content;
                botMsg.textContent = botResponse;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = \`
        background: #fee2e2;
        color: #dc2626;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 8px;
        margin-right: 20%;
      \`;
      errorMsg.textContent = 'Sorry, I encountered an error. Please try again.';
      messagesContainer.appendChild(errorMsg);
    }
  }
  
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
})();
  `

  return new Response(embedScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

async function getTenantConfig(token: string) {
  // Mock configuration - in real app, fetch from database
  return {
    botName: "AI Assistant",
    welcomeMessage: "Hello! How can I help you today?",
    primaryColor: "#3B82F6",
  }
}
