Run the full build pipeline in order:

1. `bundle exec rake generate_thumbnails`
2. `npm run geocode`
3. `bundle exec jekyll build`

Report the exit status of each step. If any step fails, stop and diagnose.
