import { Hono } from 'hono';
import { homePage } from './pages/home';

export interface Env {
	AI: Ai;
}

interface AnalysisResponse {
	description: string;
  }
  
interface ErrorResponse {
	error: string;
}

interface ImageAnalysisResult {
	description?: string;
	[key: string]: any;
}


const app = new Hono<{ Bindings: Env }>()


app.get('/', async (c) => {
	return c.html(homePage());
});


app.post('/analyze', async (c) => {
	try {
	  const contentType = c.req.header('content-type') || '';
	  
	  // Validate content type
	  if (!contentType.startsWith('image/')) {
		return c.json({ error: 'Invalid content type. Expected an image.' } as ErrorResponse, 400);
	  }
	  
	  const imageBuffer = await c.req.arrayBuffer();
	  
	  if (!imageBuffer || imageBuffer.byteLength === 0) {
		return c.json({ error: 'Empty image data' } as ErrorResponse, 400);
	  }
	  
	  // Set proper content type header for JSON response
	  c.header('Content-Type', 'application/json');
	  
	  try {
		const result = await c.env.AI.run('@cf/unum/uform-gen2-qwen-500m', {
		  image: [...new Uint8Array(imageBuffer)],
		  prompt: "Describe the image in detail"
		}) as ImageAnalysisResult;
		
		return c.json({ 
		  description: result.description || 'Could not analyze the image.'
		} as AnalysisResponse);

	  } catch (aiError) {
		console.error('AI processing error:', aiError);
		return c.json({ 
		  error: 'Error analyzing the image with AI service.' +
				 (aiError instanceof Error ? ' ' + aiError.message : '')
		} as ErrorResponse, 500);
	  }
	} catch (error) {
	  console.error('Error processing request:', error);
	  return c.json({ 
		error: 'Failed to process the image.' +
			   (error instanceof Error ? ' ' + error.message : '')
	  } as ErrorResponse, 500);
	}
});


// Handle all other routes
app.all('*', async (c) => {
	return c.html(homePage(`<p>Page not found. <a href="/">Go back home</a></p>`));
});

export default app;