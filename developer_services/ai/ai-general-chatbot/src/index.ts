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

	  const stream = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", input);
  
	  return new Response(stream, {
		headers: { "content-type": "text/event-stream" },
	  });
	  
  },
);

app.post('/ai/chatbot/generate-image', async (c) => {

    const input = await c.req.text();

	if (!input) return c.json({ error: 'Prompt is required' }, 400);
	  
	  const inputs = {
		prompt: input,
	  };
  
	  const response = await c.env.AI.run( "@cf/bytedance/stable-diffusion-xl-lightning", inputs);
  
	  return new Response(response, {
		headers: {
		  "content-type": "image/jpg",
		},
	  });
	  
  },
);

app.post("/ai/chatbot/send-voice", async (c) => {
	try {
	  // Step 1: Retrieve audio from the request
	  const audioBlob = await c.req.arrayBuffer();
	  const audioArray = [...new Uint8Array(audioBlob)];
	  
  
	  // Step 2: Process audio with Whisper model
	  const whisperInput = { audio: audioArray };
	  const whisperResponse = await c.env.AI.run(
		"@cf/openai/whisper-tiny-en",
		whisperInput
	  );
  
	  if (!whisperResponse || !whisperResponse.text) {
		return c.json({ error: "Failed to transcribe audio." }, 500);
	  }
	  const transcribedText = whisperResponse.text;
  
	  // Step 3: Pass transcription to Llama-3 model
	  const llamaInput = {
		messages: [
		  {
			role: "system",
			content:
			  "You are a friendly assistant that helps in every question the user might have.",
		  },
		  {
			role: "user",
			content: transcribedText,
		  },
		],
		stream: true,
	  };
  
	  const llamaStream = await c.env.AI.run(
		"@cf/meta/llama-3-8b-instruct",
		llamaInput
	  );
  
	  // Step 4: Stream the response back to the client
	  return new Response(llamaStream, {
		headers: { "Content-Type": "text/event-stream" },
	  });
	} catch (error) {
	  console.error("Error processing voice input:", error);
	  return c.json({ error: "An error occurred while processing the request." }, 500);
	}
  });
  
export default app;

