# Dependency remediation

The full frontend and Gutenberg dependency audits include development tools and
fail at moderate severity. No advisory exclusions or reduced audit levels are used.

## Brace parser

Upstream `braces` 3.0.3 has no published fix for
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Both package manifests therefore override its transitive installations with the
exact npm alias `npm:@dieub/braces-depth-guard@3.0.3-pn.3`. This is a third-party
MIT-licensed derivative, not an upstream release. Its source commit is
`305a2e4bfe324bb53c336c1b03387ee1251c926f` in
[the fork repository](https://github.com/dieub/braces-depth-guard).

The published runtime was compared with upstream 3.0.3. Changes add a maximum
nesting depth of 100 during parsing and AST traversal, validate depth and length
options, and reject cyclic parent walks during expansion. Existing entry points
and ordinary expansion behavior are retained. The tarball's SHA-512 matches the
registry integrity recorded in each lockfile; the registry also publishes a
GitHub Actions provenance attestation for this version.

A renamed dependency disappearing from an advisory report does not prove a fix.
The committed behavioral regressions separately check deep brace/parenthesis
rejection, direct AST traversal, invalid limit options, cyclic parent links,
stateful option getters, ordinary expansion and glob matching, and every locked
transitive installation. Existing Gutenberg
tests and both production builds remain required. This scoped repair does not
claim to bound every possible expansion cardinality or malformed object.

The fork is pinned to prevent silent derivative updates. Reassess it when upstream
publishes a fixed release, retaining the behavioral tests when removing the alias.

## Other transitive dependencies

`postcss-selector-parser`, `source-map-js`, `smol-toml` and `katex` are resolved to
patched registry versions through manifest overrides and locked patch updates.
The existing WordPress package cohort is preserved.

The Gutenberg coverage loader uses `js-yaml.load`. Its scoped YAML 4 override
retains that API while removing YAML 3's `argparse` 1 / `sprintf-js` dependency,
which is affected by
[GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).
A regression exercises the real coverage loader with YAML inheritance, rather
than testing only the YAML library in isolation.
