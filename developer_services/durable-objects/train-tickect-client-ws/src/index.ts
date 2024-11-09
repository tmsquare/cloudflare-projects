export interface Env {
	MY_TRAIN_TICKETS_WORKER: Fetcher;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		
		if (request.url.endsWith("/websocket")) {
			return await env.MY_TRAIN_TICKETS_WORKER.fetch(request);
		}

		return new Response("Invalid path. Use /websocket", { status: 400 });
	},
} satisfies ExportedHandler<Env>;
