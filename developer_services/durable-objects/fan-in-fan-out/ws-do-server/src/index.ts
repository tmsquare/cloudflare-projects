import { Hono } from 'hono';
import { DurableObject } from "cloudflare:workers";

export interface Env {
    MY_WS_SERVER: DurableObjectNamespace;   
	MY_WS_CENTRAL_SERVER: Fetcher;  
}

const app = new Hono<{ Bindings: Env }>()

export class WS_SERVER extends DurableObject {
	private storage: DurableObjectStorage;
	currentlyConnectedWebSockets: number;
	private connectedWebSockets: Set<WebSocket>
	env: Env

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.env = env;
		this.storage = ctx.storage;
		this.currentlyConnectedWebSockets = 0;
		this.connectedWebSockets = new Set();
	}

	// WebSocket handling
	async fetch(request: Request): Promise<Response> {
		const username = request.headers.get('username');
		const { pathname, searchParams } = new URL(request.url);
		const upgradeHeader = request.headers.get('Upgrade');
		let broadcast_message = "";
		if (!upgradeHeader || upgradeHeader !== 'websocket') {
			return new Response('Durable Object expected Upgrade: websocket', { status: 426 });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		server.accept();
		this.currentlyConnectedWebSockets += 1;
		this.connectedWebSockets.add(server);
		this.env.MY_WS_CENTRAL_SERVER.add_server(pathname, server, username) // fan out add_server

		this.connectedWebSockets.forEach(ws => {
			ws.send(`[System] User ${username} has joined the chat.`);
		});

		server.addEventListener('message', (event: MessageEvent) => {
			const clientMessage = event.data;
			broadcast_message = `[${username}] Message: ${clientMessage}, currentlyConnectedWebSockets: ${this.currentlyConnectedWebSockets}`;
			this.connectedWebSockets.forEach(ws => {
				if (ws !== server) {
					ws.send(`[${username}] Message: ${clientMessage}, currentlyConnectedWebSockets: ${this.currentlyConnectedWebSockets}`);
				}
			});
		});
		this.env.MY_WS_CENTRAL_SERVER.send_message(pathname, `[${username}] Message: ${broadcast_message}, currentlyConnectedWebSockets: ${this.currentlyConnectedWebSockets}`) // fan out send_message


		server.addEventListener('close', (cls: CloseEvent) => {
			this.currentlyConnectedWebSockets -= 1;
			this.connectedWebSockets.delete(server);
			this.connectedWebSockets.forEach(ws => {
				ws.send(`[System] User ${username} has left the chat.`);
			});
			server.close(cls.code, "Durable Object is closing WebSocket");
		});
		this.env.MY_WS_CENTRAL_SERVER.remove_server(pathname, server, username) // fan out remove_server


		return new Response(null, {
			status: 101,
			webSocket: client,
		});
		
	}
}

// Hono routes 
app.get('/', async (c) => {
	return c.text('Welcome to the Fan-in/Fan-out WebSocket Server. Try /cluster1 or /cluster2', 200);
});

app.get('/cluster1', async (c) => {

	const username = c.req.query('username');
	if (!username) {
		return new Response('Must add a username query string: ?username=john', { status: 400 });
	}

	const req = new Request(c.req.raw)
  	req.headers.append('username', username)
  	c.req.raw = req

	const id = c.env.MY_WS_SERVER.idFromName("cluster1");
	const durableObject = c.env.MY_WS_SERVER.get(id);
	return durableObject.fetch(c.req.raw);
});

app.get('/cluster2', async (c) => {

	const username = c.req.query('username');
	if (!username) {
		return new Response('Must add a username query string: ?username=john', { status: 400 });
	}

	const req = new Request(c.req.raw)
  	req.headers.append('username', username)
  	c.req.raw = req

	const id = c.env.MY_WS_SERVER.idFromName("cluster2");
	const durableObject = c.env.MY_WS_SERVER.get(id);
	return durableObject.fetch(c.req.raw);
});



// Endpoint to handle form submissions
app.post('/submit', async (c) => {
    const data = await c.req.parseBody(); // Parse form data
	console.log(data)
    return c.json({ message: 'Form submitted successfully', data });
});


// Root route to serve HTML
app.get('/test', async (c) => {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Form Submission</title>
        </head>
        <body>
            <h1>Submit Your Details</h1>
            <form id="dataForm">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required><br><br>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required><br><br>
                <button type="submit">Submit</button>
            </form>
            <div id="response"></div>

            <script>
                const form = document.getElementById('dataForm');
                form.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const formData = new FormData(form);
                    const response = await fetch('/submit', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    document.getElementById('response').innerText = result.message;
                });
            </script>
        </body>
        </html>
    `;
    return c.html(html);
});

// Catch-all route for undefined paths (404 handler)
app.all('*', (c) => {
	c.status(404); // Set HTTP status to 404
	return c.text('404 - Page Not Found. The page you are looking for does not exist.');
});

export default app;
