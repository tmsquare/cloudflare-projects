import { html } from 'hono/html';

export const NavBar = () => html`
  <nav>
    <!-- Left-Aligned Title -->
    <a href="/"><div class="title">Tmsquare's Lab</div></a>

    <!-- Centered Navigation Links -->
    <div class="nav-links">
      <a href="/storage">Storage</a>
      <a href="/compute">Compute</a>
      <a href="/ai">AI</a>
      <a href="/auth">Auth</a>
    </div>
  </nav>
`;
