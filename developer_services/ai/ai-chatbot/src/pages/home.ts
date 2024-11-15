import { html } from 'hono/html';

export const homePage = () => html`
 <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tmsquare AI Text Generator</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(to right, #4a00e0, #8e2de2);
          color: #fff;
          padding: 20px;
        }

        .container {
          max-width: 600px;
          width: 100%;
          background: #ffffff;
          color: #333;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        h1 {
          margin-bottom: 1.5rem;
          font-size: 2rem;
          color: #4a00e0;
        }

        textarea {
          width: 100%;
          height: 200px;
          padding: 15px;
          margin: 20px 0;
          border-radius: 10px;
          border: 1px solid #ddd;
          font-size: 1rem;
          transition: border-color 0.3s, box-shadow 0.3s;
          resize: vertical;
          background: #f9f9f9;
        }

        textarea:focus {
          border-color: #8e2de2;
          outline: none;
          box-shadow: 0 0 8px rgba(142, 45, 226, 0.3);
        }

        button {
          width: 100%;
          padding: 15px;
          font-size: 1.1rem;
          font-weight: bold;
          color: #ffffff;
          background-color: #8e2de2;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        button:hover {
          background-color: #682ae9;
        }

        #response {
          margin-top: 20px;
          padding: 20px;
          background: #f3f4f7;
          border-radius: 10px;
          color: #333;
          font-size: 1rem;
          line-height: 1.6;
          text-align: left;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 600px) {
          h1 {
            font-size: 1.5rem;
          }
          
          button, textarea {
            font-size: 1rem;
          }

          .container {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Tmsquare AI</h1>
        <textarea id="prompt" placeholder="Enter your prompt here..."></textarea>
        <button id="submit">Generate Text</button>
        <div id="response">Response will appear here...</div>
      </div>
      
      <script>
        document.getElementById('submit').addEventListener('click', async () => {
          const prompt = document.getElementById('prompt').value;
          const responseDiv = document.getElementById('response');
        
          if (!prompt) {
            responseDiv.innerText = 'Please enter a prompt.';
            return;
          }

          responseDiv.innerText = 'Generating response...';

          try {
            const res = await fetch('/ai/gateway/prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            responseDiv.innerText = data.reply || 'No response from AI';
          } catch (error) {
            console.error(error);
            responseDiv.innerText = 'Error communicating with the AI.';
          }
        });
      </script>
    </body>
    </html>
`;