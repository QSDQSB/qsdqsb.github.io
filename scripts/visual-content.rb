# The visual build's content, held to the pin (scripts/visual-content.mjs says why and how it is
# made). Loaded by `npm run visual:build` alone, with `ruby -r` ahead of Jekyll: the github-pages gem
# builds in safe mode, which loads no plugin of the site's own, and the live build never reads this.
# It acts only on a build with `visual_baseline` set (_config_visual.yml).
#
# On reset, the build's clock is set to the pin's moment: a page with no date of its own (the voyage
# index, the portfolio) prints the time of its build, and Jekyll leaves out a document dated after
# it, so a shot taken a month on would differ by its month.
#
# After Jekyll has read the site and before anything is generated or rendered:
#   - a post, voyage, part or portfolio page the pin does not name is left out, so no list, search
#     index, feed or neighbour link sees it;
#   - each pinned document's `updated:` is put back as the pin has it (none, where it had none),
#     parsed as Jekyll parses front matter, so Recent Updates keeps its order;
#   - the photograph manifests are read from tests/visual/content/photo_manifests (the pinned ones,
#     written by `visual-content.mjs freeze`) in place of _data/photo_manifests;
#   - a map's points for documents the build does not hold are dropped from its GeoJSON.
require "json"
require "yaml"
require "jekyll"
require "set"
require "time"

module VisualContent
  PIN = "tests/visual/content-pin.json"
  FROZEN = "tests/visual/content"
  COLLECTIONS = %w(posts voyage subvoyage portfolio).freeze

  module_function

  def parse_updated(raw)
    text = "updated: #{raw}"
    data = defined?(SafeYAML) ? SafeYAML.load(text) : YAML.safe_load(text, :permitted_classes => [Date, Time])
    data["updated"]
  end

  def pin(site)
    JSON.parse(File.read(site.in_source_dir(PIN), :encoding => "utf-8"))
  end

  def hold(site)
    docs = pin(site).fetch("docs")
    dropped = []
    site.collections.each_value do |collection|
      next unless COLLECTIONS.include?(collection.label)

      collection.docs.select! do |doc|
        entry = docs[doc.relative_path]
        dropped << doc.url unless entry
        next false unless entry

        if entry["updated"].nil?
          doc.data.delete("updated")
        else
          doc.data["updated"] = parse_updated(entry["updated"])
        end
        true
      end
    end
    site.data["photo_manifests"] = manifests(site)
    points = drop_points(site, COLLECTIONS.flat_map { |c| site.collections[c]&.docs.to_a }.map(&:url))
    Jekyll.logger.info "Visual content:", "held to the pin; #{dropped.size} document(s) and #{points} map point(s) after it left out"
  end

  def manifests(site)
    dir = site.in_source_dir(FROZEN, "photo_manifests")
    Dir[File.join(dir, "*.json")].sort.to_h { |f| [File.basename(f, ".json"), JSON.parse(File.read(f, :encoding => "utf-8"))] }
  end

  # A map's GeoJSON is a static file written by `npm run geocode`, a point for each voyage or part.
  # Where it names a page the build does not hold (left out here, or dated after the clock), a copy
  # without that point is written under tests/visual/content and served in its place.
  def drop_points(site, held)
    held = held.to_set
    site.static_files.sum do |file|
      next 0 unless file.extname == ".geojson"

      geo = JSON.parse(File.read(file.path, :encoding => "utf-8"))
      kept = geo["features"].select { |f| (url = f.dig("properties", "url")).nil? || held.include?(url) }
      next 0 if kept.size == geo["features"].size

      copy = site.in_source_dir(FROZEN, file.relative_path)
      FileUtils.mkdir_p(File.dirname(copy))
      File.write(copy, JSON.generate(geo.merge("features" => kept)))
      file.define_singleton_method(:path) { copy }
      geo["features"].size - kept.size
    end
  end
end

Jekyll::Hooks.register :site, :after_reset do |site|
  site.time = Time.iso8601(VisualContent.pin(site).fetch("time")).localtime if site.config["visual_baseline"]
end

Jekyll::Hooks.register :site, :post_read do |site|
  VisualContent.hold(site) if site.config["visual_baseline"]
end
