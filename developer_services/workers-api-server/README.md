# Cloudflare API server with workers

Cloudflare Workers is a serverless application platform for deploying your projects across Cloudflare's massive distributed network. Deploying your API application to the edge is a huge opportunity to build consistent low-latency API servers, with the added benefits of "serverless" (I know, the project has `server` in it): usage-based pricing, no cold starts, and instant, easy-to-use deployment software, using Wrangler.

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev`

## 1. Copy the wrangler file and configure
```sh
cp wrangler.example.toml wrangler.toml
```

## 2. Install the dependencies
```sh
npm install
```

## 3. Set up FAUNA
### 3.1 ​​Create your database
Open the [Fauna dashboard](https://dashboard.fauna.com/register) in your browser and log in to your Fauna account. 
In the Fauna dashboard:
1. Select CREATE DATABASE.
2. Provide a valid name.
3. Select a Region Group.
4. Select CREATE.

### 3.2 Create a collection
To create three collections named Products, Users and Posts. 
Enter the FQL query in the SHELL window on right side of the screen.
```sql
Collection.create({ name: "Products" })
Collection.create({ name: "Posts" })
Collection.create({ name: "Users" })
```

### 3.3 Create a secret key
You must create a secret key to connect to the database from your Worker.

To create a secret key:
1. Go to Explorer in the Fauna dashboard.
2. Hover over your database name, and select the key icon to manage your keys.
3. Choose Server Role and enter a key name.

The Fauna dashboard displays the key’s secret. Copy and save this server key to use in a later step.

## 4. Add your Fauna secret key as a secret
```sh
npx wrangler secret put FAUNA_SECRET
```
When prompted, paste the Fauna server secret you obtained earlier.

## 5. Test
Deploy your worker on your local machine to test
```sh
wrangler dev
```

## 5. Deployment
Deploy your worker on Cloudflare Edge
```sh
wrangler deploy
```

## 6. Link with your domain
- 1. Connect to Cloudflare dashboard
- 2. Click on `Workers & Pages` then `workers-graphql-server`
- 3. Go to `Settings` after `Triggers` 
- 4. There you can `Add Custom Domain` to your worker. Example: `api.your_domain`
- 5. Now your graphql server is publicly accessible via `https://api.YOUR_DOMAIN`
