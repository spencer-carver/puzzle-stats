# Puzzle Stats
This is designed to be an AWS Lambda that sits behind my site API Gateway, and handles stat tracking for the puzzles aspect of my site.

It can be called from the [Puzzle Answer Check](https://github.com/spencer-carver/puzzle-answer-check) Lambda as well as directly from the site.

The `npm run export` script zips up required files to be imported into the desired lambda function from the AWS Console.
