import { Hono } from 'hono';
import { DurableObject } from "cloudflare:workers";
import { homePage } from './pages/home';

export interface Env {
    MY_Tickets: DurableObjectNamespace;  
    MY_DEFAULT_KV_DEMO: KVNamespace;     
}

const SECONDS = 1000;
const app = new Hono<{ Bindings: Env }>()

export class Tickets extends DurableObject {
	private storage: DurableObjectStorage;
	currentlyConnectedWebSockets: number;
	private connectedWebSockets: Set<WebSocket>
	private availableTickets: number = 50; // Default ticket count

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.currentlyConnectedWebSockets = 0;
		this.connectedWebSockets = new Set();
		this.ctx.blockConcurrencyWhile(async () => {
			const storedCount = await this.ctx.storage.get<number>("availableTickets");
			this.availableTickets = storedCount ?? 50; // Load or set default count to 50
		});
	}

	// Get, set, increment, decrement, and reset tickets
	async getAvailableTickets(): Promise<number> {
		const savedCounts = await this.storage.get<number>('availableTickets');
		if (savedCounts) {
			return savedCounts;
		}
		return 0;
	}

	async setAvailableTickets(new_number: number): Promise<void> {
		await this.storage.put('availableTickets', new_number);
	}

	async incrementTicket(): Promise<void> {
		let savedCounts = await this.storage.get<number>('availableTickets');
		if (savedCounts) {
			savedCounts++;
			await this.storage.put('availableTickets', savedCounts);
		}
	}

	async decrementTicket(): Promise<void> {
		let savedCounts = await this.storage.get<number>('availableTickets');
		if (savedCounts) {
			savedCounts--;
			await this.storage.put('availableTickets', savedCounts);
		}
	}

	async resetAvailableTicketsState(): Promise<void> {
		let savedCounts = await this.storage.get<number>('availableTickets');
		if (savedCounts) {
			savedCounts = 0;
			await this.storage.put('availableTickets', savedCounts);
		}
	}

	
	// Alarm handler 
	async alarm() {
		this.incrementTicket();
	}

	// WebSocket handling
	async fetch(request: Request): Promise<Response> {
		const upgradeHeader = request.headers.get('Upgrade');
		const username = request.headers.get('username');
		if (!upgradeHeader || upgradeHeader !== 'websocket') {
			return new Response('Durable Object expected Upgrade: websocket', { status: 426 });
		}
		if (!username) {
			return new Response('Must add a username header', { status: 400 });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		server.accept();
		this.currentlyConnectedWebSockets += 1;
		this.connectedWebSockets.add(server);

		this.connectedWebSockets.forEach(ws => {
			ws.send(`[System] User ${username} has joined the chat.`);
		});

		server.addEventListener('message', (event: MessageEvent) => {
			const clientMessage = event.data;
			this.connectedWebSockets.forEach(ws => {
				if (ws !== server) {
					ws.send(`[${username}] Message: ${clientMessage}, currentlyConnectedWebSockets: ${this.currentlyConnectedWebSockets}`);
				}
			});
		});

		server.addEventListener('close', (cls: CloseEvent) => {
			this.currentlyConnectedWebSockets -= 1;
			this.connectedWebSockets.delete(server);
			this.connectedWebSockets.forEach(ws => {
				ws.send(`[System] User ${username} has left the chat.`);
			});
			server.close(cls.code, "Durable Object is closing WebSocket");
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
		
	}
}

// Hono routes for ticket-related operations
app.get('/do/tickets', async (c) => {
	return c.html(homePage());
});


app.get('/do/tickets/get_tickets', async (c) => {
	const id = c.env.MY_Tickets.idFromName("train-tickets");
	const durableObject = c.env.MY_Tickets.get(id);
	// //return new Response("Available Tickets: " + await durableObject.getAvailableTickets());
	return new Response(JSON.stringify({ count: await durableObject.getAvailableTickets() }), { headers: { "Content-Type": "application/json" } });
});

app.get('/do/tickets/set_tickets', async (c) => {
	const new_value = c.req.query('new_value');
	if (!new_value) {
		return c.text('Missing query string: ?new_value=x', 400);
	}
	const id = c.env.MY_Tickets.idFromName("train-tickets");
	const durableObject = c.env.MY_Tickets.get(id);
	await durableObject.setAvailableTickets(Number(new_value));
    return new Response("Available Tickets: " + await durableObject.getAvailableTickets());
});

app.get('/do/tickets/buy_ticket', async (c) => {
	const id = c.env.MY_Tickets.idFromName("train-tickets");
	const durableObject = c.env.MY_Tickets.get(id);
	await durableObject.decrementTicket();
    //return new Response("Available Tickets: " + await durableObject.getAvailableTickets());
	return new Response(JSON.stringify({ count: await durableObject.getAvailableTickets() }), { headers: { "Content-Type": "application/json" } });
});

app.get('/do/tickets/return_ticket', async (c) => {
	const id = c.env.MY_Tickets.idFromName("train-tickets");
	const durableObject = c.env.MY_Tickets.get(id);
	await durableObject.incrementTicket();
    //return new Response("Available Tickets: " + await durableObject.getAvailableTickets());
	return new Response(JSON.stringify({ count: await durableObject.getAvailableTickets() }), { headers: { "Content-Type": "application/json" } });
});

app.get('/do/tickets/reset_all', async (c) => {
	const id = c.env.MY_Tickets.idFromName("train-tickets");
	const durableObject = c.env.MY_Tickets.get(id);
	await durableObject.resetAvailableTicketsState();
    return new Response("Available Tickets: " + await durableObject.getAvailableTickets());
});

app.get('/do/tickets/websocket', async (c) => {
	const id = c.env.MY_Tickets.idFromName("train-tickets");
	const durableObject = c.env.MY_Tickets.get(id);
	return durableObject.fetch(c.req.raw);
});

export default app;
