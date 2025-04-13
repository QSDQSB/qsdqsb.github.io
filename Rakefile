require 'fileutils'
require 'mini_magick'

desc "Generate thumbnails for gallery images"
task :generate_thumbnails do
  puts "Generating thumbnails..."

  # Configuration
  target_width = 480
  quality = 80

  # Process each gallery
  Dir.glob('gallery/**/*.{jpg,jpeg,png,gif}').each do |file|
    next unless File.file?(file)

    # Get the relative path from gallery directory
    gallery_path = File.dirname(file) # Get the directory structure

    # Create thumbnail directory if it doesn't exist
    thumbnail_dir = File.join('images/thumbnails', gallery_path) # Maintain the same structure
    FileUtils.mkdir_p(thumbnail_dir)

    # Define thumbnail path
    thumbnail_path = File.join(thumbnail_dir, File.basename(relative_path))

    # Skip if thumbnail already exists and is newer than the source
    if File.exist?(thumbnail_path) && File.mtime(thumbnail_path) > File.mtime(file)
      puts "Skipping #{file} - thumbnail already exists and is up to date"
      next
    end

    # Generate thumbnail
    begin
      puts "Generating thumbnail for #{file}"
      image = MiniMagick::Image.open(file)
      
      # Calculate new dimensions while maintaining aspect ratio
      original_width = image.width.to_f
      original_height = image.height.to_f
      ratio = original_height / original_width
      new_height = (target_width * ratio).round
      
      puts "  Original dimensions: #{original_width}x#{original_height}"
      puts "  New dimensions: #{target_width}x#{new_height}"
      
      # Resize while maintaining aspect ratio
      image.resize "#{target_width}x"
      image.quality quality
      image.write thumbnail_path
      puts "  Generated: #{thumbnail_path}"
    rescue => e
      puts "Error generating thumbnail for #{file}: #{e.message}"
    end
  end
end

desc "Build site with thumbnails"
task :build => [:generate_thumbnails] do
  sh "bundle exec jekyll build"
end

desc "Serve site with thumbnails"
task :serve => [:generate_thumbnails] do
  sh "bundle exec jekyll serve"
end