import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>()



// Hono routes 
app.get('/worker/word-count/*', async (c) => {
	const docMessage = `
	From Laptop to Lambda 🔥
	
	This worker accepts a POST request with a raw file (JSON, CSV, TXT) and counts the number of occurrences of a given keyword.
	
	### Example POST Request
	POST /?action=wc-execute&keyWord=YOUR_KEYWORD 
	BODY: raw bytes of your file (JSON, CSV, TXT) -> with open(filename, "rb") as file
	MAX_BODY_SIZE: 5MB
	
	### Response
	The keyword "example" appeared 3 times.
		`;
	
	return new Response(docMessage, {
		status: 200,
		headers: { "Content-Type": "text/plain" },
	});

	
});

app.post('/worker/word-count/*', async (c) => {

  
	const url = new URL(c.req.url);
	const action = url.searchParams.get("action");
	const request: Request = c.req.raw

	if (action === null) {
		return new Response("Missing action type", { status: 400 });
	}

	switch (action) {
		case "wc-execute": {
			const keyWord = url.searchParams.get("keyWord");
			if (!keyWord) {
			  return new Response("Missing keyWord", {
				status: 400,
			  });
			}
			if (!request.body) {
			  return new Response("Missing request body", { status: 400 });
			}

			const rawText = await decodeStreamToText(request.body as ReadableStream<Uint8Array>);
			const numberOfOccurence = countKeywordOccurrences(rawText, keyWord)
			console.log(numberOfOccurence)
			return new Response(numberOfOccurence);

		  }
		default:
		  return new Response(`Unknown action ${action} for POST`, {
			status: 400,
		  });
	}

	// Efficiently decode the stream to text
	async function decodeStreamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
		const decoder = new TextDecoderStream();
		const reader = stream.pipeThrough(decoder).getReader();
		let result = '';
	
		while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		result += value || '';
		}
	
		return result;
	}

	function countKeywordOccurrences(text: string, keyWord: string): string {
		// Create a case-insensitive regex for partial matches of the keyword
		const regex = new RegExp(keyWord, 'gi'); // 'g' for global, 'i' for case-insensitive
		return (text.match(regex) || []).length.toString();
	}
});


export default app;

  