import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>()

export interface Env{
	MY_WORD_COUNT_BUCKET: R2Bucket
}

// Hono routes 
app.get('/r2/multipart/*', async (c) => {
	const bucket = c.env.MY_WORD_COUNT_BUCKET;
  
	const url = new URL(c.req.url);
	const key = url.pathname.split("/").pop() || ""; //  "filename" from /r2/multipart/filename
	const action = url.searchParams.get("action");

	if (action === null) {
		return new Response("Missing action type", { status: 400 });
	}

	if (action !== "get") {
		return new Response(`Unknown action ${action} for GET`, {
		  status: 400,
		});
	  }
	  const object = await bucket.get(key);
	  if (!object) {
		return new Response("Object Not Found", { status: 404 });
	  }
	  const headers = new Headers();
	  object.writeHttpMetadata(headers);
	  headers.set("etag", object.httpEtag);
	  return new Response(object.body, { headers });
});

app.post('/r2/multipart/*', async (c) => {
	const bucket = c.env.MY_WORD_COUNT_BUCKET;
  
	const url = new URL(c.req.url);
	const key = url.pathname.split("/").pop() || ""; //  "filename" from /r2/multipart/filename
	const action = url.searchParams.get("action");

	if (action === null) {
		return new Response("Missing action type", { status: 400 });
	}

	switch (action) {
		case "mpu-create": {
		  const multipartUpload = await bucket.createMultipartUpload(key);
		  return new Response(
			JSON.stringify({
			  key: multipartUpload.key,
			  uploadId: multipartUpload.uploadId,
			})
		  );
		}
		case "mpu-complete": {
		  const uploadId = url.searchParams.get("uploadId");
		  if (uploadId === null) {
			return new Response("Missing uploadId", { status: 400 });
		  }

		  const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

		  interface CompleteBody {
			parts: R2UploadedPart[];
		  }
		  const completeBody = (await c.req.json()) as CompleteBody;
		  if (completeBody === null) {
			return new Response("Missing or incomplete body", {
			  status: 400,
			});
		  }

		  // Error handling in case the multipart upload does not exist anymore
		  try {
			const object = await multipartUpload.complete(completeBody.parts);
			return new Response(null, {
			  headers: {
				etag: object.httpEtag,
			  },
			});
		  } catch (error: any) {
			return new Response(error.message, { status: 400 });
		  }
		}
		default:
		  return new Response(`Unknown action ${action} for POST`, {
			status: 400,
		  });
	  }

	
});

app.put('/r2/multipart/*', async (c) => {
	const bucket = c.env.MY_WORD_COUNT_BUCKET;
  
	const url = new URL(c.req.url);
	const key = url.pathname.split("/").pop() || ""; //  "filename" from /r2/multipart/filename
	const action = url.searchParams.get("action");
	const request: Request = c.req.raw

	if (action === null) {
		return new Response("Missing action type", { status: 400 });
	}

	switch (action) {
		case "mpu-uploadpart": {
		  const uploadId = url.searchParams.get("uploadId");
		  const partNumberString = url.searchParams.get("partNumber");
		  if (!uploadId || !partNumberString) {
			return new Response("Missing partNumber or uploadId", {
			  status: 400,
			});
		  }
		  if (!request.body) {
			return new Response("Missing request body", { status: 400 });
		  }

		  const partNumber = parseInt(partNumberString, 10);
		  const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
		  try {
			const uploadedPart: R2UploadedPart =
			  await multipartUpload.uploadPart(partNumber, request.body);
			return new Response(JSON.stringify(uploadedPart));
		  } catch (error: any) {
			return new Response(error.message, { status: 400 });
		  }
		}
		default:
		  return new Response(`Unknown action ${action} for PUT`, {
			status: 400,
		  });
	  }

	
});

app.delete('/r2/multipart/*', async (c) => {
	const bucket = c.env.MY_WORD_COUNT_BUCKET;
  
	const url = new URL(c.req.url);
	const key = url.pathname.split("/").pop() || ""; //  "filename" from /r2/multipart/filename
	const action = url.searchParams.get("action");

	if (action === null) {
		return new Response("Missing action type", { status: 400 });
	}

	switch (action) {
		case "mpu-abort": {
		  const uploadId = url.searchParams.get("uploadId");
		  if (!uploadId) {
			return new Response("Missing uploadId", { status: 400 });
		  }
		  const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

		  try {
			await multipartUpload.abort();
		  } catch (error: any) {
			return new Response(error.message, { status: 400 });
		  }
		  return new Response(null, { status: 204 });
		}
		case "delete": {
		  await bucket.delete(key);
		  return new Response(null, { status: 204 });
		}
		default:
		  return new Response(`Unknown action ${action} for DELETE`, {
			status: 400,
		  });
	  }
});


export default app;

  