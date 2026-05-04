# Compatibility shim. The canonical thumbnail pipeline now lives in
# scripts/generate-gallery-assets.mjs (Sharp-based, produces 1×/2× JPEG/WebP/AVIF
# + LQIP, runs in CI on every push). The Rake tasks below delegate to npm
# scripts so older docs / hooks / commands that say `bundle exec rake …`
# keep working unchanged. New code should call `npm run …` directly.

desc "Generate gallery thumbnails (delegates to npm run generate:gallery)"
task :generate_thumbnails do
  sh "npm run generate:gallery"
end

desc "Build site (delegates to npm run build)"
task :build do
  sh "npm run build"
end

desc "Serve site (delegates to npm run serve)"
task :serve do
  sh "npm run serve"
end
