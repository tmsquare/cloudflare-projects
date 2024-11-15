import { html } from 'hono/html';
import { NavBar } from '../components/NavBar';
import { Styles } from '../components/styles';
import { Scripts } from '../components/script';

export const AIPage = () => html`
 ${Styles()}
 ${Scripts()}
 ${NavBar()}
 <h1 style="text-align: center; color: var(--primary-color); font-size: 1.75rem; margin-top: 1rem;">AI</h1>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Link</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <!-- Workers AI Row with Sub-Rows -->
      <tr onclick="toggleSubRows('workersAISubRows')" style="cursor: pointer;">
        <td>Workers AI</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for Workers AI</td>
      </tr>
      <tr class="workersAISubRows subRow" style="display: none;">
        <td>Project 1</td>
        <td><a href="#">Link 1</a></td>
        <td>WIP</td>
      </tr>

      <!-- AI Gateway Row with Sub-Rows -->
      <tr onclick="toggleSubRows('AIgatewaySubRows')" style="cursor: pointer;">
        <td>AI Gateway</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for AI Gateway</td>
      </tr>
      <tr class="AIgatewaySubRows subRow" style="display: none;">
        <td>Chatbot</td>
        <td><a href="/ai/gateway" target="_blank">/ai/gateway</a></td>
        <td>an AI Assistant linked to the AI Gateway API</td>
      </tr>

    </tbody>
  </table>
`;
