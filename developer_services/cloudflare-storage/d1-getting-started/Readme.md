
# Getting started with Cloudflare D1

D1 is Cloudflare’s native serverless SQL database. D1 allows you to build applications that handle large amounts of users at no extra cost

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev` 

## 1. Create a database

### 1.1 Login to your account
```
$ make login
```

### 1.2 Create a Worker project
```
$ make create_worker d1-worker
```
When setting up your `d1-worker` Worker, answer the questions as below:
*  Your directory has been titled kv-tutorial.
*  Choose `"Hello World" Worker` for the type of application.
*  Select `yes` to using TypeScript.
*  Select `yes` to using Git.
*  Select `no` to deploying.


### 1.3 Create a database
```
make create_database test_d1
```

#### Bind your namespace to your worker
In your `wrangler.toml` file, add the following with the values generated in your terminal:
```wrangler.toml
[[d1_databases]]
binding = "DB" # available in your Worker on env.DB
database_name = "test_d1"
database_id = "<unique-ID-for-your-database>"
```

### 1.4 Run a query against your D1 database
Create a `schema.sql` file
```
$ cd d1-worker
$ touch schema.sql
```
Append the following snippet
```
DROP TABLE IF EXISTS RL_table;
CREATE TABLE IF NOT EXISTS RL_table (rl_count INTEGER PRIMARY KEY, time_stamp TEXT, IP TEXT, flag TEXT);
INSERT INTO RL_table (rl_count, time_stamp, IP, flag) VALUES (3, '2023-12-19T00:00:00Z', '74.59.85.39', 'blocked'), (7, '2023-12-19T00:01:00Z', '34.59.85.39', 'not_blocked'), (20, '2024-12-19T00:00:00Z', '192.59.85.39', 'blocked'), (13, '2023-02-19T00:00:00Z', '13.13.58.93', 'blocked');
```
Create the `RL_table`
```
$ make exucute_query test_d1 schema.sql
```
Interact with D1
```
$ make list_databases
$ make delete_database <DATABASE_NAME>
$ make exucute_query <DATABASE_NAME> <PATH_TO_SQL_COMMANDS_FILE>
```

### 1.5 Interact with your D1 (with workers)
Replace the `src/index.ts` file with the following code.
```
export interface Env {
  // If you set another name in wrangler.toml as the value for 'binding',
  // replace "DB" with the variable name you defined.
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/beverages") {
      // If you did not use `DB` as your binding name, change it here
      const { results } = await env.DB.prepare(
        "SELECT * FROM RL_table"
      ).all();
      return Response.json(results);
    }

    return new Response(
      "Call /api/beverages to see everyone who works at Bs Beverages"
    );
  },
};
```

### 1.6 Deploy your worker to Cloudflare's global network
```
$ make deploy
```

Now you can get all the elements of the `RL_table` from your worker's public URL


## 2. Interact with D1 using a Flask server 
```
$ cd ../d1-app & pip3 install Flask
```
Create your environment variables
```
$ export account_ID       = YOUR_CLOUDFLARE_ACCOUNT_ID
$ export cloudflare_EMAIL = YOUR_CLOUDFLARE_ACCOUNT_EMAIL
$ export cloudflare_Token = YOUR_CLOUDFLARE_ACCOUNT_TOKEN
$ export database_ID      = YOUR_D1_DATABASE_ID            # "test_d1" db 
```
Run the python server
```
$ python3 app.py
```
Your server is now reachable on `http://localhost:5000`