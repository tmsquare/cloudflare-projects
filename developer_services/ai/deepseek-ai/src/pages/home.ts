import { html } from 'hono/html';

export const homePage = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tmsquare Deepseek</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }

    body {
      display: flex;
      flex-direction: row;
      min-height: 100vh;
      background: linear-gradient(to right, #e00000, #e22d2d);
      color: #fff;
    }

    .sidebar {
      width: 250px;
      background-color: #3a0070;
      padding: 20px;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }

    .welcomeText {
      width: 250px;
      background-color: #cd0d0d;
      padding: 20px;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
    }

    .sidebar h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .sidebar ul {
      list-style: none;
      padding: 0;
    }

    .sidebar ul li {
      margin-bottom: 10px;
      font-size: 1rem;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      color: #333;
    }

    .response-area {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      border-bottom: 1px solid #ddd;
    }

    .response-area .question {
      font-weight: bold;
      color: #e00000;
    }

    .response-area .answer {
      margin-bottom: 20px;
      color: #333;
    }

    h1 {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
      font-size: 2rem;
      color: #e00000;
      text-align: center; 
    }

   .input-area {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      background: #e00000;
      border-top: 1px solid #ddd;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
    }

    .input-area textarea {
      width: 100%;
      height: 50px;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px;
      font-size: 1rem;
      resize: none;
    }

    button {
      width: auto;
      padding: 8px 14px; 
      font-size: 1rem; 
      font-weight: normal;
      color: #e92a2a;
      background-color: rgb(254, 254, 254);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s;
      margin: 3px;
    }

    button:hover {
      background-color:rgb(142, 104, 224);
    }

    .buttons-container {
      display: flex;
      justify-content: center;
      gap: 10px;
    }


    .recording {
      background-color: red !important;
    }

    .response-area {
      padding: 20px;
      margin-bottom: 70px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    }

    #response img {
      max-width: 100%;
      height: auto;
      margin-top: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 200px;
      }

      .input-area textarea {
        height: 50px;
      }
    }
    
    @media (max-width: 600px) {
    button {
      padding: 4px 8px;
      font-size: 0.7rem;
      margin: 2px;
    }

    .buttons-container {
      gap: 4px;
    }
  }
  </style>
</head>
<body>

  <div class="main-content">
    <h1>Tmsquare Deepseek</h1>
    <div class="response-area" id="response">
    </div>

    <div class="input-area">
      <textarea id="prompt" placeholder="Enter your prompt here..."></textarea>
     <div class="buttons-container">
      <button id="send-btn">Send</button>
    </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    const sendButton = document.getElementById('send-btn');
    const generateImageButton = document.getElementById('generate-image-btn');
    const recordButton = document.getElementById('record-btn');
    const promptInput = document.getElementById('prompt');
    const responseDiv = document.getElementById('response');

    sendButton?.addEventListener('click', async () => {
      const prompt = promptInput?.value;

      if (!prompt) {
        responseDiv?.insertAdjacentHTML('beforeend', '<p>Please enter a prompt.</p>');
        responseDiv?.scrollTo(0, responseDiv.scrollHeight);
        return;
      }

      // Append the user's question to the UI
      responseDiv?.insertAdjacentHTML(
        'beforeend',
        \`<p class="question">Q: \${prompt}</p>\`
      );
      document.getElementById('prompt').value = '';
      responseDiv?.scrollTo(0, responseDiv.scrollHeight);

      responseDiv?.insertAdjacentHTML(
        'beforeend',
        '<p class="answer"><em></em></p>'
      );
      responseDiv?.scrollTo(0, responseDiv.scrollHeight);

      try {
        const res = await fetch('/ai/deepseek/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!res.body) {
          responseDiv.innerText = 'No response from AI.';
          return;
        }

        // Read the streamed response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });

          // Parse the string which looks like: data: {"response":"Hello","p":"abcdefghijklmnopqrstuvwxyz0123456789abc"}
          const jsonString = chunk.slice(6).trim();
          try {
            const data = JSON.parse(jsonString);

            // Check if the last response paragraph exists
            let lastAnswer = responseDiv.querySelector('.answer:last-of-type');
            if (!lastAnswer) {
              // Create a new paragraph if one doesn't exist
              lastAnswer = document.createElement('p');
              lastAnswer.classList.add('answer');
              responseDiv.appendChild(lastAnswer);
            }

            // Append the new text to the existing paragraph
            lastAnswer.textContent += data.response;

            // Scroll to the bottom to ensure the latest text is visible
            responseDiv.scrollTo(0, responseDiv.scrollHeight);
          } catch (error) {
            console.log('Done');
          }
        }

      } catch (error) {
        console.error(error);
        //responseDiv.innerText = 'Error communicating with the AI.';
        responseDiv?.insertAdjacentHTML('beforeend', '<p class="answer">Error: Unable to communicate with the server.</p>');
      }
      responseDiv?.scrollTo(0, responseDiv.scrollHeight);
    });




    // Function to handle image generation
    generateImageButton?.addEventListener('click', async () => {
      const prompt = promptInput?.value;

      if (!prompt) {
        responseDiv?.insertAdjacentHTML('beforeend', '<p>Please enter a prompt.</p>');
        responseDiv?.scrollTo(0, responseDiv.scrollHeight);
        return;
      }

      // Append the user's question to the UI
      responseDiv?.insertAdjacentHTML(
        'beforeend',
         \`<p class="question">Q: \${prompt}</p>\`
      );
      document.getElementById('prompt').value = '';
      responseDiv?.scrollTo(0, responseDiv.scrollHeight);

      responseDiv?.insertAdjacentHTML(
        'beforeend',
        '<p class="answer"><em></em></p>'
      );
      responseDiv?.scrollTo(0, responseDiv.scrollHeight);

      try {
        const res = await fetch('/ai/chatbot/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const imageURL = URL.createObjectURL(blob);
          // Append the generated image to the UI
          responseDiv?.insertAdjacentHTML(
            'beforeend',
            \`<img src="\${imageURL}" alt="Generated Image" />\`
          );
        } else {
          responseDiv?.insertAdjacentHTML(
            'beforeend',
            '<p class="answer">Error: Unable to generate image.</p>'
          );
        }
      } catch (error) {
        console.error(error);
        responseDiv?.insertAdjacentHTML(
          'beforeend',
          '<p class="answer">Error: Unable to communicate with the server.</p>'
        );
      }

      responseDiv?.scrollTo(0, responseDiv.scrollHeight);
    });



    // Record voice
    let mediaRecorder;
    let audioChunks = [];

    recordButton?.addEventListener('mousedown', startRecording);
    recordButton?.addEventListener('mouseup', stopRecording);
    recordButton?.addEventListener('touchstart', startRecording);
    recordButton?.addEventListener('touchend', stopRecording);

    async function startRecording() {
      try {
        recordButton.classList.add('recording');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.start();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        responseDiv?.insertAdjacentHTML(
          'beforeend',
          '<p class="answer">Error: Unable to access microphone.</p>'
        );
      }
    }

    function stopRecording() {
      recordButton.classList.remove('recording');

      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          sendVoice(audioBlob);
        };
      }
    }

    async function sendVoice(audioBlob) {
      responseDiv?.insertAdjacentHTML(
        'beforeend',
        '<p class="answer"><em></em></p>'
      );

      try {
        const res = await fetch('/ai/chatbot/send-voice', {
          method: 'POST',
          body: audioBlob,
        });

        if (!res.body) {
          responseDiv?.insertAdjacentHTML(
            'beforeend',
            '<p class="answer">Error: No response from server.</p>'
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        responseDiv?.insertAdjacentHTML('beforeend', '<p>Q: [Voice input]</p>');

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });

          // Parse the string which looks like: data: {"response":"Hello","p":"abcdefghijklmnopqrstuvwxyz0123456789abc"}
          const jsonString = chunk.slice(6).trim();
          try {
            const data = JSON.parse(jsonString);

            // Check if the last response paragraph exists
            let lastAnswer = responseDiv.querySelector('.answer:last-of-type');
            if (!lastAnswer) {
              // Create a new paragraph if one doesn't exist
              lastAnswer = document.createElement('p');
              lastAnswer.classList.add('answer');
              responseDiv.appendChild(lastAnswer);
            }

            // Append the new text to the existing paragraph
            lastAnswer.textContent += data.response;

            // Scroll to the bottom to ensure the latest text is visible
            responseDiv.scrollTo(0, responseDiv.scrollHeight);
          } catch (error) {
            console.log('Done');
          }
        }
      } catch (error) {
        console.error('Error sending voice input:', error);
        responseDiv?.insertAdjacentHTML(
          'beforeend',
          '<p class="answer">Error: Unable to communicate with the server.</p>'
        );
      }
    }


  </script>

</body>
</html>

`;