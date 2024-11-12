import { Hono } from 'hono';
import { renderHomePage } from './pages/homePage';
import { DurableObject } from "cloudflare:workers";


export interface Env {
	MY_TmsquareChatRoom: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>();

export class TmsquareChatRoom extends DurableObject {
  private storage: DurableObjectStorage;
	currentlyConnectedWebSockets: number;
	private connectedWebSockets:  Map<WebSocket, string>;  // Track clients and usernames

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
		this.storage = ctx.storage;
		this.currentlyConnectedWebSockets = 0;
		this.connectedWebSockets = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/do/chatroom/ws' && request.headers.get('Upgrade') === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());

      this.handleWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocket(webSocket: WebSocket): void {
      webSocket.accept();
      

      webSocket.addEventListener('message', async (event: MessageEvent) => {
        const data = JSON.parse(event.data);

        // Check if it's a join message
        if (data.type === 'join') {
          const username = data.username;
          this.connectedWebSockets.set(webSocket, username);

          // Broadcast that a user joined
          await this.broadcast(`${username} has joined the chat.`);
          this.currentlyConnectedWebSockets += 1;
        } else if (data.type === 'message') {
          // Broadcast regular messages
          const username = this.connectedWebSockets.get(webSocket);
          if (username) {
            await this.broadcast(`${username}: ${data.message}`);
          }
        }
      });

      webSocket.addEventListener('close', async () => {
          this.currentlyConnectedWebSockets -= 1;
          const username = this.connectedWebSockets.get(webSocket);
          this.connectedWebSockets.delete(webSocket);
          if (username) {
            await this.broadcast(`${username} has left the chat.`);
          }
      });
  }

  private async broadcast(message: string): Promise<void> {
      for (const client of this.connectedWebSockets.keys()) {
        try {
          client.send(message);
        } catch (e) {
          console.error('Error sending message:', e);
        }
      }
  }

}

app.get('/do/chatroom', async (c) => {
  return c.html(renderHomePage());
});

app.get('/do/chatroom/ws', async (c) => {
  const id = c.env.MY_TmsquareChatRoom.idFromName('chatroom');
  const obj = c.env.MY_TmsquareChatRoom.get(id);
  return obj.fetch(c.req.raw);
});

export default app;
