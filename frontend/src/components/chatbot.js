document.addEventListener('DOMContentLoaded', () => {
    const chatbotWidget = document.createElement('div');
    chatbotWidget.className = 'chatbot-widget';
    chatbotWidget.innerHTML = `
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <div class="chat-status">
                    <span class="status-dot"></span>
                    <span>SECURE_TERMINAL // AI_ASSISTANT</span>
                </div>
                <button id="closeChat" style="background:none; border:none; color:white; cursor:pointer;">[X]</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">
                    > CONNECTION_ESTABLISHED...<br>
                    > INITIALIZING_ASSISTANT...<br>
                    > System: How can I assist you with Hamza's portfolio today?
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chatInput" placeholder="Enter command...">
                <button class="send-btn" id="sendBtn">SEND</button>
            </div>
        </div>
        <button class="chatbot-toggle" id="chatToggle" title="Terminal Access">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
        </button>
    `;

    document.body.appendChild(chatbotWidget);

    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');

    let messageHistory = [];

    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        chatbotWidget.classList.toggle('chat-open', chatWindow.classList.contains('active'));
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        chatbotWidget.classList.remove('chat-open');
    });

    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        messageHistory.push({ role: 'user', content: text });

        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai';
        loadingDiv.innerHTML = '> PROCESSING...';
        chatMessages.appendChild(loadingDiv);

        try {
            // Call backend chatbot API
            const response = await fetch(`${API_URL}/chatbot/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            chatMessages.removeChild(loadingDiv);
            
            if (data.success && data.message) {
                addMessage(`> ${data.message}`, 'ai');
                messageHistory.push({ role: 'assistant', content: data.message });
            } else {
                const errorMsg = data.message || 'Unknown error occurred';
                addMessage(`> ERROR: ${errorMsg}`, 'ai');
                console.error('API Error:', errorMsg);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            if (chatMessages.contains(loadingDiv)) {
                chatMessages.removeChild(loadingDiv);
            }
            addMessage('> CONNECTION ERROR: Unable to reach AI service', 'ai');
        }
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
