export interface Env {
	MY_DEFAULT_QUEUE: Queue<any>;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
	  let log = {
		url: request.url,
		method: request.method,
		headers: Object.fromEntries(request.headers),
	  };

	  await env.MY_DEFAULT_QUEUE.send(log);
	  return new Response('Success!');
	},
} satisfies ExportedHandler<Env>;