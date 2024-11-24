import math
import os
import requests
from requests.adapters import HTTPAdapter, Retry
import sys
import concurrent.futures

# File to upload 
filename = sys.argv[1]

# Word to count the number of occurence of 
seach_word = sys.argv[2]

worker_endpoint = "https://dev.tmsquare.net/do/word-count/"
#worker_endpoint = "http://localhost:8787/do/word-count/"

# Configure the chunk size to be 5MB (except for the last part)
chunksize = 5 * 1024 * 1024



def upload_file(worker_endpoint, filename, chunksize):
    url = f"{worker_endpoint}{filename}"

    # Count the number of chunks the file will be broken into
    part_count = math.ceil(os.stat(filename).st_size / chunksize)
    print(part_count)

    # Create an executor for up to 25 concurrent workers.
    executor = concurrent.futures.ThreadPoolExecutor(100)

    # Submit a task to the executor to upload each part and get the indivual counts
    futures = [
        executor.submit(upload_part, filename, chunksize, url, index)
        for index in range(part_count)
    ]
    concurrent.futures.wait(futures)

    # get the counts from the futures
    uploaded_parts = [future.result() for future in futures]
    number_of_occurence = sum(int(item) for item in uploaded_parts if len(item) < 10) 
    print(f"The word {seach_word} appears {number_of_occurence} time in your file {filename}")


def upload_part(filename, chunksize, url, index):
    # Open the file in rb mode, which treats it as raw bytes rather than attempting to parse utf-8
    with open(filename, "rb") as file:
        file.seek(chunksize * index)
        part = file.read(chunksize)

    # Retry policy for when uploading a part fails
    s = requests.Session()
    retries = Retry(total=3, status_forcelist=[400, 500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retries))

    return s.post(
        url,
        params={
            "action": "wc-execute",
            "keyWord": str(seach_word),
        },
        data=part,
    ).text


upload_file(worker_endpoint, filename, chunksize)