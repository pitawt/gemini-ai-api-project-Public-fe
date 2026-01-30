const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

let conversationHistory = [];
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  conversationHistory.push({ role: 'user', content: userMessage });

  const loadingId = appendMessage('bot', '...');
  const loadingElement = document.getElementById(loadingId);

  try {
    console.log('Sending conversation:', conversationHistory);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: conversationHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Terjadi kesalahan saat memproses permintaan');
    }

    const data = await response.json();

    if (loadingElement) {
      chatBox.removeChild(loadingElement);
    }

    appendMessage('bot', data.result);

    conversationHistory.push({ role: 'model', content: data.result });

  } catch (error) {
    console.error('Error:', error);
    
    if (loadingElement) {
      chatBox.removeChild(loadingElement);
    }

    appendMessage('bot', `Error: ${error.message}`);
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  if (text === '...') {
    const loadingId = 'loading-' + Date.now();
    msg.id = loadingId;
    msg.textContent = '💬 Gemini sedang mengetik...';
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return loadingId;
  }

  if (sender === 'bot') {
    msg.innerHTML = text;
  } else {
    msg.textContent = text;
  }
  
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  return null;
}