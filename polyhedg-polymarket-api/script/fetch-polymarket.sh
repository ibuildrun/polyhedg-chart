#!/bin/bash

# Create a directory to store the JSON responses.
# This path is based on the one from your error messages.
mkdir -p data/res

# Set the maximum number of parallel requests
MAX_PARALLEL=10

# Loop through the offsets from 0 to 10000 with a step of 500
for offset in $(seq 0 500 10000)
do
  # This loop checks if the maximum number of parallel jobs has been reached.
  # It will pause here until a slot becomes free.
  while [[ $(jobs -r -p | wc -l) -ge $MAX_PARALLEL ]]; do
    # Sleep for a very short time to prevent this check from using too much CPU
    sleep 0.1
  done

  # Launch the curl request in a background process
  (
    URL="https://gamma-api.polymarket.com/events?related_tags=true&closed=false&limit=500&offset=${offset}"
    OUTPUT_FILE="data/res/${offset}.json"

    echo "Fetching data for offset ${offset}..."

    # Execute the request.
    # -sS flags will make curl silent but still show errors if they occur.
    curl -sS --request GET --url "${URL}" -o "${OUTPUT_FILE}"
  ) &

done

# Wait for all remaining background jobs to complete before exiting the script
wait

echo "All requests have been completed."
echo "Your files are saved in the 'data/res/' directory."
