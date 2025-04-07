import { html } from 'hono/html';

export const homePage = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tmsquare CF Autorag</title>
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
      background: linear-gradient(to right, #4a00e0, #8e2de2);
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
      background-color: #3a0070;
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
      color: #4a00e0;
    }

    .response-area .answer {
      margin-bottom: 20px;
      color: #333;
    }

    h1 {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
      font-size: 2rem;
      color: #4a00e0;
      text-align: center; 
    }

   .input-area {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      background: #4a00e0;
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
      color: #682ae9;
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

    /* Styles for AI search results */
    .source-document {
      margin-top: 15px;
      padding: 12px;
      background-color: #f5f5ff;
      border-radius: 8px;
      border-left: 4px solid #4a00e0;
    }

    .source-document-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .source-document-title {
      font-weight: bold;
      color: #4a00e0;
    }

    .source-document-score {
      font-size: 0.85rem;
      color: #666;
    }

    .source-document-content {
      font-size: 0.95rem;
      color: #333;
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
    <h1>Tmsquare CF Autorag</h1>
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
    const promptInput = document.getElementById('prompt');
    const responseDiv = document.getElementById('response');

    // Function to render Markdown text
    function renderMarkdown(text) {
      return marked.parse(text);
    }

    // Function to display AI search results in a nice format
    function displayAISearchResults(data) {
      // Create elements for the AI response
      const answerElement = document.createElement('div');
      answerElement.classList.add('answer');
      
      // Add the main response with markdown rendering
      if (data.response) {
        const responseContent = document.createElement('div');
        responseContent.innerHTML = renderMarkdown(data.response);
        answerElement.appendChild(responseContent);
      }
      
      // Add source documents if available
      if (data.data && data.data.length > 0) {
        const sourcesTitle = document.createElement('h4');
        sourcesTitle.textContent = 'Sources:';
        sourcesTitle.style.marginTop = '15px';
        sourcesTitle.style.color = '#4a00e0';
        answerElement.appendChild(sourcesTitle);
        
        // Create elements for each source document
        data.data.forEach(doc => {
          const sourceElement = document.createElement('div');
          sourceElement.classList.add('source-document');
          
          // Add header with filename and score
          const headerElement = document.createElement('div');
          headerElement.classList.add('source-document-header');
          
          const titleElement = document.createElement('div');
          titleElement.classList.add('source-document-title');
          titleElement.textContent = doc.filename || 'Unknown source';
          
          const scoreElement = document.createElement('div');
          scoreElement.classList.add('source-document-score');
          scoreElement.textContent = \`Relevance: \${(doc.score * 100).toFixed(0)}%\`;
          
          headerElement.appendChild(titleElement);
          headerElement.appendChild(scoreElement);
          sourceElement.appendChild(headerElement);
          
          // Add content from the document
          if (doc.content && doc.content.length > 0) {
            const contentElement = document.createElement('div');
            contentElement.classList.add('source-document-content');
            
            // Format content appropriately based on the data structure
            if (Array.isArray(doc.content)) {
              // Handle Array content
              const contentText = doc.content.map(item => {
                if (typeof item === 'object' && item.text) {
                  return item.text;
                } else if (typeof item === 'string') {
                  return item;
                }
                return '';
              }).join('\\n');
              
              contentElement.textContent = contentText;
            } else if (typeof doc.content === 'string') {
              contentElement.textContent = doc.content;
            }
            
            sourceElement.appendChild(contentElement);
          }
          
          answerElement.appendChild(sourceElement);
        });
      }
      
      return answerElement;
    }

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
      
      // Add loading indicator
      const loadingElement = document.createElement('p');
      loadingElement.classList.add('answer');
      loadingElement.innerHTML = '<em>Searching for information...</em>';
      responseDiv.appendChild(loadingElement);
      
      responseDiv?.scrollTo(0, responseDiv.scrollHeight);

      try {
        const res = await fetch('/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        // Remove the loading indicator
        responseDiv.removeChild(loadingElement);

        if (!res.ok) {
          responseDiv?.insertAdjacentHTML(
            'beforeend', 
            '<p class="answer">Error: Unable to get a response from the server.</p>'
          );
          return;
        }

        const data = await res.json();
        
        // Check if we have a valid AI search response
        if (data.object === 'vector_store.search_results.page') {
          // Use our specialized function to display AI search results
          const aiResultElement = displayAISearchResults(data);
          responseDiv.appendChild(aiResultElement);
        } else if (data.success === true && data.result) {
          // Legacy format from previous example
          const aiResultElement = displayAISearchResults(data.result);
          responseDiv.appendChild(aiResultElement);
        } else {
          // Handle regular response or error
          responseDiv?.insertAdjacentHTML(
            'beforeend',
            \`<p class="answer">\${data.error || data.response || 'No valid response data received'}</p>\`
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

    // Handle Enter key press in the textarea
    promptInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendButton.click();
      }
    });
  </script>

</body>
</html>
`;