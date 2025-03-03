import { html } from 'hono/html';


export const homePage = (content?: string) => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Analyzer</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #2c5282;
      text-align: center;
      margin-bottom: 30px;
    }
    form {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      border: 2px dashed #aaa;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      background-color: #f9f9f9;
      margin-bottom: 30px;
    }
    .submit-btn {
      background-color: #4299e1;
      color: white;
      border: none;
      padding: 12px 25px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .submit-btn:hover {
      background-color: #3182ce;
    }
    .submit-btn:disabled {
      background-color: #a0aec0;
      cursor: not-allowed;
    }
    .preview {
      max-width: 100%;
      text-align: center;
      margin-top: 20px;
    }
    .preview img {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .results {
      background-color: #ebf8ff;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      width: 100%;
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #4299e1;
      animation: spin 1s ease infinite;
      display: none;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      color: #e53e3e;
      background-color: #fed7d7;
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
    }
    label {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Image Analyzer</h1>
  
  <form id="upload-form">
    <label for="image">Select an image to analyze:</label>
    <input type="file" id="image" name="image" accept="image/*">
    <button type="submit" class="submit-btn">Analyze Image</button>
  </form>
  
  <div id="preview" class="preview" style="display: none;">
    <h2>Image Preview</h2>
    <img id="preview-image" src="" alt="Preview">
  </div>
  
  <div id="spinner" class="spinner"></div>
  
  <div id="results" class="results" style="display: none;">
    <h2>Analysis Results</h2>
    <div id="results-content">${content || ''}</div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
    
      var form = document.getElementById('upload-form');
      var fileInput = document.getElementById('image');
      var preview = document.getElementById('preview');
      var previewImage = document.getElementById('preview-image');
      var spinner = document.getElementById('spinner');
      var results = document.getElementById('results');
      var resultsContent = document.getElementById('results-content');
      
      // Show preview when file is selected
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files.length > 0) {
          // Show preview
          var file = fileInput.files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            previewImage.src = e.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        } else {
          preview.style.display = 'none';
        }
      });
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        analyse();
      });
      
     
      function analyse() {
        if (!fileInput.files || fileInput.files.length === 0) {
          alert('Please select an image first');
          return;
        }
        
        // Show spinner, hide results
        spinner.style.display = 'block';
        results.style.display = 'none';
        
        var imageFile = fileInput.files[0];
        
        // Create a reader to get the image data
        var reader = new FileReader();
        
        reader.onload = function() {
          // Get the image data as ArrayBuffer
          var imageData = reader.result;
          
          fetch('/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': imageFile.type
            },
            body: imageData
          })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('Server returned status: ' + response.status);
            }
            
            var contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              return response.text().then(function(text) {
                throw new Error('Expected JSON but got: ' + text.substring(0, 100) + '...');
              });
            }
            
            return response.json();
          })
          .then(function(data) {
            if (data && data.description) {
              resultsContent.innerHTML = '<p>' + data.description + '</p>';
            } else if (data && data.error) {
              throw new Error(data.error);
            } else {
              throw new Error('Unexpected response format');
            }
            results.style.display = 'block';
          })
          .catch(function(error) {
            console.error('Analysis error:', error);
            resultsContent.innerHTML = '<div class="error"><p>Error: ' + error.message + '</p></div>';
            results.style.display = 'block';
          })
          .finally(function() {
            spinner.style.display = 'none';
          });
        };
        
        reader.onerror = function() {
          spinner.style.display = 'none';
          resultsContent.innerHTML = '<div class="error"><p>Error: Failed to read the image file</p></div>';
          results.style.display = 'block';
        };
        
        // Read the image as ArrayBuffer
        reader.readAsArrayBuffer(imageFile);
      }
    });
  </script>
</body>
</html>
`;