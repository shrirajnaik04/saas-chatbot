import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const embedScript = `
(function() {
    'use strict';
    
    console.log('🤖 Secure Chatbot Embed Loading...');
    
    // Get tenant ID from meta tag
    const tenantMeta = document.querySelector('meta[name="chatbot-tenant-id"]');
    if (!tenantMeta) {
        console.error('❌ Chatbot: No tenant ID found in meta tag');
        return;
    }
    
    const tenantId = tenantMeta.getAttribute('content');
    console.log('🔑 Tenant ID:', tenantId);
    
    let chatWidget = null;
    let chatContainer = null;
    let isOpen = false;
    let isInitialized = false;
    let jwtToken = null;
    
    // Initialize the chatbot
    async function initializeChatbot() {
        try {
            console.log('🚀 Initializing secure chatbot...');
            
            // Get JWT token from backend
            const response = await fetch('/api/chatbot/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tenantId: tenantId,
                    domain: window.location.hostname 
                })
            });
            
            if (!response.ok) {
                throw new Error(\`Failed to initialize: \${response.status}\`);
            }
            
            const data = await response.json();
            jwtToken = data.token;
            
            console.log('✅ Chatbot initialized successfully');
            
            // Create the widget UI
            createChatWidget(data.config || {});
            isInitialized = true;
            
        } catch (error) {
            console.error('❌ Chatbot initialization failed:', error);
            // Show error widget
            createErrorWidget(error.message);
        }
    }
    
    // Create the main chat widget
    function createChatWidget(config) {
        const widgetHTML = \`
            <div id="chatbot-widget" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <!-- Chat Button -->
                <button id="chat-toggle" style="
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, \${config.primaryColor || '#3B82F6'} 0%, \${config.secondaryColor || '#1E40AF'} 100%);
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                ">
                    💬
                </button>
                
                <!-- Chat Container -->
                <div id="chat-container" style="
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, \${config.primaryColor || '#3B82F6'} 0%, \${config.secondaryColor || '#1E40AF'} 100%);
                        color: white;
                        padding: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h3 style="margin: 0; font-size: 16px;">\${config.botName || 'AI Assistant'}</h3>
                            <p style="margin: 0; font-size: 12px; opacity: 0.9;">Online</p>
                        </div>
                        <button id="chat-close" style="
                            background: none;
                            border: none;
                            color: white;
                            font-size: 20px;
                            cursor: pointer;
                            padding: 0;
                            width: 24px;
                            height: 24px;
                        ">×</button>
                    </div>
                    
                    <!-- Messages Area -->
                    <div id="chat-messages" style="
                        flex: 1;
                        padding: 16px;
                        overflow-y: auto;
                        background: #f8f9fa;
                    ">
                        <div style="
                            background: white;
                            padding: 12px;
                            border-radius: 8px;
                            margin-bottom: 12px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        ">
                            \${config.welcomeMessage || 'Hello! How can I help you today?'}
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="
                        padding: 16px;
                        border-top: 1px solid #e5e7eb;
                        background: white;
                    ">
                        <div style="display: flex; gap: 8px;">
                            <input 
                                type="text" 
                                id="chat-input" 
                                placeholder="Type your message..."
                                style="
                                    flex: 1;
                                    padding: 10px 12px;
                                    border: 1px solid #d1d5db;
                                    border-radius: 6px;
                                    outline: none;
                                    font-size: 14px;
                                "
                            />
                            <button 
                                id="chat-send"
                                style="
                                    background: \${config.primaryColor || '#3B82F6'};
                                    color: white;
                                    border: none;
                                    padding: 10px 16px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                "
                            >Send</button>
                        </div>
                    </div>
                </div>
            </div>
        \`;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Add event listeners
        document.getElementById('chat-toggle').addEventListener('click', toggleChat);
        document.getElementById('chat-close').addEventListener('click', toggleChat);
        document.getElementById('chat-send').addEventListener('click', sendMessage);
        document.getElementById('chat-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Create error widget
    function createErrorWidget(errorMessage) {
        const errorHTML = \`
            <div id="chatbot-widget" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <button style="
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #EF4444;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                " title="Chatbot Error: \${errorMessage}">
                    ⚠️
                </button>
            </div>
        \`;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }
    
    // Toggle chat visibility
    function toggleChat() {
        const container = document.getElementById('chat-container');
        isOpen = !isOpen;
        container.style.display = isOpen ? 'flex' : 'none';
        
        if (isOpen) {
            document.getElementById('chat-input').focus();
        }
    }
    
    // Send message
    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || !jwtToken) {
            console.log('❌ Cannot send message: empty message or no token');
            return;
        }
        
        // Add user message to chat
        addMessage(message, 'user');
        input.value = '';
        
        // Add loading indicator
        const loadingId = addMessage('Thinking...', 'bot', true);
        
        try {
            console.log('📤 Sending message:', message);
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${jwtToken}\`
                },
                body: JSON.stringify({ message: message })
            });
            
            console.log('📥 Chat response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Chat API error:', response.status, errorText);
                throw new Error(\`Chat failed: \${response.status} - \${errorText}\`);
            }
            
            const data = await response.json();
            console.log('✅ Chat response:', data);
            
            // Remove loading indicator and add response
            removeMessage(loadingId);
            addMessage(data.response || 'Sorry, I received an empty response.', 'bot');
            
        } catch (error) {
            console.error('❌ Chat error:', error);
            removeMessage(loadingId);
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }
    
    // Add message to chat
    function addMessage(text, sender, isLoading = false) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageId = 'msg-' + Date.now();
        
        const messageHTML = \`
            <div id="\${messageId}" style="
                margin-bottom: 12px;
                display: flex;
                \${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
            ">
                <div style="
                    max-width: 80%;
                    padding: 12px;
                    border-radius: 8px;
                    \${sender === 'user' 
                        ? 'background: #3B82F6; color: white; border-bottom-right-radius: 4px;'
                        : 'background: white; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px;'
                    }
                    \${isLoading ? 'opacity: 0.7;' : ''}
                ">
                    \${text}
                </div>
            </div>
        \`;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageId;
    }
    
    // Remove message from chat
    function removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) message.remove();
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbot);
    } else {
        initializeChatbot();
    }
    
    console.log('✅ Secure Chatbot Embed Loaded');
})();
`;

  return new NextResponse(embedScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache',
    },
  })
}
