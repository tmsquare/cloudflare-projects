import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { Hono } from 'hono';
import { HomePage } from './pages/home';
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";


const app = new Hono<{ Bindings: Env }>();

type Env = {
	IMAGE_WORKFLOW: Workflow;
	DB: D1Database;
	IMAGES_BUCKET: R2Bucket;
	OPENAI_API_KEY: string;
	SENDGRID_API_KEY: string;
};


// User-defined params passed to your workflow
type Params = {
	username: string;
	email: string;
	prompt: string;
};

export class MyImageWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {

		// STEP 1: Get the prompt image from OpenAI
		const apiResponse = await step.do(
			'Get promt image from OpenAI',
			{
				retries: {
					limit: 3,
					delay: '5 second',
					backoff: 'constant',
				},
				timeout: '10 minutes',
			},
			async () => {
				if (!event.payload.prompt) {
					throw new Error(`Was not able to get the prompt: ${event.payload.prompt}`);
				}
				const openaiResponse = await fetch("https://gateway.ai.cloudflare.com/v1/dd8b7ffe8b5030870e6bfa9c43df2dc1/tmsquare-ai-gateway", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"provider": "openai", 
						"endpoint": "images/generations", 
						"headers": { 
							Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
							"Content-Type": "application/json" 
						}, 
						"query": { 
							"model": "dall-e-2",
							"prompt": event.payload.prompt,
							"n": 1,
							"size": "1024x1024",
						} 
					}),
				});
				if (!openaiResponse.ok) {
					const error = await openaiResponse.text();
					throw new Error(`With your promnpt ${event.payload.prompt}, there is an error from OpenAI API: ${error}`);
				}
				const data = await openaiResponse.json();
				return JSON.stringify(data);
			}
		);

		// STEP 2: Store the image in R2
		const image_id = await step.do(
			'Store image to R2', 
			{
				retries: {
					limit: 3,
					delay: '5 second',
					backoff: 'constant',
				},
				timeout: '10 minutes',
			},
			async () => {
				
				const response = JSON.parse(apiResponse);
				const imageUrl = response.data[0]?.url;
		
				if (!imageUrl) {
					throw new Error("No image URL returned by OpenAI. Here is the response: " + JSON.stringify(response));
				}
		
				// Fetch the generated image
				const imageResponse = await fetch(imageUrl);
				const imageBlob = await imageResponse.blob();
		
				// Store the image in R2
				const fileName = `${crypto.randomUUID()}.png`;
				await this.env.IMAGES_BUCKET.put(fileName, imageBlob, {
					httpMetadata: { contentType: "image/png" },
				});

				return fileName;
			}
		);

		// STEP 3: Insert the subscriber into the database
		await step.do(
			'Log Entry to D1',
			{
				retries: {
					limit: 3,
					delay: '5 second',
					backoff: 'constant',
				},
				timeout: '10 minutes',
			},
			async () => {
				try{
					const query = `
						INSERT INTO subscribers (username, email, prompt, r2_image_id)
						VALUES (?, ?, ?, ?)
					`;
			
					const result = await this.env.DB.prepare(query)
					.bind(event.payload.username, event.payload.email, event.payload.prompt, image_id)
					.run();
				} catch (error) {
					throw new Error(`Error inserting into database: ${error}`);
				}
			},
		);

		// STEP 4: Send the email to the subscriber
		await step.do(
			"Send Email to Subscriber",
			{
			  retries: {
				limit: 3,
				delay: '10 second',
				backoff: "constant",
			  },
			  timeout: "30 seconds",
			},
			async () => {
			 
				const emailData = {
					personalizations: [
					{
						to: [{ email: event.payload.email }],
					},
					],
					from: {
					email: "workflows@tmsquare.net", 
					name: "Tmsquare Workflows",
					},
					subject: "Your Image is Ready 🚀",
					content: [
					{
					type: "text/html",
					value: `
<p>Hi ${event.payload.username},</p>

<p>Thank you for subscribing to <strong>Tmsquare Workflows</strong>! We're thrilled to have you on board.</p>

<p>We've received your prompt, and our team is working on generating your image based on your request: <strong>"${event.payload.prompt}"</strong>.</p>

<p>Your image is available here: <a href="https://dev.tmsquare.net/workflows/${image_id}">View Image</a></p>

<p>Thank you again for being part of the Tmsquare community. We're excited to bring your ideas to life!</p>

<p>Best regards,<br>The Tmsquare Workflows Team</p>
`,
					}
					],
				};
			
				const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
					method: "POST",
					headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.env.SENDGRID_API_KEY}`,
					},
					body: JSON.stringify(emailData),
				});
			
				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to send confirmation email: ${error}`);
				}
				  
			},
		  );

	}
}


app.get('/workflows', (c) => c.html(HomePage()));

app.post('/workflows/subscribe', async (c) => {

	let url = new URL(c.req.url);

	if (url.pathname.startsWith('/favicon')) {
		return Response.json({}, { status: 404 });
	}

	const subscriber_input = await c.req.json();
	

	// Spawn a new instance and pass the subscriber input
	let instance = await c.env.IMAGE_WORKFLOW.create({
        params: subscriber_input,
    });
	return Response.json({
		id: instance.id,
		details: await instance.status(),
	});

})


app.get('/workflows/:filename', async (c) => {
	const { filename } = c.req.param()
  
	try {
	  // Get the image from R2
	  const object = await c.env.IMAGES_BUCKET.get(filename)
	  
	  if (object === null) {
		return c.text('Image not found', 404)
	  }
  
	  // Get the image content and serve it
	  const image = await object.arrayBuffer()
	  return c.body(image, {
		headers: {
		  'Content-Type': 'image/png',
		}
	  })
	} catch (err) {
	  return c.text('Error fetching image. If your prompt was the name of a known person, try to change it', 500)
	}
  })

export default app;

