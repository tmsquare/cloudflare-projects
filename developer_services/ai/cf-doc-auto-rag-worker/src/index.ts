import { Hono } from 'hono';
import { homePage } from './pages/home';

export interface Env {
	AI: Ai;
}

const app = new Hono<{ Bindings: Env }>()



app.get('/', async (c) => {
	return c.html(homePage());
  },
);


app.post('/prompt', async (c) => {

    const { prompt } = await c.req.json();

	if (!prompt) return c.json({ error: 'Prompt is required' }, 400);

	const answer = await c.env.AI.autorag("cf-doc-rag-bucket").aiSearch({
		query: prompt,
		rewrite_query: true,
		max_num_results: 2,
		ranking_options: {
		  score_threshold: 0.2,
		}
	  });


	return c.json(answer);
	  
  },
);

export default app;

