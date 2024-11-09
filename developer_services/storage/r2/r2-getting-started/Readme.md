
# Getting started with Cloudflare R2

Cloudflare R2 Storage allows developers to store large amounts of unstructured data without the costly egress bandwidth fees associated with typical cloud storage services.

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev` 

### 1. Login to your account
```sh
$ make login
```

### 2. Create a Worker project
```sh
$ make create_worker r2-demo
```
When setting up your `r2-demo` Worker, answer the questions as below:
*  Your directory has been titled kv-tutorial.
*  Choose `"Hello World" Worker` for the type of application.
*  Select `no` to using TypeScript.
*  Select `no` to using Git.
*  Select `no` to deploying.


### 3. Create a Bucket
```sh
$ make create_bucket <NAME>
```

#### Bind your namespace to your worker
In your `wrangler.toml` file, add the following with the values generated in your terminal:
```wrangler.toml
[[r2_buckets]]
binding = 'MY_BUCKET' # <~ valid JavaScript variable name
bucket_name = '<YOUR_BUCKET_NAME>'
```

### 4. Interact with your buckets
```sh
$ make delete_bucket <NAME>
$ make list_buckets
$ make get_object <BUCKET> <KEY> <LOCAL_PATH>
$ make put_object <BUCKET> <KEY> <PATH_TO_FILE>
$ make delete_object <BUCKET> <KEY>
```

### 5. Access your R2 bucket from your Worker
Replace the `src/index.js` file with the following code. 

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    switch (request.method) {
      case 'PUT':
        await env.MY_BUCKET.put(key, request.body);
        return new Response(`Put ${key} successfully!`);
      case 'GET':
        const object = await env.MY_BUCKET.get(key);

        if (object === null) {
          return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      case 'DELETE':
        await env.MY_BUCKET.delete(key);
        return new Response('Deleted!');

      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: {
            Allow: 'PUT, GET, DELETE',
          },
        });
    }
  },
};
```

### 6. Deploy your worker to Cloudflare's global network
```sh
$ make deploy
```


Enjoy!
