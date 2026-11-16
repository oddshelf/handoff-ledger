# Security Policy

## Reporting a vulnerability

**Do not open a public issue.** This repository *is* the marketplace people
install from, so a working exploit in a public issue is a working exploit
against every install that has already pulled.

Use [GitHub's private vulnerability reporting](https://github.com/zexion7873/handoff-ledger/security/advisories/new).

This is a one-person project. You will get a first response within a few days,
not within hours. The fix ships as a version bump in
`plugin/.claude-plugin/plugin.json`; nothing else reaches an install.

## Supported versions

The latest published version only. There are no maintenance branches, and tags
play no part: whatever `plugin/.claude-plugin/plugin.json` says on `main` is what
`claude plugin update` hands out, and older versions are never patched.

## What this plugin does

Worth knowing before you decide whether something is in scope. It is one mod
module run inside Claude Code's own engine.

- It reads the text of each finished main-thread reply, at the `turn.complete`
  event, and looks for the configured hand-off heading.
- It writes the items under that heading (their text, any command, any reason,
  and the time) to Claude Code's per-plugin store, a file on your disk in plain
  text, under a key that carries the session's working directory. They stay
  there until you press **Done** or **Clear all**, so a hand-off that contains something you
  would not want on disk is on disk.
- It draws a button above the prompt and a pane listing those items. An item's
  text is drawn as markdown, as the reply's was, so a link a reply put in a
  hand-off is a link in the pane.
- It puts an item's command on the clipboard when you press **Copy command**.
  That is exactly what the reply put in the fenced block; the mod does not vet
  it. A reply shaped by untrusted content (a web page, a file, another tool's
  output) can leave a command in the ledger that you did not ask for, days
  after the turn that wrote it. Read a command before you run it, as you would
  in the reply itself.
- It makes no network requests, opens no ports, makes no model calls, runs no
  shell commands, holds no credentials, and never alters the reply or the
  prompt. `claude plugin validate plugin` prints every engine call the module
  makes.

### In scope

- Anything that makes the mod run a command, rather than copy it on a press.
- Anything that lets a reply's text reach the store or the screen as something
  other than plain text.
- Anything that makes the mod read or write outside its own plugin state and
  store, or call anything beyond what `validate` lists.
- Anything in the release path that could serve modified content to an install.

### Out of scope

- A hand-off the model worded badly, or a command that is wrong. The mod keeps
  what the reply said.
- Anything requiring an attacker who can already write to your `~/.claude`
  directory or your plugin cache. At that point the ledger is not the problem.
