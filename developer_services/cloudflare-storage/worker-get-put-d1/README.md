# Cloudflare D1 + Worker

[Cloudflare Workers](https://workers.cloudflare.com) is a serverless application platform for deploying your projects across Cloudflare's massive distributed network. 
[D1](https://developers.cloudflare.com/d1/) is Cloudflare’s native serverless database. D1 allows you to build applications that handle large amounts of users at no extra cost. 


## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev`
 *  Deploy a D1 database on Cloudflare and create a `users` table with the following columns: `Name`, `Age`, `Email` and `Country`

## 1. Copy the wrangler file and configure
```sh
cp wrangler.example.toml wrangler.toml
```
You'll need to configure your project's `wrangler.toml` file to prepare your project for deployment. Basically you just need uncomment the `d1_databases` section and add your Cloudflare `D1 database ID` and `D1 database name`. 


## 2. Install the dependencies
```sh
npm install
```

## 3. Test
Deploy your worker on your local machine to test
```sh
wrangler dev
```

## 4. Deployment
Deploy your worker on Cloudflare Edge
```sh
wrangler deploy
```

## 5. Link with your domain
- 1. Connect to Cloudflare dashboard
- 2. Click on `Workers & Pages` then `workers-graphql-server`
- 3. Go to `Settings` after `Triggers` 
- 4. There you can `Add Custom Domain` to your worker. Example: `d1.your_domain`
- 5. Now your graphql server is publicly accessible via `https://d1.YOUR_DOMAIN`

## 6. Get and Put data
### Get all the users
```sh
$ curl https://d1.YOUR_DOMAIN/get_all
```
### Create a new user
```sh
$ curl -X POST -H "Content-Type: application/json" -d '{"Name":"John","Age":23,"Email":"jonh@tmail.com","Country":"Senegal"}'  https://d1.YOUR_DOMAIN/insert
```

Note: You can edit the function's behavior by editing the `./src/index.ts` file
