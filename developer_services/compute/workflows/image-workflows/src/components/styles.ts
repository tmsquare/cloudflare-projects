import { html } from 'hono/html';

export const Styles = () => html`
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f9;
      color: #333;
      line-height: 1.6;
    }

    header {
      background-color: #3a8dff;
      color: white;
      text-align: center;
      padding: 40px 20px;
      border-bottom: 3px solid #1e60a1;
    }

    header h1 {
      font-size: 2.5rem;
    }

    header p {
      font-size: 1rem;
      margin-top: 10px;
    }

    .container {
      max-width: 500px;
      margin: 30px auto;
      background-color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .form-title {
      font-size: 1.8rem;
      color: #3a8dff;
      margin-bottom: 10px;
      text-align: center;
    }

    .form-description {
      font-size: 1rem;
      margin-bottom: 20px;
      text-align: center;
    }

    label {
      font-size: 1rem;
      display: block;
      margin-bottom: 5px;
    }

    input[type="text"],
    input[type="email"],
    textarea {
      width: 100%;
      padding: 12px;
      margin-bottom: 20px;
      border: 2px solid #ccc;
      border-radius: 8px;
      font-size: 1rem;
    }

    textarea {
      height: 100px;
    }

    input[type="submit"] {
      background-color: #3a8dff;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 1.1rem;
      cursor: pointer;
      width: 100%;
    }

    input[type="submit"]:hover {
      background-color: #2c74d2;
    }

    footer {
      background-color: #3a8dff;
      color: white;
      padding: 15px;
      text-align: center;
      margin-top: 20px;
    }

    footer p {
      font-size: 0.9rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      header h1 {
        font-size: 2rem;
      }

      header p {
        font-size: 0.9rem;
      }

      .form-title {
        font-size: 1.5rem;
      }

      input[type="text"],
      input[type="email"],
      textarea {
        padding: 10px;
        font-size: 0.9rem;
      }

      input[type="submit"] {
        font-size: 1rem;
        padding: 10px;
      }
    }

    @media (max-width: 480px) {
      header h1 {
        font-size: 1.8rem;
      }

      header p {
        font-size: 0.8rem;
      }

      .form-title {
        font-size: 1.3rem;
      }

      .form-description {
        font-size: 0.9rem;
      }

      input[type="text"],
      input[type="email"],
      textarea {
        padding: 8px;
        font-size: 0.8rem;
      }

      input[type="submit"] {
        font-size: 0.9rem;
        padding: 8px;
      }
    }
  </style>
`;


  