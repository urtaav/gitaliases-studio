# GitAliases Studio — intent builders (v2)

Date: 2026-10-28
Builds on: `2026-10-28-gitaliases-studio-design.md` (v1). Everything there still applies unless changed here.

## 1. Intent

v1 helps people who already know what command they want. Someone who does not know that
`for-each-ref` or `%(committerdate:short)` exist cannot use it, and someone who finds an alias on a
blog gains little by copying it into the tool instead of the terminal.

v2 starts from **what the person wants to do**, in plain words, and builds the alias for them
through guided forms with a live preview. The command is shown and explained, but nobody has to
know the syntax. This is what a blog post cannot do: build the alias *you* need.

Target users: the same as v1, with juniors and people who rarely use a terminal first.

## 2. Goals

1. A **Start** screen that asks "What do you want to do?" and leads to four paths:
   recent branches, stats as a chart, undo changes, history.
2. A **Branch designer** that builds `for-each-ref` aliases visually.
3. A **Chart designer** that builds bar-chart aliases (activity, authors, most-changed files).
4. An **Undo assistant**: pick what happened, get the right alias, with risk levels and warnings.
5. Every designer explains the command it builds, part by part.
6. Catalog entries open in their designer ("Customize") with values prefilled.
7. Dangerous aliases can be created, but only **at the user's own risk**, explicitly acknowledged.

## 3. Non-goals

- Designers for other commands (diff, stash, status).
- Opening hand-written `for-each-ref` or chart aliases in the designers (they stay raw text, as
  hand-written log aliases do in v1).
- Pasting `git config` commands from the web (discussed, not chosen).

## 4. Anti-goals

- A destructive alias added without the user explicitly accepting the risk.
- A chart alias whose bars overflow the terminal on a large repository.
- A generated alias that works in one shell and breaks in another (bash, zsh, Git Bash,
  PowerShell 5.1 and 7, macOS BSD tools).

## 5. Navigation

Studio tabs become:

```
0. Start  #/studio/start   (new, default target of "Open the studio")
1. My aliases
2. Catalog
3. Designers               #/studio/log | /branches | /chart | /undo
4. Apply
```

"Designers" is one tab with a sub-switch between **History** (the v1 Log designer, unchanged),
**Branches**, **Charts** and **Undo**. Each sub-view has its own hash route.

The Start screen shows four large choices in plain language, each with a one-line example of
the result ("See your branches, newest first, with their date"), plus links to Catalog and
My aliases.

## 6. Shared designer behavior

All designers follow the Log designer's pattern: preview on top (sample data, terminal
background, theme colors), options below, save area with alias name and validation
(v1 rules), "Load an existing … alias" for aliases built by that designer.

**How it's built:** under the preview, a list maps every part of the generated command to the
option that produced it, in plain English (for example
`--sort=-committerdate` → "Sort: most recent first"). Hovering or focusing an option highlights
its part. This replaces the need to read git's documentation.

Aliases keep a recipe so they round-trip inside the workspace:
`Alias.recipe` becomes a tagged union:

```ts
type Recipe =
  | { kind: 'log'; log: LogRecipe }          // v1, existing data migrated on load
  | { kind: 'branches'; branches: BranchRecipe }
  | { kind: 'chart'; chart: ChartRecipe }
  | { kind: 'undo'; undo: UndoRecipe };
```

`AliasType` gains `'branches' | 'chart' | 'undo'`. Workspace storage moves to `version: 2` with
a migration from v1 (existing `recipe` → `{ kind: 'log', log: recipe }`).

## 7. Branch designer

Builds `git for-each-ref` aliases. No shell needed (not a `!` alias).

- **Fields** (add, remove, reorder, color, width; same UI as log fields):
  - Current branch marker — `%(HEAD)`
  - Branch name — `%(refname:short)`
  - Last commit date — `%(committerdate:short | relative | iso)` (format chosen per field)
  - Last commit author — `%(authorname)`
  - Last commit message — `%(contents:subject)`
  - Last commit hash — `%(objectname:short)`
  - Remote branch — `%(upstream:short)`
  - Ahead/behind remote — `%(upstream:track)`
- **Colors** with `%(color:…)` / `%(color:reset)`; **width** with `%(align:N,left|right|middle)…%(end)`.
- **Sort**: most recent commit first (`-committerdate`), oldest first, name A→Z, author date.
- **Which branches**: local (`refs/heads/`), remote (`refs/remotes/`), both.
- **Limit**: show at most N (`--count=N`), 0 = all.
- **Separator**: same choices as the log designer, plus a single space.
- **Preview**: 6–8 sample branches (fictional), one marked as current, some with upstream
  ahead/behind.
- Default preset reproduces the catalog `recent` alias:
  `for-each-ref --sort=-committerdate --format='%(committerdate:short) %(refname:short)' refs/heads/`.

## 8. Chart designer

Builds shell aliases that draw horizontal bar charts in the terminal.

- **What to count**:
  - Commits per day
  - Commits per week
  - Commits per author
  - Most changed files ("churn")
- **Period**: last 7 / 30 / 90 days / 1 year / all history (`--since`).
- **Options**: include merges or not; all branches or current; top N rows for authors/files.
- **Bars**: character (`▇`, `█`, `■`, `#` for terminals without Unicode), color, max width
  (default 40 columns). **Bars always scale to the max width**, so big repos never overflow.
  Each row shows label, count and bar.
- **Implementation**: `git log …` piped to `sort | uniq -c` and a single `awk` program that
  stores rows and prints scaled bars in `END`. Colors via `printf "\033[…m"` inside awk (works in
  gawk, mawk and BSD awk). Must run on Git for Windows (bundled bash/awk), Linux and macOS.
- **Preview**: fictional dataset per metric, scaled the same way the real alias scales.
- Presets: `activity` (per day, 60 days), `authors` (per author, no merges), `churn` (top 20 files).

## 9. Undo assistant

Not a format designer: a question, then a recommendation.

**"What happened?"**, each option with its alias and risk level:

| Situation | Alias | Command | Risk |
|---|---|---|---|
| I staged files I didn't mean to | `unstage` | `restore --staged` | safe |
| I committed but want my changes back | `undo` | `reset --soft HEAD~1` | safe (if not pushed) |
| Wrong message on my last commit | `reword` | `commit --amend` | careful |
| I already pushed a bad commit | `revert-last` | `revert HEAD` | safe |
| Throw away changes in a file | `discard` | `restore` | destructive |
| Reset everything to the last commit | `wipe` | `reset --hard HEAD` | destructive |
| Delete new files I never added | `cleanup` | `clean -fd` | destructive |

Each choice shows: what it does, what it does **not** undo, when not to use it, and an example.
The user can rename the alias.

**Risk levels** (`Alias.risk?: 'careful' | 'destructive'`, also on catalog entries):

- **Safe**: no extra friction.
- **Careful**: a yellow note explaining the condition (e.g. "if you already pushed").
- **Destructive**:
  1. Red warning stating exactly what is lost.
  2. Required checkbox: "I understand this can delete work and I use it at my own risk."
     The alias cannot be saved/added without it (from the assistant, the catalog or My aliases).
  3. A red risk chip on the alias in My aliases and Apply.
  4. **"Ask before running"** option, **on by default** for destructive aliases. The alias becomes a
     shell alias that prompts in the terminal and only runs on `y`:
     `!f() { printf '%s [y/N] ' 'This deletes uncommitted changes. Continue?'; read a; [ "$a" = y ] && git reset --hard HEAD; }; f`
     Arguments pass through (`"$@"`) where the command takes them (e.g. `discard`).
- My aliases also flags imported/hand-written aliases that contain destructive commands
  (`reset --hard`, `clean -f`, `push --force`, `checkout -- .`, `restore` without `--staged`)
  with the red chip, without blocking them.

## 10. Catalog

- Entries gain `risk?` and optional `designer` + `preset` (e.g. `{ designer: 'branches', preset: 'recent' }`).
- Entries with a designer show **Customize**, which opens the designer prefilled.
- New entries: `activity`, `authors`, `churn` (chart presets), `reword`, `revert-last`, `cleanup`
  (undo), `hist` (log). Destructive entries require the same acknowledgment as section 9.

## 11. Testing

- Unit: build functions for branch and chart recipes (exact strings), recipe round trips inside
  the workspace, v1→v2 storage migration, risk detection for hand-written aliases, undo
  confirmation wrapper.
- Integration (real git, temp repos, isolated config; bash, pwsh, Windows PowerShell 5.1):
  - branch alias lists branches in the chosen order with the chosen fields;
  - chart aliases print one row per bucket, bars never exceed the max width, colors present;
  - "ask before running" alias does nothing when answered `n` (stdin) and runs on `y`.

## 12. Left to the builder

- Component structure and how much UI to share between designers.
- Sample data for previews.
- Exact copy (following v1 writing rules) and the plain-English explanation strings.
- Visual layout of the Start screen within the v1 terminal style.

## 13. Calls made without explicit owner input (review these)

- Designers live under one "Designers" tab with a sub-switch, instead of one tab each.
- Start becomes the default studio screen.
- "Ask before running" is on by default for destructive aliases.
- Risk chips also appear on hand-written/imported destructive aliases (not blocking).
- `reword`, `revert-last` and `cleanup` added to cover the undo situations.
- `#` offered as a bar character for terminals without Unicode.
- Weekly buckets use `--date=format:'%G-W%V'` (ISO week); verified by the integration tests on
  every runner, falling back to a Monday date (`%Y-%m-%d` of the week start computed in awk) if
  a platform's strftime lacks `%V`.
- "Most changed files" uses `git log --name-only --format= …` then `sort | uniq -c | sort -rn | head -N`.
- The catalog's existing `recent` (`branch --sort=-committerdate`) is replaced by the Branch
  designer preset so "Customize" opens with the same value.
- Shortcut-style undo aliases that take paths (`discard`, `unstage`) stay plain shortcuts; only
  when "Ask before running" wraps them in a shell function are arguments forwarded with `"$@"`.
- The "ask before running" prompt reads from the terminal with `read`; the integration test feeds
  stdin to prove both answers, including when git is launched from PowerShell.
