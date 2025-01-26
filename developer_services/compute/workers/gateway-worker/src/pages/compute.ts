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
        <td>Serverless platform that lets developers run their code at the edge for fast, scalable, and secure application</td>
      </tr>
      <tr class="workersSubRows subRow" style="display: none;">
        <td>Word Count</td>
        <td><a href="/worker/word-count" target="_blank">/worker/word-count</a></td>
        <td>From Laptop to Lambda. The idea is to use Cloud Threads (workers) to count the number of occurrence of a given keyword in a big file (100MB+)</td>
      </tr>

      <!-- Pages with Sub-Rows -->
      <tr onclick="toggleSubRows('pagesSubRows')" style="cursor: pointer;">
        <td>Pages</td>
        <td><a href="#">Main Link</a></td>
        <td>JAMstack platform for deploying fast, secure, and scalable static sites and full-stack applications directly from your Git repository.</td>
      </tr>
      <tr class="pagesSubRows subRow" style="display: none;">
        <td>NextJs</td>
        <td><a href="https://nextjs-pages.tmsquare.net/" target="_blank">nextjs-pages.tmsquare.net</a></td>
        <td>NextJs App running on Cloudflare Edge (SSR)</td>
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

      <!-- Workflows Row with Sub-Rows -->
      <tr onclick="toggleSubRows('workflowsSubRows')" style="cursor: pointer;">
        <td>Workflows</td>
        <td><a href="#">Main Link</a></td>
        <td>Workflows is a durable execution engine built on Cloudflare Workers. Workflows allow you to build multi-step applications </td>
      </tr>
      <tr class="workflowsSubRows subRow" style="display: none;">
        <td>Image Generation</td>
        <td><a href="/workflows" target="_blank">/workflows</a></td>
        <td>A workflows project with 4 steps: 1) API call to generate image 2) Store image on R2 3) Log request in D1 4) Send image URL via email</td>
      </tr>

    </tbody>
  </table>
`;
