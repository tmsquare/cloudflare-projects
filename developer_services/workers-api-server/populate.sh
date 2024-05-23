#!/bin/bash

: <<'COMMENT'
# Array of real-life objects
objects=("Chair" "Table" "Laptop" "Phone" "Watch" "Camera" "Book" "Headphones" "Shoes" "Backpack")

# Function to generate a random title
generate_random_title() {
    local random_index=$((RANDOM % ${#objects[@]}))
    echo "${objects[$random_index]}"
}

# Loop to create 100 random items
for ((i=1; i<=100; i++)); do
    # Generate random data for each item
    serialNumber=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 10 | head -n 1)
    title=$(generate_random_title)
    weightLbs=$(echo "scale=2; $RANDOM/32767 * 10" | bc)  # Generates a random weight between 0 and 10

    # Prepare the JSON payload
    data="{\"serialNumber\": \"$serialNumber\", \"title\": \"$title\", \"weightLbs\": $weightLbs}"

    # Make the POST request using curl
    curl --data "$data" \
        --header 'Content-Type: application/json' \
        --request POST \
        https://apis.demo-cf.net/products

    echo "Item $i created."
done

###################################################
###################################################

# Array of first names
first_names=("John" "Emma" "Michael" "Sophia" "William" "Olivia" "James" "Ava" "Alexander" "Mia")

# Array of last names
last_names=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Rodriguez" "Martinez")

# Function to generate a random email
generate_random_email() {
    local random_number=$((RANDOM % 10000))
    echo "user$random_number@example.com"
}

# Loop to create 100 random users
for ((i=1; i<=100; i++)); do
    # Generate random data for each user
    firstname=${first_names[$((RANDOM % ${#first_names[@]}))]}
    lastname=${last_names[$((RANDOM % ${#last_names[@]}))]}
    age=$((RANDOM % 80 + 18))  # Generates a random age between 18 and 97
    email=$(generate_random_email)

    # Prepare the JSON payload
    data="{\"firstname\": \"$firstname\", \"lastname\": \"$lastname\", \"age\": $age, \"email\": \"$email\"}"

    # Make the POST request using curl
    curl --data "$data" \
        --header 'Content-Type: application/json' \
        --request POST \
        https://apis.demo-cf.net/users

    echo "User $i created."
done
COMMENT

###################################################
###################################################

# Function to generate a random title with two to three words
generate_random_title() {
    local words=("Lorem ipsum" "Dolor sit amet" "Consectetur adipiscing" "Sed do eiusmod" "Tempor incididunt" "Labore et dolore" "Ut enim ad" "Minim veniam" "Quis nostrud exercitation" "Ullamco laboris")
    local random_index=$((RANDOM % ${#words[@]}))
    local title="${words[$random_index]}"

    # Append one more word with a 50% chance
    if [ $((RANDOM % 2)) -eq 0 ]; then
        local random_index=$((RANDOM % ${#words[@]}))
        title+=" ${words[$random_index]}"
    fi

    echo "$title"
}

# Function to generate a long random text
generate_random_text() {
    cat /dev/urandom | tr -dc 'a-zA-Z0-9 ' | fold -w 500 | head -n 1
}

# Loop to create 100 random posts
for ((i=1; i<=100; i++)); do
    # Generate random data for each post
    title=$(generate_random_title)
    text=$(generate_random_text)

    # Prepare the JSON payload
    data="{\"title\": \"$title\", \"text\": \"$text\"}"

    # Make the POST request using curl
    curl --data "$data" \
        --header 'Content-Type: application/json' \
        --request POST \
        https://apis.demo-cf.net/posts

    echo "Post $i created."
done
