export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
  }
  
  export default {
	async fetch(request, env): Promise<Response> {
	  const { pathname } = new URL(request.url);

		
	  if (pathname === "/get_all") {
		const { results } = await env.DB.prepare(
		  "SELECT * FROM users;"
		).all();
		return Response.json(results);
	  }

	  if (request.method === 'POST' && pathname === "/insert") {
		// Get the request data
		const { headers } = request;	
		const contentType = headers.get('content-type') || '';
		let req_data: any  = {}
		if (contentType.includes('application/json')) {
			req_data = await request.json();
		}
		
		// Prepare my insert statement
		const array_query = [];
		const INSERT_STMT = await env.DB.prepare(
			`INSERT INTO users ('Name', 'Age', 'Email', 'Country'
			  ) VALUES (?, ?, ?, ?)`
		).bind(req_data["Name"], req_data["Age"], 
			   req_data["Email"], req_data["Country"]
		);

		// Push the data to D1
		array_query.push(INSERT_STMT)
		await env.DB.batch(array_query);

		// Return message
		return new Response(
			"Data Successfully inserted to D1"
		);
	  }
  
	  return new Response(
		"Nothing to see here"
	  );
	},
  } satisfies ExportedHandler<Env>;