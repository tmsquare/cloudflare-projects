import psycopg2
import time
import requests

# --------- DIRECT ACESSS ---------- #
db_params = {
    'host': 'xxxxxx',
    'database': 'xxxxx',
    'user': 'xxxxx',
    'password': 'xxxxxx',
}

start_time = time.time()

conn = psycopg2.connect(**db_params)
cursor = conn.cursor()

select_data_query = 'SELECT * FROM users;'

cursor.execute(select_data_query)
rows = cursor.fetchall()
end_time = time.time()

elapsed_time = (end_time - start_time) * 1000
print(f"Fetch 100 entries (RDS instance: North Virginia): {elapsed_time:.2f} milliseconds")


cursor.close()
conn.close()




# --------- HYPERDRIVE LINK -------- #

url = 'https://rds-hyperdrive.mouhamadou-cloudflare.workers.dev'

start_time = time.time()

response = requests.get(url)

end_time = time.time()
elapsed_time = (end_time - start_time) * 1000
print(f"Using a hyperdrive link: {elapsed_time:.2f} milliseconds")





 
#print(response.text)
#print(rows)

