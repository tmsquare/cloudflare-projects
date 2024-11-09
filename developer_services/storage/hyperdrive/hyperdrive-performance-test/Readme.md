
# Getting started with Cloudflare Hyperdrive

Turn your existing regional database into a globally distributed database.

## Prerequisites

 *  Sign up for a Cloudflare Account : `https://dash.cloudflare.com/sign-up`
 *  Install npm: `https://docs.npmjs.com/getting-started`
 *  Install Node.js: `https://nodejs.org/en/`
 *  Install Wrangler within your project using npm and Node.js: `npm install wrangler --save-dev` 
 *  A publicly accessible PostgreSQL database (on a different continent than yours) `https://neon.tech/`

## 1. Populate your postges DB
Install `psycopg2`
```sh
$ pip3 install psycopg2
```
Create the `app.py` and add the following snippet
```python
import psycopg2

# Replace these values with your database connection details
db_params = {
    'user': 'your_user',
    'host': 'your_host',
    'database': 'your_database',
    'password': 'your_password',
    'port': 5432,  # Default PostgreSQL port
}

# Connect to the PostgreSQL database
conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

# Create a 'users' table (if it doesn't exist)
create_table_query = '''
    CREATE TABLE IF NOT EXISTS USERS (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL
    );
'''
cursor.execute(create_table_query)
conn.commit()

# Insert data into the 'USERS' table using a for loop
entries_to_insert = 100

for i in range(1, entries_to_insert + 1):
    username = f'user{i}'
    email = f'user{i}@example.com'
    
    insert_data_query = f"INSERT INTO USERS (username, email) VALUES ('{username}', '{email}');"
    cursor.execute(insert_data_query)

# Commit the changes and close the connection
conn.commit()
cursor.close()
conn.close()
```
Execute the query
```sh
$ python3 app.py
```
## 2. Create a Hyperdrive connection
### 2.1 Login to your account
```sh
$ make login
```

### 2.2 Create a Worker project
```sh
$ make create_worker hd-demo
```
When setting up your `hd-demo` Worker, answer the questions as below:
*  Your directory has been titled kv-tutorial.
*  Choose `"Hello World" Worker` for the type of application.
*  Select `yes` to using TypeScript.
*  Select `yes` to using Git.
*  Select `no` to deploying.


### 3. Connect Hyperdrive to a database
```sh
make create_hyperdrive_conn <NAME> <CONNECTION_STRING>

# Example of <CONNECTION_STRING>:  postgres://USERNAME:PASSWORD@HOSTNAME_OR_IP_ADDRESS:PORT/database_name
```

#### Bind your namespace to your worker
In your `wrangler.toml` file, add the following with the values generated in your terminal:
```sh
node_compat = true # required for database drivers to function

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "a76axxxxx42644deb02c38d6xxxxxxxa" # the ID associated with the Hyperdrive you just created
```

### 4. Interact with Hyperdrive
```sh
make create_hyperdrive_conn <NAME> <CONNECTION_STRING>
make list_hyperdrive_conns
make delete_hyperdrive_conn <ID>
make get_hyperdrive_conn <ID>
```

### 5. Deploy your worker: "select * from users"
Install `node-postgres`
```sh
$ cd hd-demo
$ npm i pg
```
Replace the `src/index.ts` file with the following code.
```ts
import { Client } from 'pg';

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "HYPERDRIVE" with the variable name you defined.
	HYPERDRIVE: Hyperdrive;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		console.log(JSON.stringify(env))
		
		const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });

		try {
			// Connect to your database
			await client.connect();

			// Test query
			const result = await client.query({ text: 'SELECT * FROM USERS' });

			// Return result rows as JSON
			return Response.json({ result: result });
		} catch (e) {
			console.log(e);
			return Response.json({ error: JSON.stringify(e) }, { status: 500 });
		}
	},
};
```

### 6. Deploy your worker to Cloudflare
```sh
$ make deploy
```

## 3. Test the performances
Create an environment variable for your worker's public URL
```sh
$ export hd_worker = YOUR_WORKER_URL
```
Edit the `app.py` file with the following snippet:
```python
import psycopg2
import time
import requests

# --------- DIRECT ACESSS ---------- #
# Replace these values with your database connection details
db_params = {
    'user': 'your_user',
    'host': 'your_host',
    'database': 'your_database',
    'password': 'your_password',
    'port': 5432,  # Default PostgreSQL port
}

# Start the timer
start_time = time.time()

conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

select_data_query = 'SELECT * FROM users;'

cursor.execute(select_data_query)
rows = cursor.fetchall()

# End the timer
end_time = time.time()

elapsed_time = (end_time - start_time) * 1000
print(f"Fetch 100 entries (RDS instance: North Virginia): {elapsed_time:.2f} milliseconds")


cursor.close()
conn.close()



# --------- HYPERDRIVE LINK -------- #
url = 'https://rds-hyperdrive.mouhamadou-cloudflare.workers.dev'

# Start the timer
start_time = time.time()

response = requests.get(url)

# Start the timer
end_time = time.time()
elapsed_time = (end_time - start_time) * 1000

print(f"Using a hyperdrive link: {elapsed_time:.2f} milliseconds")

 
#print(response.text)
#print(rows)
```
Execute the script two times
```sh
$python3 ../app.py # Execution 1

$python3 ../app.py # Execution 2
```

You will notice that during the first execution, both of the queries (Direct access and Hyperdrive) will have approximatively the same latency. 

During the second execution, hyperdrive will outperform the direct access query because it used a `warm open connection` to your database and by default, it has a `max-age` set at 60s (which is the cache TTL)
