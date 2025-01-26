import { html } from 'hono/html';
import { Styles } from '../components/styles';
import { Scripts } from '../components/script';

export const HomePage = () => html`
 ${Styles()}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tmsquare Workflows - Image Generation</title>
</head>
<body>

  <header>
    <h1>Welcome to Tmsquare Workflows</h1>
    <p>Your Image Generation Made Easy!</p>
  </header>

  <div class="container">
    <div class="form-title">Generate Your Custom Image</div>
    <div class="form-description">
      <p>Enter a random username, a valid email, and describe the image you want. It can be anything you imagine! We'll send you the image URL and a thank-you message.</p>
    </div>

    <form id="imageForm">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" placeholder="Enter a random username" required>

      <label for="email">Email:</label>
      <input type="email" id="email" name="email" placeholder="Enter your email" required>

      <label for="prompt">Image Generation Prompt:</label>
      <textarea id="prompt" name="prompt" placeholder="Describe the image you want" required></textarea>

      <input type="submit" value="Generate Image">
    </form>
  </div>

  <footer>
    <p>&copy; 2025 Tmsquare Workflows. All rights reserved.</p>
  </footer>
 ${Scripts()}
  
</body>
</html>

`;
