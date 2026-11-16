# handoff-ledger: install guide for AI agents

handoff-ledger is a Claude Code mod (a plugin of function hooks): it keeps the
items a reply leaves under the user's hand-off heading, per repo, behind a
button above the prompt and a pane. Follow these steps to install it on the
user's machine.

## 1. Preflight

```bash
claude --version
```

The mod needs a Claude Code build with function-hook plugins. CI validates and
tests it against 2.1.325; older builds are unmeasured. If the user's version is
older, tell them so and suggest updating Claude Code first. Do not install
and hope.

## 2. Agree on the heading first

The mod keeps only what follows one exact line in a reply. Ask the user which
line their instructions (`CLAUDE.md`) tell Claude to put above the things the
user must do by hand. If they have no such rule, the mod will never light up:
say so, and offer the rule in the README's "It needs a heading" section. Do not
edit their `CLAUDE.md` without asking.

## 3. Install

The `/plugin` commands in the README are REPL slash commands and won't work
from a shell. Use the CLI:

```bash
claude plugin marketplace add zexion7873/handoff-ledger
claude plugin install handoff-ledger@handoff-ledger
```

`install` defaults to the user scope, which is the one that also reaches
sessions the desktop app starts. Do not pass `--scope project` or `local`
unless the user asked for it.

The one option, **Hand-off heading**, defaults to `**等你動手**`. Set it to the
user's line if theirs differs.

## 4. Verify

```bash
claude plugin list | grep -i -A3 handoff-ledger
```

Look for `handoff-ledger@handoff-ledger` with `Status: ✔ loaded`.

The button is drawn only while something is owed, so an empty ledger shows
nothing; `/handoffs` opens the pane either way and is the check that the mod
loaded. A session gains a plugin only at session start, so tell the user it
shows up in their next session.

## Uninstall

```bash
claude plugin uninstall handoff-ledger@handoff-ledger
```

The ledger's items live in Claude Code's per-plugin store, outside the plugin's
own folder; whether an uninstall clears them is unmeasured.
