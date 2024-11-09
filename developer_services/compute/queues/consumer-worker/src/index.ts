export interface Env {
	MY_DEFAULT_QUEUE: Queue<any>;
}

export default {
	async queue(batch, env): Promise<void> {
	  let messages = JSON.stringify(batch.messages);
	  console.log(`consumed from our queue: ${messages}`);
	},
} satisfies ExportedHandler<Env>;