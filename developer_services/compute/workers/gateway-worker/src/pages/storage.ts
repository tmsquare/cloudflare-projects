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
        <td>Stateful and single-instance objects that allows consistent and synchronized data storage</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>Chat Room</td>
        <td><a href="/do/chatroom" target="_blank">do/chatroom</a></td>
        <td>A stateless chat room built on top of Durable Objects and Websocket</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>TrainTicket</td>
        <td><a href="/do/tickets" target="_blank">/do/tickets</a></td>
        <td>A stateful ticket reservation app built on top of strongly consistant transactional storage</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>TrainTicket</td>
        <td><a href="/do/tickets" target="_blank">/do/service-binding-tickets</a></td>
        <td>HTTP bound worker to the TrainTicket app</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>FlightSeat SQL</td>
        <td><a href="/do/flight-seat-sql" target="_blank">/do/flight-seat-sql</a></td>
        <td>A stateful flight seat reservation app built on top of a zero-latency sql storage</td>
      </tr>
      <tr class="durableObjectsSubRows subRow" style="display: none;">
        <td>Fan-Out/Fan-IN</td>
        <td><a href="#">WIP</a></td>
        <td>WIP</td>
      </tr>

      <!-- KV Row with Sub-Rows -->
      <tr onclick="toggleSubRows('kvSubRows')" style="cursor: pointer;">
        <td>KV</td>
        <td><a href="#">Details</a></td>
        <td>Globally distributed, low-latency key-value store for getting/putting data at the edge.</td>
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
        <td>Object Store that offers scalable, low-cost storage for large amounts of unstructured data, compatible with S3 APIs.</td>
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
        <td>Serverless SQL database that provides fast, distributed relational database storage with MySQL compatibility.</td>
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
        <td>Service that optimizes database access by using connection pooling and caching to reduce latency.</td>
      </tr>
      <tr class="hyperdriveSubRows subRow" style="display: none;">
        <td>Hyperdrive Link</td>
        <td><a href="/hyperdrive" target="_blank">hyperdrive_gateway</a></td>
        <td>Hyperdrive link to connect to a PostgresSQL instance in North Virginia</td>
      </tr>
    </tbody>
  </table>
`;
