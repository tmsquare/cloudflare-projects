import { Hono } from 'hono';
import { homePage } from './pages/home';

export interface Env {
	AI: Ai;
}

const app = new Hono<{ Bindings: Env }>()

app.get('/ai/deepseek', async (c) => {
	return c.html(homePage());
  },
);


app.post('/ai/deepseek/prompt', async (c) => {

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

	  const stream = await c.env.AI.run("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", input);
  
	  return new Response(stream, {
		headers: { "content-type": "text/event-stream" },
	  });
	  
  },
);
  
export default app;

