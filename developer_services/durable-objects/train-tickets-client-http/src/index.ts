export interface Env {
	MY_TRAIN_TICKETS_WORKER: Fetcher;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {

		// Call the Durable Object Worker
		return await env.MY_TRAIN_TICKETS_WORKER.fetch(request);
	},
} satisfies ExportedHandler<Env>;
