import { Hono } from 'hono';
import { DurableObject } from "cloudflare:workers";
import { WorkerEntrypoint } from "cloudflare:workers";

export interface Env {
    MY_WS_CENTRAL_SERVER: DurableObjectNamespace;     
}

const app = new Hono<{ Bindings: Env }>()

export class WS_CENTRAL_SERVER extends DurableObject {
	private storage: DurableObjectStorage;
	currentlyConnectedWebSockets: number;
	private connectedWebSockets: { [key: string]: Set<any> };

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.currentlyConnectedWebSockets = 0;
		this.connectedWebSockets = {
			cluster1: new Set(),
			cluster2: new Set(),
		};
	}

	// Add a new websocket client to the central server
	async add_server(origin_cluster: string, server: WebSocket, username: string): Promise<void>{
		
		if (!this.connectedWebSockets[origin_cluster]) {
			// If the cluster does not exist, create a new Set for it
			this.connectedWebSockets[origin_cluster] = new Set();
		}
		this.connectedWebSockets[origin_cluster].add(server);
		this.currentlyConnectedWebSockets += 1;

		// Notify users in other pools
		for (const cluster in this.connectedWebSockets) {
			if (cluster !== origin_cluster) {
				this.connectedWebSockets[cluster].forEach(ws => {
					ws.send(`[System] User ${username} has joined the chat.`);
				});
			}
		}

		
	}

	// Remove a new websocket client to the central server
	async remove_server(origin_cluster: string, server: WebSocket, username: string): Promise<void>{
		this.connectedWebSockets[origin_cluster]?.delete(server);
		this.currentlyConnectedWebSockets -= 1;

		// Notify users in other pools
		for (const cluster in this.connectedWebSockets) {
			if (cluster !== origin_cluster) {
				this.connectedWebSockets[cluster].forEach(ws => {
					ws.send(`[System] User ${username} has joined the chat.`);
				});
			}
		}
	}

	// Fan a message to all clusters
	async send_message(origin_cluster: string, message: string): Promise<void>{
		
		for (const cluster in this.connectedWebSockets) {
			if (cluster !== origin_cluster) {
				this.connectedWebSockets[cluster].forEach(ws => {
					ws.send(message);
				});
			}
		}
	}

	async get_conncurrent_connections (): Promise<number>{
		return this.currentlyConnectedWebSockets
	} 

}

export default class extends WorkerEntrypoint {
	env: Env

	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		this.env = env; 
	}

	async fetch() { 
		const id = this.env.MY_WS_CENTRAL_SERVER.idFromName("central");
		const durableObject = this.env.MY_WS_CENTRAL_SERVER.get(id);
		const currentlyConnectedWebSockets = await durableObject.get_conncurrent_connections()
		return new Response(`Hello from MY_WS_CENTRAL_SERVER, concurrent connections: ${currentlyConnectedWebSockets}`); 
	}

	async send_message(origin_cluster: string, message: string): Promise<void>{
		const id = this.env.MY_WS_CENTRAL_SERVER.idFromName("central");
		const durableObject = this.env.MY_WS_CENTRAL_SERVER.get(id);
		await durableObject.send_message(origin_cluster, message)
	}

	async add_server(origin_cluster: string, server: WebSocket, username: string): Promise<void>{
		const id = this.env.MY_WS_CENTRAL_SERVER.idFromName("central");
		const durableObject = this.env.MY_WS_CENTRAL_SERVER.get(id);
		await durableObject.add_server(origin_cluster, server, username)
	}

	async remove_server(origin_cluster: string, server: WebSocket, username: string): Promise<void>{
		const id = this.env.MY_WS_CENTRAL_SERVER.idFromName("central");
		const durableObject = this.env.MY_WS_CENTRAL_SERVER.get(id);
		await durableObject.remove_server(origin_cluster, server, username)
	}
	
} 



