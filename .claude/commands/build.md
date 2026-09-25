Run the full build pipeline in order:

1. `npm run photos:fetch`
2. `npm run geocode`
3. `bundle exec jekyll build`

Report the exit status of each step. If any step fails, stop and diagnose.
