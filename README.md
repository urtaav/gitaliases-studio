# GitAliases Studio

Import, design and apply git aliases visually. Everything runs in your browser.

- **Start**: pick what you want to do, in plain words.
- **My aliases**: bring in the aliases you already have and edit them.
- **Catalog**: add popular aliases, each explained, or open them in a designer with **Customize**.
- **Designers**: build aliases from options, with a live preview and a part-by-part explanation of the command:
  - **History**: what each line of `git log` shows, in your order and colors.
  - **Branches**: your branches, newest first, with the details you choose.
  - **Charts**: commits per day, week or author, or the most changed files, as bars that always fit.
  - **Undo**: tell it what happened and get the right command. Commands that can delete work need your explicit OK and ask before running.
- **Apply**: get commands that work in PowerShell (5.1 and 7), Bash/zsh or Command Prompt, or one file for everything.

Live site: `https://OWNER.github.io/gitaliases-studio/`

## Development

Requires Node 22 or newer.

```bash
npm install
npm run dev               # local server
npm test                  # unit tests
npm run test:integration  # runs generated commands with real git (bash and/or pwsh)
npm run build
npm run screenshot -- / /studio/log   # after a build; Git Bash users prefix MSYS_NO_PATHCONV=1
```

## Contributing

Two kinds of contributions only need one new file.

### A theme

Add `src/data/themes/<id>.json`:

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "family": "deity",
  "mode": "dark",
  "description": "One short sentence.",
  "colors": {
    "bg": "#15111F", "fg": "#DCD5EE", "muted": "#9A90B5", "accent": "#B9A3FF",
    "hash": "#FFCF70", "date": "#A69CC2", "author": "#92B8FF", "me": "#8FE3B5",
    "refs": "#FF9EBE", "separator": "#3D3550", "subject": "#DCD5EE"
  }
}
```

Rules, checked by `npm test`:

- `id` matches the file name. `family` is one of `deity`, `creature`, `royalty`, `language`; `mode` is `dark` or `light`.
- Every color is `#RRGGBB`. `fg`, `hash`, `date`, `author`, `me`, `refs` and `subject` reach a 4.5:1 contrast ratio against `bg`; `muted` reaches 3:1.
- The name is original: no existing theme names and no trademarks (for example, no programming-language names).

### A catalog alias

Add an entry to the right file in `src/data/catalog/`:

```json
{ "name": "undo", "value": "reset --soft HEAD~1", "description": "Undo your last commit but keep its changes staged.", "example": "git undo" }
```

The name must not be a git command, and destructive commands need a `warning`.

## License

MIT
