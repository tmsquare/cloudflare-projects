import { Hono } from 'hono';
import { homePage } from './pages/home';

export interface Env {
	AI: Ai;
	AI_GATEWAY_ACCOUNT_ID: string;
	WORKER_AI_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>()

/*
export async function run(model: string, input: Record<string, any>, env: Env): Promise<any> {

	const response = await fetch(
		`https://gateway.ai.cloudflare.com/v1/${env.AI_GATEWAY_ACCOUNT_ID}/tmsquare-ai-gateway/workers-ai//ai/run/${model}`,
		{
		headers: { Authorization: `Bearer ${env.WORKER_AI_TOKEN}` },
		method: "POST",
		body: JSON.stringify(input),
		}
	);
	const result = await response.json();
	return result;
}
*/	
  

app.get('/ai/chatbot', async (c) => {
	return c.html(homePage());
  },
);


app.post('/ai/chatbot/prompt', async (c) => {

    const { prompt } = await c.req.json();

	if (!prompt) return c.json({ error: 'Prompt is required' }, 400);

	const input = {
		messages: [
		  {
			role: "system",
			content: "You are a friendly assistan that helps in every question the user might have",
		  },
		  {
			role: "user",
			content: prompt,
		  },
		],
		stream: true,
	  }
	  
	  /*
	  const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", input);
	  return c.json(response)
	  */

	  const stream = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", input);
  
	  return new Response(stream, {
		headers: { "content-type": "text/event-stream" },
	  });
	  
  },
);
  
export default app;

