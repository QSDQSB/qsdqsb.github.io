# Compatibility shim. The Rake tasks below delegate to npm scripts so older
# docs / hooks / commands that say `bundle exec rake …` keep working
# unchanged. New code should call `npm run …` directly.

desc "Build site (delegates to npm run build)"
task :build do
  sh "npm run build"
end

desc "Serve site (delegates to npm run serve)"
task :serve do
  sh "npm run serve"
end
