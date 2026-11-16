# Contributing

**Read [AGENTS.md](AGENTS.md) before you write anything.** It is short on
purpose. The three traps below are the ones that waste an afternoon if you meet
them by surprise; AGENTS.md has the rest.

## Three things that will cost you an afternoon

**The installed copy does not run your checkout.** `handoff-ledger@handoff-ledger`
from the marketplace runs out of `plugins/cache/`, keyed by the `plugin.json`
version. Load the checkout instead, with `claude --plugin-dir plugin` for one
session, and it hot-reloads as you edit. If you have both, two buttons are
drawn and you are editing one of them.

**`tsc` fails on a fresh clone.** `plugin/tsconfig.json` extends
`plugin/.claude-plugin/types/`, which the engine writes the first time the mod
loads and git ignores. Load the mod once, then type-check.

**A new desktop session does not start where it ends up.** The app claims a
pre-warmed session that started in a folder of its own, and no `session.start`
follows the move. Anything you read by working directory at `session.start` is
the wrong folder's. Read it when you draw.

## Working on it

```bash
claude --plugin-dir plugin               # a session running this checkout
claude plugin validate .                 # the marketplace manifest
claude plugin validate --strict plugin   # the plugin and every engine call the module makes
claude plugin test plugin                # the tests, exactly as CI runs them
```

A fresh clone runs all of it with no secrets and no login: validating and
testing never call the model. Only looking at the mod in a session needs a
signed-in Claude Code.

"Verified" means: both validates and the tests pass, and **you have looked at
the button and the pane in a real session**: the desktop Code tab and a
terminal draw them through different element tables. A green test is one more
kind of evidence, not a replacement for looking.

## Pull requests

Do not open a pull request you could not explain line by line if asked. That
rule, and the two beside it, are in the
[Code of Conduct](CODE_OF_CONDUCT.md#send-work-you-understand).

Conventional Commits (`feat:` / `fix:` / `refactor:` / `docs:` / `chore:` /
`test:` / `perf:`), in English, saying WHY rather than WHAT. One logical change
per commit. Do not bump the version in your PR: releases are cut separately.

If your change alters behaviour, interfaces, or project state, the docs it makes
stale are part of the diff: README, AGENTS.md, SECURITY.md's list of what the
mod does, `llms-install.md`, and `docs/hero.svg` and `docs/social-card.png` if
what the button or the pane shows has changed.
