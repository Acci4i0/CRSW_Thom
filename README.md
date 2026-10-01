# CRSW — Thomas

A personal site laid out as a crossword. The letters are written in advance and
hidden; clicking a cell reveals its letter, and when a word is complete its clue
under **INFO** fades from grey to black. Once the grid is finished the page
reloads after 30 seconds. Vanilla HTML, CSS and JavaScript — no dependencies.

**Live:** https://acci4i0.github.io/CRSW_Thom/

Part of the CRSW series — one crossword per person, same code:
[Andrea](https://acci4i0.github.io/CRSW_Andre/) · [Thomas](https://acci4i0.github.io/CRSW_Thom/) · [Ilaria](https://acci4i0.github.io/CRSW_Ila/) · [Emma](https://acci4i0.github.io/CRSW_Emma/) · [Gianmarco](https://acci4i0.github.io/CRSW_Gian/) · [Costanza](https://acci4i0.github.io/CRSW_Costi/)

> **Rebuild study** of [sa-m.fr](https://sa-m.fr) by Samuel Dumez. Original
> concept and design © Samuel Dumez; rebuilt for study, with my own content.
> Not affiliated with the author.

## Running it

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server will do. There is nothing to install and nothing to build.
Add `?dev` to the URL to log the layout checks in the console.

## Structure

```
index.html             the page
style.css              every style
script.js              reveal logic, clue states, reload cycle, corner avatar
puzzle.js              the only per-person file: clues, answers, contacts, avatar
generator.js           builds the two grid layouts and checks they are valid
preloader.js           the counting preloader
assets/                the corner avatar
cruciverba.md          the original project spec (Italian)
tools/design-notes.md  design values read off the original
```

## Changing the content

Everything that changes from person to person lives in
[`puzzle.js`](puzzle.js) — clues, answers, contacts and the corner avatar —
plus the avatar image in `assets/`. `generator.js` builds and validates both
layouts (portrait and landscape) from the answers, so a new word list is
enough — the grid follows.

Every other file is identical across the series: a fix to the shared code goes
into every repo.

## Deploy

Every push to `main` runs [`deploy.yml`](.github/workflows/deploy.yml), which
publishes the site to GitHub Pages.

## License

[MIT](LICENSE) © Andrea Lando ([Acci4i0](https://github.com/Acci4i0)).
Covers my code and content only — not the original design this study looks at.
