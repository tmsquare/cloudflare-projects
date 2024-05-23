from flask import Flask, render_template, request, jsonify
import os, requests

account_identifier  = os.environ.get("account_ID ")
database_identifier = os.environ.get("database_ID")
headers = {
    'X-Auth-Email': os.environ.get("cloudflare_EMAIL"),
    'X-Auth-Key': os.environ.get("cloudflare_Token"),
    'Content-Type': 'application/json',
}

url = f"https://api.cloudflare.com/client/v4/accounts/{account_identifier}/d1/database/{database_identifier}/query"


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/crud', methods=['POST'])
def crud():
    try:
        data = request.json  # Access JSON data directly
        operation = data.get('operation')
        
        # Implement your CRUD operations based on the selected operation
        if operation == 'create':
            print("Create")
            print(data)
            req_data = {
                "sql": f"INSERT INTO {data['table']} (time_stamp, IP, rl_count, flag) VALUES ('{data['time_stamp']}', '{data['IP']}', {data['rl_count']}, '{data['flag']}');"
            }
            response = requests.post(url, headers=headers, json=req_data)
            if response.status_code == 200:
                print("Data successfully created")            
            else:
                print(f"Error: {response.status_code}")
                print(response.text)

        elif operation == 'update':
            print("Update")
            req_data = {
                "sql": f"UPDATE {data['table']} SET rl_count = '{data['rl_count']}', flag = '{data['flag']}', IP = '{data['IP']}' WHERE IP = '{data['IP']}';"
            }
            response = requests.post(url, headers=headers, json=req_data)
            if response.status_code == 200:
                print("Data successfully updated")              
            else:
                print(f"Error: {response.status_code}")
                print(response.text)

        elif operation == 'delete':
            print("Delete")
            req_data = {
                "sql": f"DELETE FROM {data['table']} WHERE IP = '{data['IP']}';"
            }
            response = requests.post(url, headers=headers, json=req_data)
            if response.status_code == 200:
                print("Data successfully deleted")              
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
        else:
            return jsonify({'error': 'Invalid operation'})

        return jsonify({'success': f'{operation.capitalize()} operation successful'})
    except Exception as e:
        return jsonify({'error': str(e)})
    

@app.route('/api/tables', methods=['GET'])
def get_tables():
    try:
        selected_database = request.args.get('database')
        req_data = {
            "sql": f"SELECT name FROM sqlite_master WHERE type='table';"
        }
        response = requests.post(url, headers=headers, json=req_data)

        if response.status_code == 200:
            if selected_database == "test_d1":    
                tables = [table['name'] for table in response.json()['result'][0]['results'] if table['name'] != '_cf_KV' ]  
            else:
                tables = []      
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
        
        return jsonify({'tables': tables})
    except Exception as e:
        return jsonify({'error': str(e)})
    
@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        selected_database = request.args.get('database')
        selected_table = request.args.get('table')

        req_data = {
            "sql": f"SELECT * FROM {selected_table};"
        }
        response = requests.post(url, headers=headers, json=req_data)

        if response.status_code == 200:  
            data = response.json()['result'][0]['results']      
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
  
        # Render data as an HTML table
        result_html = render_template('data_table.html', data=data)
        return result_html
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)