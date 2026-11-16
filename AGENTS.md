# Working on handoff-ledger

A Claude Code mod: a plugin of function hooks, one module
(`plugin/hooks/register.tsx`). No package manager, no dependencies. `README.md`
covers what it does for a user and the item grammar; this file covers the traps.

## `plugin/` is what ships

The repo root is the marketplace; `plugin/` is the plugin
(`source: "./plugin"`). Docs and CI live outside it so they stay out of an
install and out of the plugin directory's review.

## What the mod must keep doing

Each is pinned by a test in `plugin/tests/ledger.test.tsx`.

- **Render what is beneath.** The `AbovePrompt` hook awaits `next(e)` and
  returns it with its own button; dropping it erases whatever another mod drew
  on this row. Another mod's tree shares one line with the button. Core's own
  drawing (`type: 'engine'`) stays out of that line: in a row with it, the
  desktop app draws the button at the right edge.
- **Draw nothing when nothing is owed.**
- **Read the ledger at each draw.** The store is the ledger; the `tick` atom only
  redraws its readers. A desktop session starts in a spare folder and gets its
  real cwd afterwards, with no `session.start` after the move, so a list read
  at `session.start` is the wrong repo's.
- **Ignore subagent turns.** A `turn.complete` with an `agentId` is a
  subagent's report, not a reply the user reads.
- **One ledger per working directory.** The store key carries
  `$.session.cwd()`; another repo's items never show.
- **Never call the model, the network, or rewrite what the model reads.** The
  `/handoffs` answer stays one short line because it lands in model requests.

## Stored data is a contract

Items persist in `$.store` across versions. A change to `Handoff` that old
items do not satisfy needs a new atom `shape` and a migration, not just a type
edit. Adding an optional field needs neither.

## Commands

```bash
claude plugin validate .                 # the marketplace manifest only
claude plugin validate --strict plugin   # the plugin and every engine call it makes
claude plugin test plugin                # plugin/**/*.test.tsx in the engine's harness
node tools/make-icon.mts | rsvg-convert -o plugin/.claude-plugin/icon.png    # marketplace icon
node tools/make-hero.mts > docs/hero.svg                                      # README hero
node tools/make-social-card.mts | rsvg-convert -o docs/social-card.png       # social preview
(cd plugin && tsc -p .)                  # only after the mod has loaded once
```

`plugin/.claude-plugin/types/` is written by the engine when the mod loads and
is gitignored; `plugin/tsconfig.json` extends it.

## The icon

`plugin/.claude-plugin/icon.png` is the marketplace listing icon, drawn by
`tools/make-icon.mts` and rasterised by `rsvg-convert`. It is the one image in
the shipped tree, and nothing in the tree names it. The marketplace takes the
icon only from the first save or submission in the developer portal, so
regenerating it after that changes the file and not the listing. It is not
checked in CI: the PNG depends on the machine's rasteriser.

## The hero and the social card

`docs/hero.svg` (the README's image) and `docs/social-card.png` (the repo's
social preview) are drawn by `tools/make-hero.mts` and
`tools/make-social-card.mts` from `tools/pane.mts`, a hand-drawn copy of the
pane: the mod's own tree needs the engine. Change a button label or what a row
shows in `register.tsx` and both are stale; nothing checks either. The card
also renders `plugin.json`'s description and throws if it stops reading
`<tagline>: <accent>`. GitHub takes the social preview only through Settings →
General → Social preview, so a regenerated PNG is not live until someone
uploads it there. The README's `width=` must match the SVG's own `width`.

## CI and releases

`.github/workflows/check.yml` installs Claude Code at a pinned version, the one
the README's install section names; bump both together. The version line in
`plugin/.claude-plugin/plugin.json` landing on `main` is the publish; a tag or a
GitHub release publishes nothing. After a release PR merges, tag its merge
commit with an annotated `vX.Y.Z`, push the tag, then
`gh release create vX.Y.Z --verify-tag --title vX.Y.Z --notes-file <notes>`.
