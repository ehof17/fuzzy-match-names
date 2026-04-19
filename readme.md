docker compose up -d
node db/load-from-filenames.js filenames.json 

This loads in the nfl players
> todo: job that hits the post endpoint either after a new name is parsed or periodically

  docker compose build api

    docker compose run --rm \
    -v $(pwd)/filenames.json:/app/filenames.json \                                                                                         
    api node db/load-from-filenames.js /app/filenames.json 