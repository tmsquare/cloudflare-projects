import { html } from 'hono/html';

export const Styles = () => html`
<style>
  :root {
    --primary-color: #fd9f1c;
    --secondary-color: #ffffff;
    --background-color: #f5f5f5;
    --text-color: #333;
    --link-color: #ffffff;
    --font-family: 'Roboto', sans-serif;
  }

  body {
    font-family: var(--font-family);
    margin: 0;
    padding: 0;
    background-color: var(--background-color);
    color: var(--text-color);
    box-sizing: border-box;
  }

  nav {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 2rem;
    background-color: var(--primary-color);
    color: var(--link-color);
    border-radius: 8px;
    margin: 1rem auto;
    max-width: 80%;
  }

  nav .title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--secondary-color);
  }

  nav a {
    color: var(--link-color);
    text-decoration: none;
    font-size: 1.25rem;
    padding: 0.5rem;
    margin: 0 0.25rem;
    border-radius: 6px;
    transition: background-color 0.3s ease;
  }

  nav a:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    width: 100%;
    margin-top: 0.5rem;
  }

  table {
    width: 90%;
    max-width: 700px;
    margin: 2rem auto;
    border-collapse: collapse;
    background-color: #ffffff;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  th, td {
    padding: 1rem;
    border: 1px solid #ddd;
    text-align: left;
  }

  thead {
    background-color: var(--primary-color);
    color: var(--link-color);
  }

  tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tbody tr:hover {
    background-color: #eef7ff;
  }

  .subRow td {
    background-color: #f9f9f9;
    border-top: 1px solid #ddd;
    padding-left: 2rem; /* Indentation for sub-rows */
  }

  @media (max-width: 768px) {
    nav {
      align-items: center;
    }
    nav .title {
      text-align: center;
      font-size: 1.75rem;
    }
    .nav-links {
      flex-direction: column;
      align-items: center;
    }
    table {
      width: 100%;
      font-size: 0.9rem;
    }
  }
</style> 
`;


  