import { html } from 'hono/html';
import { NavBar } from '../components/NavBar';
import { Styles } from '../components/styles';
import { Scripts } from '../components/script';

export const StoragePage = () => html`
 ${Styles()}
 ${Scripts()}
 ${NavBar()}
 <h1 style="text-align: center; color: var(--primary-color); font-size: 1.75rem; margin-top: 1rem;">Storage</h1>
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
        <td><a href="#">Details</a></td>
        <td>Cloudflare Durable Objects provide stateful, single-instance objects that allow for consistent and synchronized data storage across Cloudflare's global edge network.</td>
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
        <td><a href="#">Details</a></td>
        <td>Cloudflare KV (Key-Value) is a globally distributed, low-latency key-value store for storing and retrieving data at the edge.</td>
      </tr>
      <tr class="kvSubRows subRow" style="display: none;">
        <td>JSON</td>
        <td><a href="/kv/products" target="_blank">/products</a></td>
        <td>Get a json item from KV. If not found, put a new one with 60min TTL</td>
      </tr>
      <tr class="kvSubRows subRow" style="display: none;">
        <td>HTML</td>
        <td><a href="/kv/html" target="_blank">/html</a></td>
        <td>Serve a static HTML file from KV</td>
      </tr>
      <tr class="kvSubRows subRow" style="display: none;">
        <td>Image</td>
        <td><a href="/kv/image" target="_blank">/image</a></td>
        <td>Serve a static image from KV</td>
      </tr>
      <tr class="kvSubRows subRow" style="display: none;">
        <td>Headers</td>
        <td><a href="/kv/headers" target="_blank">/headers</a></td>
        <td>Print all the request headers</td>
      </tr>

      <!-- R2 Row with Sub-Rows -->
      <tr onclick="toggleSubRows('r2SubRows')" style="cursor: pointer;">
        <td>R2</td>
        <td><a href="#">Details</a></td>
        <td>Cloudflare R2 is an object storage service that offers scalable, low-cost storage for large amounts of unstructured data, compatible with S3 APIs.</td>
      </tr>
      <tr class="r2SubRows subRow" style="display: none;">
        <td>Worker R2</td>
        <td><a href="r2" target="_blank">r2_gateway</a></td>
        <td>Worker interface which lists all the objects of a given bucket and allows to add/delete an object (given a secret)</td>
      </tr>

      <!-- D1 Row with Sub-Rows -->
      <tr onclick="toggleSubRows('d1SubRows')" style="cursor: pointer;">
        <td>D1</td>
        <td><a href="#">Details</a></td>
        <td>Cloudflare D1 is a serverless SQL database that provides fast, distributed relational database storage with MySQL compatibility, optimized for Cloudflare's edge network.</td>
      </tr>
      <tr class="d1SubRows subRow" style="display: none;">
        <td>Worker D1</td>
        <td><a href="d1" target="_blank">d1_gateway</a></td>
        <td>Worker interface to do CRUD operations on "Movie" Table from a D1 Database </td>
      </tr>

       <!-- Hyperdrive Row with Sub-Rows -->
      <tr onclick="toggleSubRows('hyperdriveSubRows')" style="cursor: pointer;">
        <td>Hyperdrive</td>
        <td><a href="#">Details</a></td>
        <td>Hyperdrive is service that optimizes database access by using connection pooling and caching to reduce latency.</td>
      </tr>
      <tr class="hyperdriveSubRows subRow" style="display: none;">
        <td>Hyperdrive Link</td>
        <td><a href="/hyperdrive" target="_blank">hyperdrive_gateway</a></td>
        <td>Hyperdrive link to connect to a PostgresSQL instance in North Virginia</td>
      </tr>
    </tbody>
  </table>
`;
