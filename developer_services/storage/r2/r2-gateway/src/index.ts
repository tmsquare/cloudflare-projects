import { Hono } from 'hono';
import { homePage } from './pages/home';

export interface Env {
	MY_TMSQUARE_BUCKET: R2Bucket;
	R2UPLOAD_PSK: string;
}

const app = new Hono<{ Bindings: Env }>();

const getContentType = (fileName: string): string => {
	const extension = fileName.split('.').pop()?.toLowerCase();
	switch (extension) {
	  case 'jpg':
	  case 'jpeg':
	  case 'png':
	  case 'gif':
	  case 'webp':
		return 'image/' + extension;
	  case 'pdf':
		return 'application/pdf';
	  case 'txt':
		return 'text/plain';
	  case 'json':
		return 'application/json';
	  case 'js':
		return 'application/javascript';
	  case 'html':
		return 'text/html';
	  case 'css':
		return 'text/css';
	  case 'mp4':
		return 'video/mp4';
	  case 'webm':
		return 'video/webm';
	  case 'ogg':
		return 'video/ogg';
	  default:
		return 'application/octet-stream';
	}
};


// Home route: Show a list of objects in the bucket
app.get('/r2', async (c) => {
  const listResult = await c.env.MY_TMSQUARE_BUCKET.list();
  const items = listResult.objects.map(obj => obj.key);
  return c.html(homePage(items));
});

// View a single object with Content-Type based on file extension
app.get('/r2/items/:id', async (c) => {
	const id = c.req.param('id');
	const object = await c.env.MY_TMSQUARE_BUCKET.get(id);
	if (!object) return c.text('Item not found', 404);
  
	const contentType = getContentType(id);
	const headers = { 
		'Content-Type': contentType,
		'Content-Disposition': ""
	};
  
	// Inline preview for certain types
	if (contentType.startsWith('image/') || contentType === 'application/pdf' || contentType.startsWith('text/') || contentType === 'application/json') {
	  return new Response(object.body, { headers });
	}
  
	// Force download for other types
	headers['Content-Disposition'] = `attachment; filename="${id}"`;
	return new Response(object.body, { headers });
  });

// Upload a new object (requires secret)
app.post('/r2/items', async (c) => {
	const formData = await c.req.parseBody();
	const file = formData['file'] as File;
	const userId = formData['userId']?.toString();
  
	if (!file || !userId) return c.text('Missing file or secret', 400);

	if (userId != c.env.R2UPLOAD_PSK) return c.text('Not authorized', 403);
  
	const fileKey = `${file.name}`;  // Save the file with the User ID prefix
	await c.env.MY_TMSQUARE_BUCKET.put(fileKey, file.stream());
	return c.redirect('/r2');
});

// Delete an object (requires secret)
app.post('/r2/delete', async (c) => {
	const formData = await c.req.parseBody();
	const userId = formData['userId']?.toString();
	const object = formData['objectName']?.toString();
  
	// Verify userId matches the stored secret
	if (!userId || userId !== c.env.R2UPLOAD_PSK) {
	  return c.text('Unauthorized: Incorrect User ID', 403);
	}
  
	await c.env.MY_TMSQUARE_BUCKET.delete(object);
	return c.redirect('/r2');
  });

export default app;