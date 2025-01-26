import { html } from 'hono/html';

export const Scripts = () => html`
<script>
  document.getElementById('imageForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent form from submitting the default way

    const formData = {
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      prompt: document.getElementById('prompt').value,
    };

    try {
      const response = await fetch('/workflows/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });


      let messageBox = document.getElementById('messageBox');
      if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        messageBox.style.marginBottom = '20px';
        messageBox.style.padding = '15px';
        messageBox.style.borderRadius = '8px';
        messageBox.style.textAlign = 'center';
        messageBox.style.fontSize = '1rem';
        document.querySelector('.container').prepend(messageBox);
      }

      if (response) {
        messageBox.style.backgroundColor = '#3cba54'; // Green
        messageBox.style.color = 'white';
        messageBox.textContent = 'Thank you! Your image will be generated, and we will send you an email soon.';
        // Clear the form fields
        document.getElementById('imageForm').reset();
      } else {
        messageBox.style.backgroundColor = '#f44336'; // Red
        messageBox.style.color = 'white';
        messageBox.textContent = 'Oops, something went wrong. Please try again.';
      }

      setTimeout(() => {
        messageBox.remove();
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);

      let messageBox = document.getElementById('messageBox');
      if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        messageBox.style.marginBottom = '20px';
        messageBox.style.padding = '15px';
        messageBox.style.borderRadius = '8px';
        messageBox.style.textAlign = 'center';
        messageBox.style.fontSize = '1rem';
        document.querySelector('.container').prepend(messageBox);
      }
      messageBox.style.backgroundColor = '#f44336'; // Red
      messageBox.style.color = 'white';
      messageBox.textContent = 'An error occurred. Please try again later.';

      setTimeout(() => {
        messageBox.remove();
      }, 5000);
    }
  });
</script>

`;