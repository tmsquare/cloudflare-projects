
# Getting started with Cloudflare KV

KV provides low-latency, high-throughput global storage to your Cloudflare Workers applications. KV is ideal for storing user configuration data, routing data, A/B testing configurations and authentication tokens, and is well suited for read-heavy workloads.
This is a blank project for CDK development with Python.

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev` 

### 1. Enable Workers KV in the dashboard
 Enable Workers KV for your account by purchasing the Workers Paid plan:
 1. Log in to the Cloudflare dashboard and select your account.
 2. Go to Workers & Pages > Plans.
 3. Select Purchase Workers Paid and complete the payment process to enable Workers KV.

### 2. Create a Worker project
```sh
$ make create_worker kv-demo
```
When setting up your `kv-demo` Worker, answer the questions as below:
*  Your directory has been titled kv-tutorial.
*  Choose `"Hello World" Worker` for the type of application.
*  Select `yes` to using TypeScript.
*  Select `yes` to using Git.
*  Select `no` to deploying.


### 3. Create a KV namespace

A KV namespace is a key-value database replicated to Cloudflare’s global network.
```sh
$ make create_namespace <NAMESPACE>
```

#### Bind your namespace to your worker
In your `wrangler.toml` file, add the following with the values generated in your terminal:
```wrangler.toml
kv_namespaces = [
    { binding = "<YOUR_BINDING>", id = "<YOUR_ID>" }
]
```

### 4. Interact with your KV namespace
```sh
$ make list_namespaces
$ make put_key <KEY> <VALUE> <NAMESPACE_ID
$ make get_key <KEY> <NAMESPACE_ID>
$ make list_keys <NAMESPACE_ID>
$ make delete_key <KEY> <NAMESPACE_ID>
```

### 5. Interact with your KV namespace (with workers)
Replace the `src/index.ts` file with the following code. And edit the values of `YOUR_KV_NAMESPACE`, `KEY` and `VALUE`

```js
export interface Env {
  	YOUR_KV_NAMESPACE: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    try {
      await env.YOUR_KV_NAMESPACE.put("KEY", "VALUE");
      const value = await env.YOUR_KV_NAMESPACE.get("KEY");
      if (value === null) {
        return new Response("Value not found", { status: 404 });
        }
      return new Response(value);
    } catch (err) {
      // In a production application, you could instead choose to retry your KV
      // read or fall back to a default code path.
      console.error(`KV returned error: ${err}`)
      return new Response(err, { status: 500 })
    }
	},
};
```

### 6. Deploy your KV to Cloudflare's global network
```sh
$ make deploy
```


Enjoy!
