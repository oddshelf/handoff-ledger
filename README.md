# handoff-ledger

A Claude Code mod that keeps the things a reply left for **you** to do.

Claude ends a reply with "you need to run this push yourself", you say "sure",
and three turns later it has scrolled away. handoff-ledger reads each finished
reply, takes the items under your hand-off heading, and keeps them per repo
until you check them off:

- a button above the prompt, `✋ <heading> 3`, drawn only while something is owed
- a pane (the button, or `/handoffs`) listing each item with its age, its
  command with a **Copy command** button, and a **Done** button

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

An item whose text and command match one already open is not added twice.
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
| `turn.complete` | the finished reply's text | appends its hand-off items to the mod's store |
| `session.start` | this repo's stored items | registers `/handoffs` |
| `ui.render` (`AbovePrompt`, `Pane`) | the open items | draws the button and the pane; **Done** deletes an item |

Items live in Claude Code's per-plugin store on your machine, keyed by the
session's working directory, so each repo has its own ledger. The reply the
model wrote and the prompt it reads are never altered.

## Limits

- Checking off is manual: the mod cannot tell that you ran a command.
- The heading must match the configured line exactly, after trimming spaces.

## License

MIT
