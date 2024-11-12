import { html } from 'hono/html';

export const renderHomePage = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-Time Chat</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f5f5; }
        .container { width: 400px; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); text-align: center; }
        #loginContainer, #chatContainer { display: none; }
        #messages { height: 300px; overflow-y: auto; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; text-align: left; }
        #messageInput { width: calc(100% - 50px); }
        #sendButton { width: 50px; }
    </style>
</head>
<body>
    <div class="container" id="loginContainer">
        <h2>Enter Your Username</h2>
        <input type="text" id="usernameInput" placeholder="Username" />
        <button id="enterChatButton">Enter Chat</button>
    </div>

    <div class="container" id="chatContainer">
        <div id="messages"></div>
        <input type="text" id="messageInput" placeholder="Type a message" />
        <button id="sendButton">Send</button>
    </div>

    <script>
        const loginContainer = document.getElementById('loginContainer');
        const chatContainer = document.getElementById('chatContainer');
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const usernameInput = document.getElementById('usernameInput');
        const enterChatButton = document.getElementById('enterChatButton');

        let ws;
        let username;

        // Show login screen and handle username submission
        loginContainer.style.display = 'block';
        enterChatButton.addEventListener('click', () => {
        username = usernameInput.value.trim();
        if (username) {
            loginContainer.style.display = 'none';
            chatContainer.style.display = 'block';
            connectWebSocket();
        }
        });

        // Initialize WebSocket connection
        function connectWebSocket() {
        const wss = document.location.protocol === "http:" ? "ws://" : "wss://";
        ws = new WebSocket(wss+ 'dev.tmsquare.net/do/chatroom/ws');

        ws.addEventListener('open', () => {
            // Send join message with username
            ws.send(JSON.stringify({ type: 'join', username: username }));
            
        });

        ws.addEventListener('message', (event) => {
            const messageElement = document.createElement('div');
            messageElement.textContent = event.data;  // Display message as-is
            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
        });
        }

        // Send message when clicking "Send" or pressing Enter
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessage();
        });

        function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText && ws.readyState === WebSocket.OPEN) {
            // Send message event with username and message
            ws.send(JSON.stringify({ type: 'message', message: messageText }));
            messageInput.value = '';  // Clear input
        }
        }
    </script>
</body>
</html>
  `;