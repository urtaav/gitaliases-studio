# GitAliases Studio — design

Date: 2026-10-28
Repo: `gitaliases-studio` (public, MIT) · Hosted on GitHub Pages
Display name: **GitAliases Studio**

## 1. Intent

Git aliases save time, but setting them up means memorizing `git config` syntax
and fighting shell quoting. A single wrong quote produces errors like
`Se esperaba una expresión después de "("` when a bash-style command is pasted
into PowerShell. Many developers, especially juniors and people who rarely open a
terminal, never set aliases up at all.

GitAliases Studio is a visual, browser-only tool to:

- see the aliases you already have and edit or delete them,
- add new ones from a catalog or by filling two fields,
- design a custom `git log` view (columns, colors, widths, themes),
- apply everything at once or one alias at a time, with commands that work the
  first time in the user's terminal.

It is a matter of taste and convenience: you can learn the long commands, but you
don't have to.

## 2. Audience

- Developers of any level. **Juniors and people who don't use the console are a
  first-class audience**: every screen must be understandable without prior git
  config knowledge.
- English UI, for a global audience.

## 3. Goals

1. Import existing aliases, list them in plain language, edit/delete/create.
2. Catalog of ~30 useful aliases, grouped by task, addable with one click.
3. Log designer covering all `git log --pretty=format` placeholders, freely
   ordered, with styling, themes and "highlight my commits".
4. Apply step that never asks the user to hand-escape anything.
5. A landing page that explains the problem, the solution, and a short glossary.
6. 15–20 original, visually distinct themes.
7. Zero data leaves the browser.

## 4. Non-goals (v1)

- Backend, accounts, sync, analytics.
- Editing any git config other than `[alias]`.
- Formats for other commands (`git branch --format`, `for-each-ref`).
- A CLI companion that writes config directly.
- Languages other than English (keep UI strings centralized so i18n is possible later).

## 5. Anti-goals (failure even if it "works")

- A generated command that errors when pasted into the shell the tool told the user to use.
- A junior lands on the app and can't tell what to do next.
- Any user config sent over the network, or any third-party request at runtime
  (fonts included).
- Theme names that copy existing, well-known themes or trademarks
  (no Dracula, One Dark, Nord, Gruvbox, Monokai, Solarized, Tokyo Night,
  Catppuccin, Rosé Pine, Night Owl, Ayu, etc.; no language trademarks such as
  "Java Dark" or "Python").

## 6. Constraints and decided stack

- **Vite + React + TypeScript.** Static build, deployed by a GitHub Actions
  workflow to GitHub Pages on every push to `main`.
- **Hash-based routing** (`#/`, `#/studio/aliases`, …) so deep links work on
  GitHub Pages without 404 tricks. Vite `base` = `/gitaliases-studio/`.
  The GitHub owner/username is not known yet: use a single config constant
  for the repo URL in the README, footer and links.
- **Dependencies** (approved list; anything else needs the owner's approval):
  `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`,
  `@fontsource/jetbrains-mono` (self-hosted font, OFL license).
  No UI kit, no CSS framework, no state library, no drag-and-drop library.
- **Data as files**, so contributors can open single-file PRs:
  - `src/data/themes/<id>.json`, one theme per file
  - `src/data/catalog/<group>.json`
- License: MIT. README in English with a "Contributing a theme / catalog alias" section.
- Code, comments and commits in English.

## 7. Information architecture

```
Landing  (#/)
Studio   (#/studio/…)  — 4 guided tabs, in this order:
  1. My aliases     #/studio/aliases
  2. Catalog        #/studio/catalog
  3. Log designer   #/studio/log
  4. Apply          #/studio/apply   (tab shows a badge with the pending-change count)
```

The tabs are a guided sequence, but users can jump to any tab at any time.

## 8. Visual direction

- **Modern terminal look** (Windows Terminal / Warp style): app framed as a
  terminal window with a tab strip on top, monospace typography throughout
  (JetBrains Mono), dark by default.
- Controls stay **normal, discoverable web controls** (buttons, inputs, selects,
  checkboxes) styled to match. Mouse-first, fully keyboard-accessible.
  Nothing should require typing commands into a fake prompt.
- The **selected theme skins the whole app** (window background, accents) as well
  as the log preview. Every theme must keep UI text and controls at WCAG AA
  contrast (4.5:1 for text, 3:1 for control borders and focus rings).
- Respect `prefers-reduced-motion`. Visible focus everywhere. Responsive down to
  360px wide (usable, though the designer is desktop-first).

## 9. Writing rules

- Plain language first, git syntax second. Each alias shows:
  a one-line description ("Undo your last commit but keep the changes"),
  usage (`you'll type: git undo`), then the real command in a secondary style.
- Errors say what happened and how to fix it. No apologies, no vagueness.
- Empty states invite an action ("No aliases yet. Import yours or pick some from the Catalog.").
- Sentence case. No ALL-CAPS labels.

## 10. Feature details

### 10.1 Workspace model

A single in-browser workspace holds:

- `baseline`: aliases as imported (may be empty),
- `aliases`: current desired set,
- pending changes, derived from baseline vs. current:
  **added / edited / removed**,
- log designer drafts, selected theme, chosen shell.

Each alias has: `name`, `value` (exact string git will store), `type`
(`shortcut` | `shell` | `log`), optional `description`, optional `designerRecipe`
(for aliases built in the Log designer).

Persist the workspace in `localStorage` (wrapped in try/catch; the app must work
without it). Provide **"Reset workspace"** that clears it. Show a one-line privacy
note about what is stored locally.

### 10.2 My aliases

- **Import** (both supported, both prominent in the empty state):
  1. Paste the output of `git config --get-regexp alias`
     (format: `alias.<name> <value>` per line).
  2. Drop or select a `.gitconfig` file. Parse **only** the `[alias]` section(s);
     discard everything else immediately and never store it. Other sections can hold
     credentials or tokens.
  - Parser must handle git config file syntax: quoted values, escapes
    (`\"`, `\\`, `\n`, `\t`), inline comments (`;`/`#` outside quotes),
    line continuation (`\` at end of line), case-insensitive section names,
    `[alias]` appearing more than once.
  - Show how to get each input, per OS, with a copy button for the command.
- **List**: name, plain description, type badge, change badge (new / edited / removed).
  Imported aliases without a known description get an auto description:
  shortcut → "Runs `git <value>`"; shell → "Runs a shell command"; log → "Custom log view".
- **Create / edit**:
  - Default form: "Short name" + "What it runs" (a git subcommand with arguments,
    without the leading `git`).
  - "Advanced: shell command" toggle for `!`-aliases, with a short warning.
  - Log-type aliases open in the Log designer if they have a recipe or can be
    parsed (see 10.4). Otherwise they are edited as raw text.
- **Validation and warnings** (inline, before saving):
  - invalid name (must match `^[A-Za-z][A-Za-z0-9-]*$`),
  - duplicate name,
  - name equals a built-in git command (git ignores such aliases). Ship a static
    list of built-ins.
  - empty value.
- **Delete** marks as removed (undoable until applied).

### 10.3 Catalog

- ~30 aliases grouped by task: *Status & info*, *Branches*, *Commits*,
  *Undo & fix*, *Sync*, *History*, *Config & aliases*.
  Includes classics such as `st`, `co`, `cb`, `br`, `undo`, `amend`, `unstage`,
  `last`, `lg`, `aliases` (list aliases), and shortcuts similar to those in common
  alias cheat sheets, with English names.
- Each entry: `name`, `value`, `description`, `example`, optional `warning`
  (e.g. destructive commands).
- One click adds it to the workspace. If the name already exists, show a choice:
  replace, add with another name, or cancel.
- Search box filtering by name and description.

### 10.4 Log designer

Builds `log`-type aliases visually. Extends the existing prototype
(`docs/reference/git-log-builder-prototype.html`).

- **Fields**: every `--pretty=format` placeholder that makes sense on one line:
  hashes (`%H %h %T %t %P %p`), author (`%an %ae %al %ad %ar` and the date
  variants), committer (`%cn %ce %cl %cd %cr`), subject `%s`, sanitized subject `%f`,
  body `%b`, raw body `%B` (marked multiline), refs `%d` / `%D`, signature status
  `%G?`, and newline `%n` as a layout element.
  Users add fields from a picker that shows plain names ("Author email") and the
  placeholder.
- **Order**: free reordering with drag (native HTML drag-and-drop) **and**
  move up/down buttons (keyboard).
- **Per field styling**: color (hex picker, git named colors, or "terminal
  default"), attributes git supports (`bold`, `dim`, `italic`, `ul`, `reverse`,
  `strike`), width with alignment (`%<`, `%>`, `%><`) and truncation
  (`trunc`, `ltrunc`, `mtrunc`, or none).
- **Layout**: separator (choice + custom text, `%` escaped, `'` rejected) and
  separator color.
- **Options**: date format (`short`, `relative`, `iso`, `rfc`, custom strftime),
  `--graph`, `--all`, `--decorate` behavior, max-count default.
- **Highlight my commits**: as in the prototype (sed post-processing keyed on
  `git config user.email` at run time; marker, color, bold). Makes the alias a
  shell alias. Requires `sed` (bundled with Git for Windows). Optional pager
  (`less -RFX`) toggle.
  The generated script must work with **BSD sed (macOS)** too. The prototype's
  `\x1b` in the sed replacement is GNU-only, so build the escape character once
  (`e=$(printf '\033')`) and use `${e}[…m`. Covered by the CI test on both runners.
- **Preview**: terminal-styled, sample commits (fictional people; relative dates
  in English as git prints them), updates live, hover/focus on a field highlights
  its segment.
- **Themes** apply a palette to the fields and the preview background.
- **Load from existing alias**: best-effort parse of `log … --pretty=format:'…'`
  values (including the highlight variant created by this tool). Fall back to raw
  edit with a clear message when parsing fails. Store `designerRecipe` for aliases
  built here so they round-trip inside the workspace.

### 10.5 Themes

- 15–20 themes with **original compound names** mixing night deities and
  mythology, creatures of the night, night royalty, and nods to language
  communities, without trademarks. Examples of the naming style:
  "Lantern of Selene", "Velvet Wraith", "Espresso Midnight", "Frost Regent".
- Generated colors render on the user's **real** terminal background, not the
  theme's. So each theme declares `mode: "dark" | "light"`, at least 3 themes are
  light, and the designer lets the user set their terminal background for the
  preview, warning when a field color falls below 3:1 against it.
- Theme file schema: `id`, `name`, `family`, `mode`, `description`, `colors`
  { `bg`, `fg`, `muted`, `accent`, `hash`, `date`, `author`, `me`, `refs`,
  `separator`, … }.
- A unit test checks every theme for required keys and for contrast of text roles
  against `bg` (≥ 4.5:1).
- Before release, check names against well-known VS Code and terminal theme names.

### 10.6 Apply

Shows the pending changes (added / edited / removed, with old → new for edits)
and two methods. **The shell is always explicit.** A selector (PowerShell /
Bash, Git Bash, zsh / Command Prompt) defaults from the OS (Windows → PowerShell)
and has a "Which terminal am I using?" help with how to open one on
Windows / macOS / Linux.

**Method A — All at once (recommended).** Uses quote-free commands only:

1. Back up: copy `~/.gitconfig` (shell-specific one-liner: `Copy-Item` / `cp` / `copy`).
2. Download `.gitaliases`, a git-config file with an `[alias]` section containing
   the **complete desired set** (correctly escaped per git config file rules:
   values with special characters quoted, `"` and `\` escaped).
   Tell the user where to save it (home folder) with per-OS paths.
3. Remove the old alias section from the main config, if aliases were imported:
   `git config --global --remove-section alias`
4. Connect the file: `git config --global include.path ~/.gitaliases`
5. Test: `git <one of the aliases>`.

Steps 3–4 contain no quotes, so they behave the same in every shell.
Restore = copy the backup back.

- Step 3 is shown **only if the user imported their aliases** (otherwise the tool
  doesn't know what it would delete). Without import, skip it and explain that
  aliases defined in the file win over same-named ones already in `~/.gitconfig`,
  because `git config --global include.path` appends the include at the end.
- Re-applying is idempotent: `include.path` is set (replaced), not added twice.
- git expands `~/` in `include.path` itself, so the same text works on Windows.

**Method B — One by one.** Per pending change, a command for the selected shell:

- add/edit: `git config --global alias.<name> <value>`, quoted correctly for
  the shell:
  - PowerShell: single-quoted here-string assigned to a variable, then passed.
    Values containing `"` need PowerShell 7.3+; detect this and show a notice.
  - Bash/zsh: single-quoted with `'\''` escaping.
  - Command Prompt: only when the value has no characters cmd can't handle
    safely; otherwise tell the user to use Method A.
- remove: `git config --global --unset alias.<name>`.
- "Copy all" copies the full sequence.

After applying, the user can mark the changes as applied, which makes the
current set the new baseline.

### 10.7 Landing page

Sections, in order:

1. Headline and a live mini demo (an animated terminal line turning a long
   command into `git st`), plus "Open the studio".
2. The problem: long commands, forgotten aliases, quoting errors across shells,
   configs that are hard to share.
3. How it works: Import → Customize → Apply. This is a real sequence, so
   numbering is fine here.
4. Glossary for non-console users: alias, terminal, `.gitconfig`, global config.
5. Privacy: everything runs in your browser; nothing is uploaded.
6. Footer: GitHub repo link, license, contribute a theme or alias.

## 11. Testing

- **Vitest unit tests** for:
  - both import parsers (get-regexp output; `.gitconfig` with all syntax cases in 10.2),
  - `.gitaliases` serializer (escaping),
  - shell command generators (PowerShell, Bash, cmd guard),
  - log format builder and the best-effort parser (round-trip of recipes),
  - theme schema and contrast.
- **CI integration test** (GitHub Actions matrix: `ubuntu-latest` with bash,
  `windows-latest` with `pwsh`): for a fixture set of tricky aliases, run the
  generated commands against a temp config (`GIT_CONFIG_GLOBAL`) and assert that
  `git config --get alias.<name>` equals the intended value. Do the same for
  Method A (include file plus `git config --get`).
- Deploy job runs only if tests pass.

## 12. Left to the builder

- Component and folder structure, state handling (React context + reducer is enough).
- Styling approach (plain CSS or CSS modules; no framework).
- Exact catalog entries, theme palettes and names (within the rules above).
- Sample commit data for the preview.
- Exact copy, following section 9.

## 13. Calls made without explicit owner input (review these)

- Selected theme skins the whole app, not just the preview.
- Method A removes the whole `[alias]` section from `~/.gitconfig` after a backup,
  so the downloaded file is the single source of truth.
- Command Prompt gets Method B only for simple values.
- Self-hosted font so there are no third-party requests.
- Hash routing.
- MIT license.
- Portable escape sequence for BSD sed (macOS) in the highlight script.
- Themes carry a light/dark mode; at least 3 light themes.
- Method A's cleanup step only appears after an import.
