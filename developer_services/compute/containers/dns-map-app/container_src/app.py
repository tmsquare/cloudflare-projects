from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for
import re
import os
import logging
import json
import time
from dns_map_for_flask import DNS_MAP
import threading

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('dns_app')

os.makedirs('templates', exist_ok=True)
os.makedirs('temp', exist_ok=True)

# Will try in sequence if one fails
SECURITY_TRAILS_API_KEYS = [
    "RcVTEVUGf24wOdjMnNl4izb0o3-v_dHl",    
    "YOUR_SECONDARY_API_KEY_HERE",  
    "YOUR_TERTIARY_API_KEY_HERE"    
]

app = Flask(__name__)



# Run cleanup on a timer
cleanup_thread = None
CLEANUP_INTERVAL = 300  # Cleanup every 5 minutes


@app.route('/', methods=['GET', 'POST'])
def dns_mapping():
    if request.method == 'POST':
        try:
            # Get domain from request
            if request.is_json:
                data = request.get_json()
                domain = data.get('domain', '')
            else:
                domain = request.form.get('domain', '')
                
            logger.info(f"Processing DNS mapping request for domain: {domain}")
                
            if not validate_apex_domain(domain):
                error_msg = f"Invalid domain format: {domain}. Please enter a valid apex domain (e.g., example.com)."
                logger.warning(error_msg)
                return jsonify({'error': error_msg, 'success': False}), 400
            
            try:
                dns_mapper = DNS_MAP(apex_domain=domain, security_trails_api_keys=SECURITY_TRAILS_API_KEYS)
                
                mapped_dns_hosts, mx_records, a_records, secure_subdomains, access_subdomains, \
                    remote_subdomains, api_subdomains, vpn_subdomains, all_subdomains, security_trails_error = dns_mapper.dns_map()
                
                results = {
                    'domain': domain,
                    'dns_providers': mapped_dns_hosts,  
                    'email_hosting': mx_records,       
                    'it_workload': a_records,           
                    'zero_trust': {
                        'secure': secure_subdomains,
                        'access': access_subdomains,
                        'remote': remote_subdomains,
                        'vpn': vpn_subdomains
                    },
                    'api_domains': api_subdomains,
                    'all_subdomains': all_subdomains,
                    'security_trails_error': security_trails_error,
                    'success': True
                }
                
                logger.info(f"Successfully processed DNS mapping for {domain}")
                
                # Schedule a cleanup for this domain's file in 1 minute
                threading.Timer(60, lambda: cleanup_domain_file(domain)).start()
                
                # If it's an AJAX request, return JSON
                if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify(results)
                
                # Otherwise render the template with the results
                return render_template('dns_map.html', results=results)
                
            except Exception as e:
                error_msg = f"Error processing DNS mapping for {domain}: {str(e)}"
                logger.error(error_msg)
                if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'error': error_msg, 'success': False}), 500
                else:
                    return render_template('dns_map.html', error=error_msg)
                
        except Exception as e:
            logger.error(f"Unhandled exception in dns_mapping route: {str(e)}")
            return jsonify({'error': f"An unexpected error occurred: {str(e)}", 'success': False}), 500
    
    return render_template('dns_map.html')

@app.route('/dns/progress/<domain>', methods=['GET'])
def dns_progress(domain):
    try:
        # Clean domain input to prevent path traversal
        domain = re.sub(r'[^\w\.-]', '', domain)
        
        # Read progress from temporary file
        progress_file = f'temp/progress_{domain}.json'
        
        if os.path.exists(progress_file):
            with open(progress_file, 'r') as f:
                try:
                    progress = json.load(f)
                    
                    # Check if completed and it's time to delete the file
                    if progress.get('completed') and 'timestamp' in progress:
                        completion_time = progress.get('timestamp', 0)
                        # If completed more than 60 seconds ago, clean up the file
                        if time.time() - completion_time > 60:
                            try:
                                os.remove(progress_file)
                                logger.info(f"Cleaned up completed progress file for {domain}")
                            except Exception as e:
                                logger.warning(f"Could not remove progress file for {domain}: {str(e)}")
                    
                    return jsonify(progress)
                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding progress file for {domain}: {str(e)}")
                    return jsonify({
                        'status': 'Error reading progress data',
                        'percent': 0
                    })
        else:
            return jsonify({
                'status': 'No progress information available',
                'percent': 0
            })
            
    except Exception as e:
        logger.error(f"Error reading progress: {str(e)}")
        return jsonify({
            'status': 'Error reading progress',
            'percent': 0
        }), 500

def validate_apex_domain(domain):
    if not domain:
        return False
        
    pattern = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}'
    
    # Make sure it's not starting with www or other subdomains
    if domain.startswith('www.'):
        return False
        
    return bool(re.match(pattern, domain))

def cleanup_domain_file(domain):
    """Clean up a specific domain's progress file"""
    try:
        # Clean domain input to prevent path traversal
        domain = re.sub(r'[^\w\.-]', '', domain)
        progress_file = f'temp/progress_{domain}.json'
        
        if os.path.exists(progress_file):
            os.remove(progress_file)
            logger.info(f"Cleaned up progress file for {domain} after results were shown")
    except Exception as e:
        logger.warning(f"Error cleaning up progress file for {domain}: {str(e)}")

def cleanup_temp_files():
    """Clean up old progress files periodically"""
    try:
        temp_dir = 'temp'
        if os.path.exists(temp_dir):
            count = 0
            for filename in os.listdir(temp_dir):
                if filename.startswith('progress_') and filename.endswith('.json'):
                    file_path = os.path.join(temp_dir, filename)
                    try:
                        # Check if file is older than 30 minutes (1800 seconds)
                        if time.time() - os.path.getmtime(file_path) > 1800:
                            os.remove(file_path)
                            count += 1
                        # If file is marked completed and older than 1 minute, also clean up
                        else:
                            try:
                                with open(file_path, 'r') as f:
                                    data = json.load(f)
                                    if data.get('completed') and 'timestamp' in data:
                                        if time.time() - data['timestamp'] > 60:
                                            os.remove(file_path)
                                            count += 1
                            except:
                                # If we can't read the file, check if it's older than 10 minutes (600 seconds)
                                if time.time() - os.path.getmtime(file_path) > 600:
                                    os.remove(file_path)
                                    count += 1
                    except Exception as e:
                        logger.warning(f"Could not process file {filename}: {str(e)}")
            
            if count > 0:
                logger.info(f"Cleaned up {count} old progress files")
    except Exception as e:
        logger.warning(f"Error cleaning up temp files: {str(e)}")
    
    # Schedule the next cleanup
    global cleanup_thread
    cleanup_thread = threading.Timer(CLEANUP_INTERVAL, cleanup_temp_files)
    cleanup_thread.daemon = True
    cleanup_thread.start()

# Clean up on startup and start the periodic cleanup
cleanup_temp_files()

@app.teardown_appcontext
def cleanup_on_shutdown(exception=None):
    """Clean up the cleanup thread when the application shuts down"""
    global cleanup_thread
    if cleanup_thread is not None:
        cleanup_thread.cancel()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)





