#!/bin/bash


domain="YOUR_DOMAIN"
iterations=2000

# Sequence  1
for ((i=1; i<=$iterations; i++)); do
    echo "Running iteration $i"

    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/inventory/:type
    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/products
    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/posts
    ab -n 1 -H "my-apis-session-identifier: mockoon" -p post_data.txt -T "application/json" https://api.${domain}/users

    echo "Iteration $i complete"
    echo
done


# Sequence  2
for ((i=1; i<=$iterations; i++)); do
    echo "Running iteration $i"

    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/inventory/:type
    ab -n 1 -H "my-apis-session-identifier: mockoon" -p post_data.txt -T "application/json" https://api.${domain}/users

    echo "Iteration $i complete"
    echo
done


# Sequence  3
for ((i=1; i<=$iterations; i++)); do
    echo "Running iteration $i"

    ab -n 1 -H "my-apis-session-identifier: mockoon" -p post_data.txt -T "application/json" https://api.${domain}/users
    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/products

    echo "Iteration $i complete"
    echo
done

# Sequence  4
for ((i=1; i<=$iterations; i++)); do
    echo "Running iteration $i"

    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/posts
    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/products
    ab -n 1 -H "my-api-session-identifier: mockoon" https://api.${domain}/inventory/:type

    echo "Iteration $i complete"
    echo
done
