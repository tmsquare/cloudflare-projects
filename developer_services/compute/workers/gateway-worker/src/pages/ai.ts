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
        <td>Chatbot</td>
        <td><a href="/ai/chatbot" target="_blank">/ai/chatbot</a></td>
        <td>an AI Assistant helping in general question</td>
      </tr>
      <tr class="workersAISubRows subRow" style="display: none;">
        <td>Deepseek</td>
        <td><a href="/ai/deepseek" target="_blank">/ai/deepseek</a></td>
        <td>an AI Assistant helping in general question</td>
      </tr>

      <!-- AI Gateway Row with Sub-Rows -->
      <tr onclick="toggleSubRows('AIgatewaySubRows')" style="cursor: pointer;">
        <td>AI Gateway</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for AI Gateway</td>
      </tr>
      <tr class="AIgatewaySubRows subRow" style="display: none;">
        <td>WIP</td>
        <td><a href="#" target="_blank">/ai/gateway</a></td>
        <td>WIP</td>
      </tr>

    </tbody>
  </table>
`;
