# Cloudflare Workers graphql-server

An [Apollo GraphQL](https://www.apollographql.com/) server, built with [Cloudflare Workers](https://workers.cloudflare.com). [Try a demo by looking at a deployed GraphQL playground](https://graphql-on-workers.signalnerve.com/___graphql).

Why this rules: Cloudflare Workers is a serverless application platform for deploying your projects across Cloudflare's massive distributed network. Deploying your GraphQL application to the edge is a huge opportunity to build consistent low-latency API servers, with the added benefits of "serverless" (I know, the project has `server` in it): usage-based pricing, no cold starts, and instant, easy-to-use deployment software, using Wrangler.


## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev`

## 1. Configuration
You'll need to configure your project's `wrangler.toml` file to prepare your project for deployment. Basically you just need uncomment the `KV` section and add your Cloudflare `KV namespace ID`, if you want CF to cache the most requested data at the edge. 

To start using the project, configure your `graphQLOptions` object in `src/index.js`:

```js
const graphQLOptions = {
  baseEndpoint: '/', // String
  playgroundEndpoint: '/___graphql', // ?String
  forwardUnmatchedRequestsToOrigin: false, // Boolean
  debug: false, // Boolean
  cors: true, // Boolean or Object to further configure
  kvCache: false, // Boolean
}
```

## 2. Test
Deploy your worker on your local machine to test
```sh
wrangler dev
```

The source for this project includes an example external REST data source, and defined types for the [FakestoreAPI](https://fakestoreapi.com/), as an example of how to integrate external APIs. Once you have the worker available, try this query as a sanity check:

```graphql
query Carts {
    carts {
        id
        date
        user {
            firstname
            lastname
        }
        products {
            product {
                title
            }
        }
    }
}
```

## 3. Deployment
Deploy your worker on Cloudflare Edge
```sh
wrangler deploy
```

## 4. Link with your domain
- 1. Connect to Cloudflare dashboard
- 2. Click on `Workers & Pages` then `workers-graphql-server`
- 3. Go to `Settings` after `Triggers` 
- 4. There you can `Add Custom Domain` to your worker. Example: `api.your_domain`
- 5. Now your graphql server is publicly accessible via `https://api.YOUR_DOMAIN`

## 5. Additional infos
### Endpoints

Make requests to your GraphQL server at the `baseEndpoint` (e.g. `graphql-on-workers.dev.com/`) and, if configured, try GraphQL queries at the `playgroundEndpoint` (e.g. `graphql-on-workers.dev/_graphql`).

### Origin forwarding

If you run your GraphQL server on a domain already registered with Cloudflare, you may want to pass any unmatched requests from inside your Workers script to your origin: in that case, set `forwardUnmatchedRequestToOrigin` to true (if you're running a GraphQL server on a [Workers.dev](https://workers.dev) subdomain, the default of `false` is fine).

### Debugging

While configuring your server, you may want to set the `debug` flag to `true`, to return script errors in your browser. This can be useful for debugging any errors while setting up your GraphQL server, but should be disabled on a production server.

### CORS

By default, the `cors` option allows cross-origin requests to the server from any origin. You may wish to configure it to whitelist specific origins, methods, or headers. To do this, change the `cors` option to an object:

```js
const graphQLOptions = {
  // ... other options ...

  cors: {
    allowCredentials: 'true',
    allowHeaders: 'Content-type',
    allowOrigin: '*',
    allowMethods: 'GET, POST, PUT',
  },
}
```

Note that by default, any field that you _don't_ pass here (e.g. `allowMethods`) will fallback to the default value. See `utils/setCors.js` for the default values for these fields.

### REST caching

Version 1.1.0 of this project includes support for caching external requests made via instances of [`RESTDataSource`](https://www.apollographql.com/docs/apollo-server/features/data-sources/), using KV. To use caching in your project, [create a new KV namespace](https://workers.cloudflare.com/docs/reference/storage/writing-data), and in `wrangler.toml`, configure your namespace, calling it `WORKERS_GRAPHQL_CACHE`:

```toml
# wrangler.toml

[[kv-namespaces]]
binding = "WORKERS_GRAPHQL_CACHE"
id = "$myId"
```

With a configured KV namespace set up, you can opt-in to KV caching by changing the `kvCache` config value in `graphQLOptions` (in `index.js`) to `true`.

## License

This project is licensed with the [MIT License](https://github.com/cloudflare/workers-graphql-server/blob/master/LICENSE).
