import { html } from 'hono/html';
import { NavBar } from '../components/NavBar';
import { Styles } from '../components/styles';
import { Scripts } from '../components/script';

export const AuthPage = () => html`
 ${Styles()}
 ${Scripts()}
 ${NavBar()}
 <h1 style="text-align: center; color: var(--primary-color); font-size: 1.75rem; margin-top: 1rem;">Auth</h1>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Link</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
       <!-- Workers + Access Row with Sub-Rows -->
      <tr onclick="toggleSubRows('workersAccessSubRows')" style="cursor: pointer;">
        <td>Workers + Access</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for Zero Trust Access</td>
      </tr>
      <tr class="workersAccessSubRows subRow" style="display: none;">
        <td>Project 1</td>
        <td><a href="#">Link 1</a></td>
        <td>WIP</td>
      </tr>
    </tbody>
  </table>
`;
