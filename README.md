<div align="center">

# ✋ handoff-ledger

[![CI: check](https://github.com/zexion7873/handoff-ledger/actions/workflows/check.yml/badge.svg)](https://github.com/zexion7873/handoff-ledger/actions/workflows/check.yml)

<img src="docs/hero.svg" width="760" title="Drawn by hand from sample items, not a screenshot." alt="A drawing of the mod, not a screenshot. On the left, a reply ends with the line Your turn and three bullets: push the branch, restart the app, upload the social preview. Under it, above the prompt box, a button reads Your turn 3. On the right, a pane titled Your turn lists the same three items: the first shows the command git push origin main with a Copy command button and a Done button, the second is marked 2d ago, each has a Done button, and a Clear all button sits under the list.">

**Keeps the things a Claude Code reply left for you to do, per repo, until you
check them off: a count above the prompt and a pane.**

[![License: MIT](https://img.shields.io/github/license/zexion7873/handoff-ledger?style=flat)](LICENSE)
[![Surface: desktop | terminal](https://img.shields.io/badge/surface-desktop%20%7C%20terminal-lightgrey?style=flat)](#what-it-reads-and-writes)
[![Network: none](https://img.shields.io/badge/network-none-brightgreen?style=flat)](#what-it-reads-and-writes)

No model calls. No network requests. No rewriting what the model reads. One
mod reading the reply you were already given.

</div>

---

Claude ends a reply with "you need to run this push yourself", you say "sure",
and three turns later it has scrolled away. handoff-ledger reads each finished
reply, takes the items under your hand-off heading, and keeps them per repo
until you check them off:

- a button above the prompt, `✋ <heading> 3`, drawn only while something is
  owed, on one line with whatever another mod draws on this mod's row
- a pane (the button, or `/handoffs`) listing each item, drawn as markdown
  the way the reply drew it, with its age, its
  command with a **Copy command** button, and a **Done** button; **Clear all**
  empties the repo's ledger after a second press

It draws in the desktop app's Code tab and in the terminal. It makes no model
calls and no network requests.

## It needs a heading in your instructions

The mod finds hand-offs by one exact line. Nothing lights up until your
instructions tell Claude to write that line. Add a rule to your `CLAUDE.md`
along these lines:

```markdown
Anything I must do by hand goes at the very end of the reply under the line
`**Your turn**`, one bullet per item, a command in its own fenced block.
```

Then set the mod's **Hand-off heading** option to the same line, `**Your turn**`
(asked at install; later in `/config`). The default is `**等你動手**`, the
author's own heading.

## What counts as an item

Everything after the heading's last occurrence in the reply:

- each bulleted or numbered line is an item
- a fenced block is the command of the item above it; a fenced block with no
  item above it starts one, named by the next plain line
- in a bulleted block, a line with no bullet is the reason for the item above it
- in a block with no bullets at all, every line is an item

An item is not added twice: one with a command matches an open item with the
same command, however the line beside it is worded, and one without a command
matches on its exact text.
Replies from subagents are ignored.

## Install

Needs a Claude Code build with function-hook plugins; tested against 2.1.311.

At the prompt of a terminal session:

```
/plugin install handoff-ledger --marketplace zexion7873/handoff-ledger
```

From a shell:

```bash
claude plugin install handoff-ledger --marketplace zexion7873/handoff-ledger
```

In the desktop app, where `/plugin` does not run: click + next to the prompt
box, then Plugins, Add marketplace with `zexion7873/handoff-ledger`, then Add
plugin.

## What it reads and writes

| Hook | Reads | Changes |
| --- | --- | --- |
| `session.start` | nothing | registers `/handoffs` |
| `command.run` (`/handoffs`) | whether the mod's pane is open and shown | opens the pane; one open behind another pane's tab is closed and opened again, which brings it forward |
| `turn.complete` | the finished reply's text, and this repo's open items to skip one already there | appends the reply's hand-off items to the mod's store |
| `ui.render` (`AbovePrompt`, `Pane`) | this repo's open items, at each draw | draws the button and the pane; the button opens the pane as `/handoffs` does; **Done** deletes an item, **Clear all** deletes this repo's, **Copy command** puts an item's command on the clipboard |

Items live in Claude Code's per-plugin store on your machine, keyed by the
session's working directory, so each repo has its own ledger. The reply the
model wrote and the prompt it reads are never altered.

## Limits

- Checking off is manual: the mod cannot tell that you ran a command.
- The heading must match the configured line exactly, after trimming spaces.

## License

MIT
