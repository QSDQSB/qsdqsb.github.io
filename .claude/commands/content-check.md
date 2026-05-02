Run the `frontmatter-contract-enforcer` skill workflow against every changed file in `_posts/`, `_pages/`, `_voyage/`, and `_subvoyage/` (use git diff to identify changed files; if there's no diff, fall back to the most recently modified files in those directories).

For each file, validate against the contracts in CLAUDE.md "Frontmatter Contracts":

1. **Required keys present?** Per collection (see the table in CLAUDE.md).
2. **Conditional pairings resolve?** For each set value:
   - `gallery_name` → both `gallery/<name>/` and `images/thumbnails/gallery/<name>/` exist with matching filenames.
   - `map_dataset` → matches a real `_data/maps/<name>.yml`.
   - `subgalleries: true` → parent voyage basename aligns with the `_subvoyage/<basename>/` folder.
   - `tags` → entries exist in `_data/tag_colours.yml`.
3. **Sub-voyage placement?** File lives in `_subvoyage/<parent>/`, not the root.
4. **Nested gallery_name?** First segment matches the parent voyage basename.

Run the `gallery-integrity-audit` skill workflow on any file whose `gallery_name` was added or changed.

Report PASS / WARN / FAIL per file with the offending key and the concrete remediation (which file to create, which key to add, which existing tag colour to use).

This is the manual entrypoint for the same checks the `frontmatter-contract-enforcer` skill auto-fires for during content edits.
