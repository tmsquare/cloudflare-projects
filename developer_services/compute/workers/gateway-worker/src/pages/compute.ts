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
      <!-- Durable Objects Row with Sub-Rows -->
      <tr onclick="toggleSubRows('durableObjectsSubRows')" style="cursor: pointer;">
        <td>Durable Objects</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for Durable Objects</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>Durable Object 1</td>
        <td><a href="#">Link 1</a></td>
        <td>Description for Durable Object 1</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>Durable Object 2</td>
        <td><a href="#">Link 2</a></td>
        <td>Description for Durable Object 2</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>Durable Object 3</td>
        <td><a href="#">Link 3</a></td>
        <td>Description for Durable Object 3</td>
      </tr>

      <!-- KV Row with Sub-Rows -->
      <tr onclick="toggleSubRows('kvSubRows')" style="cursor: pointer;">
        <td>KV</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for KV</td>
      </tr>
      <tr class="kvSubRows subRow" style="display: none;">
        <td>KV Option 1</td>
        <td><a href="#">Link 1</a></td>
        <td>Description for KV Option 1</td>
      </tr>
      <tr class="kvSubRows subRow" style="display: none;">
        <td>KV Option 2</td>
        <td><a href="#">Link 2</a></td>
        <td>Description for KV Option 2</td>
      </tr>

      <!-- R2 Row with Sub-Rows -->
      <tr onclick="toggleSubRows('r2SubRows')" style="cursor: pointer;">
        <td>R2</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for R2</td>
      </tr>
      <tr class="r2SubRows subRow" style="display: none;">
        <td>R2 Option 1</td>
        <td><a href="#">Link 1</a></td>
        <td>Description for R2 Option 1</td>
      </tr>
      <tr class="r2SubRows subRow" style="display: none;">
        <td>R2 Option 2</td>
        <td><a href="#">Link 2</a></td>
        <td>Description for R2 Option 2</td>
      </tr>

      <!-- D1 Row with Sub-Rows -->
      <tr onclick="toggleSubRows('d1SubRows')" style="cursor: pointer;">
        <td>D1</td>
        <td><a href="#">Main Link</a></td>
        <td>Main description for D1</td>
      </tr>
      <tr class="d1SubRows subRow" style="display: none;">
        <td>D1 Option 1</td>
        <td><a href="#">Link 1</a></td>
        <td>Description for D1 Option 1</td>
      </tr>
      <tr class="d1SubRows subRow" style="display: none;">
        <td>D1 Option 2</td>
        <td><a href="#">Link 2</a></td>
        <td>Description for D1 Option 2</td>
      </tr>
    </tbody>
  </table>
`;
