// src/pages/storage.ts
import { html } from 'hono/html';
import { NavBar } from '../components/NavBar';
import { Styles } from '../components/styles';
import { Scripts } from '../components/script';

export const ComputePage = () => html`
 ${Styles()}
 ${Scripts()}
 ${NavBar()}
 <h1 style="text-align: center; color: var(--primary-color); font-size: 1.75rem; margin-top: 1rem;">Compute</h1>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Link</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <!-- Workers Row with Sub-Rows -->
      <tr onclick="toggleSubRows('workersSubRows')" style="cursor: pointer;">
        <td>Workers</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for CF Workers</td>
      </tr>
      <tr class="workersSubRows subRow" style="display: none;">
        <td>Project 1</td>
        <td><a href="#">Link 1</a></td>
        <td>WIP</td>
      </tr>

      <!-- Pages with Sub-Rows -->
      <tr onclick="toggleSubRows('pagesSubRows')" style="cursor: pointer;">
        <td>Pages</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for CF Pages</td>
      </tr>
      <tr class="pagesSubRows subRow" style="display: none;">
        <td>Project 1</td>
        <td><a href="#">Link 1</a></td>
        <td>WIP</td>
      </tr>

      <!-- Workflows Row with Sub-Rows -->
      <tr onclick="toggleSubRows('workflowsSubRows')" style="cursor: pointer;">
        <td>Workflows</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for Workflows</td>
      </tr>
      <tr class="workflowsSubRows subRow" style="display: none;">
        <td>Project 1</td>
        <td><a href="#">Link 1</a></td>
        <td>WIP</td>
      </tr>

      <!-- Queues Row with Sub-Rows -->
      <tr onclick="toggleSubRows('queuesSubRows')" style="cursor: pointer;">
        <td>Queues</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for Queues</td>
      </tr>
      <tr class="queuesSubRows subRow" style="display: none;">
        <td>Project 1</td>
        <td><a href="#">Link 1</a></td>
        <td>WIP</td>
      </tr>
    </tbody>
  </table>
`;
