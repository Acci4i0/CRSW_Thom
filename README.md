# crossword (thom) — a personal site shaped like a crossword

A personal site laid out as a crossword. The letters are written in advance and
hidden; clicking a cell reveals its letter, and when a word is complete its clue
under **INFO** fades from grey to black. Once the grid is finished the page
reloads after 30 seconds. Vanilla HTML, CSS and JavaScript — no dependencies.

**Live:** https://acci4i0.github.io/crossword_thom/

This is a separate deployment of the [crossword](https://github.com/Acci4i0/crossword)
project, kept apart so its grid and clues can be changed without touching the
original.

> **Rebuild study** of [sa-m.fr](https://sa-m.fr) by Samuel Dumez. Original
> concept and design © Samuel Dumez; rebuilt for study, with my own content.
> Not affiliated with the author.

## Running it

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server will do. There is nothing to install and nothing to build.

## Structure

```
index.html          the page
style.css           every style
script.js           reveal logic, clue states, reload cycle
puzzle.js           the grid: words, positions, clues
generator.js        builds the layout and checks it fits
preloader.js        the counting preloader
cruciverba.md       the project spec
tools/design-notes.md  design values read off the original
```

## Changing the content

Words, positions and clues live in [`puzzle.js`](puzzle.js). `generator.js`
builds and validates the layout from them, so a new word list is enough — the
grid follows.

## License

[MIT](LICENSE) © Andrea Lando ([Acci4i0](https://github.com/Acci4i0)).
Covers my code and content only — not the original design this study looks at.
