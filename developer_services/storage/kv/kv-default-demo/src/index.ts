import { Hono } from 'hono';
import mime from 'mime';

export interface Env {
	MY_DEFAULT_KV_DEMO: KVNamespace;
}

const app = new Hono();
const KV_TTL = 60 * 30;


app.get('/', async (c) => {
    return c.text('Welcome to the KV demo page. Try /products, /image, /headers or /html', 200);
});

app.get('/products', async (c) => {
    const env = c.env as Env;
    
    // Fetch products from KV store
    const products_kv = await env.MY_DEFAULT_KV_DEMO.get<string>("products", { type: "json" });
    
    if (products_kv) {
        return c.json(products_kv);
    }

	const products: { [key: string]: any } = {
        name: "John Doe",
        age: 30,
        isStudent: false,
        skills: ["JavaScript", "TypeScript", "Cloudflare Workers"]
    };

    // Store products in KV store with a TTL
    await env.MY_DEFAULT_KV_DEMO.put("products", JSON.stringify(products), { expirationTtl: KV_TTL });

    return c.json({ message: 'No products found' }, 404);
});

app.get('/html', async (c) => {
    const env = c.env as Env;
    
    //get the mimetype from the key path
    let mimeType = mime.getType("html") || "text/plain";
    if (mimeType.startsWith("text") || mimeType === "application/javascript") {
      mimeType += "; charset=utf-8";
    }

    //get the value from the KV store and return it if found
    const value = await env.MY_DEFAULT_KV_DEMO.get("index.html", 'arrayBuffer')
    if(!value){
      return new Response("Not found", {
        status: 404
      })
    }
    return new Response(value, {
      status: 200,
      headers: new Headers({
        "Content-Type": mimeType
      })
    });
});

app.get('/image', async (c) => {
    const env = c.env as Env;
    
    //get the mimetype from the key path
    let mimeType = mime.getType("webp") || "text/plain";
    if (mimeType.startsWith("text") || mimeType === "application/javascript") {
      mimeType += "; charset=utf-8";
    }

    //get the value from the KV store and return it if found
    const value = await env.MY_DEFAULT_KV_DEMO.get("hyperdrive.webp", 'arrayBuffer')
    if(!value){
      return new Response("Not found", {
        status: 404
      })
    }
    return new Response(value, {
      status: 200,
      headers: new Headers({
        "Content-Type": mimeType
      })
    });
});

app.get('/headers', (c) => {
	// Get all headers using c.req.header()
	const headers = c.req.header();
  
	// Return headers as a JSON response
	return c.json(headers);
  });
  

export default app;

// npx wrangler kv key put hyperdrive.webp --path ./static/hyperdrive.webp --binding MY_DEFAULT_KV_DEMO 
