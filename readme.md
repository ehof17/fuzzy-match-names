docker compose up -d
node db/load-from-filenames.js filenames.json 

This loads in the nfl players
> todo: job that hits the post endpoint either after a new name is parsed or periodically