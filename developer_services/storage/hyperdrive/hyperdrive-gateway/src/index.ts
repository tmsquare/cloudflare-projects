import { Hono } from 'hono';
import { Client } from 'pg';
import { renderHomePage } from './pages/home';

export interface Env {
	HYPERDRIVE: Hyperdrive;
}

const app = new Hono();

app.get('/hyperdrive', async (c) => {
	const env = c.env as Env;
	const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
	let startTime = Date.now();

	try {
		await client.connect();

		const result = await client.query({ text: 'SELECT * FROM USERS' });

		await client.end();

		const endTime = Date.now();
		const duration = endTime - startTime;

		const html = renderHomePage(duration, result.rows);

		return c.html(html);
	} catch (e) {
		console.log(e);
		return c.html(`<p style="color: red;">Error: ${JSON.stringify(e)}</p>`, 500);
	}
});

export default app;

