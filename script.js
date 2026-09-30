// Rebuild study of sa-m.fr by Samuel Dumez.
// Original concept and design © Samuel Dumez. Rebuilt for study purposes.

// Tutti i dati specifici della persona stanno in puzzle.js (global PUZZLE);
// l'algoritmo dei layout sta in generator.js (global generateLayout).

// Indizi normalizzati: risposte in MAIUSCOLO e solo A-Z.
const CLUES = PUZZLE.clues.map(normalizeClue);

// I due layout vengono generati a runtime dalle risposte. Deterministico:
// stesso puzzle.js = stessa griglia a ogni reload. null se non e generabile.
const LAYOUTS = {
  portrait: generateLayout(CLUES, "portrait"),
  landscape: generateLayout(CLUES, "landscape"),
};

function normalizeClue(clue) {
  return {
    number: clue.number,
    clue: clue.clue,
    answer: clue.answer.toUpperCase().replace(/[^A-Z]/g, ""),
  };
}

const RELOAD_AFTER_COMPLETION_MS = 30000;

const MIN_FOOTER_SCALE = 0.9;

// Una chiave per sito: tutti i cruciverba della serie stanno sullo stesso
// dominio (acci4i0.github.io) e quindi condividono lo stesso localStorage.
const AVATAR_STORAGE_KEY = `crsw-avatar:${location.pathname}`;
const AVATAR_FADE_MS = 200; // come il fade degli indizi in style.css

const PORTRAIT_BREAKPOINT = window.matchMedia("(max-width: 820px)");

const grid = document.getElementById("grid");

// Stato della partita corrente (ricostruito a ogni cambio di layout).
let cells = new Map(); // "col,row" -> { element, letter, revealed, words }
const solvedNumbers = new Set(); // sopravvive al cambio di layout

main();

function main() {
  document.title = PUZZLE.title;
  renderFooter();
  fitFooterText();
  window.addEventListener("resize", fitFooterText);
  renderAvatar(PUZZLE.avatars || []);

  if (!LAYOUTS.portrait || !LAYOUTS.landscape) {
    reportGenerationFailure();
    return;
  }

  applyLayout(selectLayout());
  PORTRAIT_BREAKPOINT.addEventListener("change", () => applyLayout(selectLayout()));
  grid.addEventListener("click", handleCellClick);
  if (isDevEnvironment()) runDevValidation();
}

// Le risposte non si incrociano abbastanza: si avvisa l'autore (in anteprima)
// invece di mostrare una pagina rotta.
function reportGenerationFailure() {
  console.error(
    "Impossibile generare il cruciverba: le risposte in puzzle.js non si incrociano. " +
      "Controlla che condividano alcune lettere."
  );
  grid.textContent =
    "⚠️ Impossibile generare il cruciverba: le risposte in puzzle.js devono condividere alcune lettere.";
}

// ---- Footer (INFO + CONTACT) generato dai dati di PUZZLE ----

function renderFooter() {
  const footer = document.getElementById("footer");
  footer.innerHTML = "";
  const half = Math.ceil(CLUES.length / 2);
  footer.appendChild(infoColumn(CLUES.slice(0, half), "INFO"));
  footer.appendChild(infoColumn(CLUES.slice(half), null));
  footer.appendChild(contactBlock(PUZZLE.contact));
}

// Una colonna di indizi. L'etichetta "INFO" (assoluta) compare solo nella
// prima colonna; lo spacer nascosto riserva la riga dell'etichetta cosi le due
// colonne partono allineate.
function infoColumn(clues, label) {
  const div = document.createElement("div");
  div.className = "info";
  const ul = document.createElement("ul");
  if (label) ul.appendChild(listItem("head-list", label));
  ul.appendChild(listItem("spacer", clues.length ? `${clues[0].number}.` : ""));
  for (const clue of clues) ul.appendChild(clueItem(clue));
  div.appendChild(ul);
  return div;
}

function clueItem(clue) {
  const item = document.createElement("li");
  item.className = "clue";
  item.dataset.clue = clue.number;
  const num = document.createElement("span");
  num.className = "num";
  num.textContent = `${clue.number}.`;
  item.append(num, document.createTextNode(clue.clue));
  return item;
}

function contactBlock(contact) {
  const div = document.createElement("div");
  div.className = "contact";

  const labels = document.createElement("ul");
  labels.appendChild(listItem("head-list", "CONTACT"));
  labels.appendChild(listItem("spacer", "m."));
  for (const prefix of ["m.", "t.", "i.", "©"]) labels.appendChild(listItem(null, prefix));

  const values = document.createElement("ul");
  values.appendChild(listItem("spacer", "CONTACT"));
  values.appendChild(linkItem(`mailto:${contact.mail}`, contact.mail));
  values.appendChild(linkItem(`tel:${contact.tel}`, contact.telDisplay));
  values.appendChild(linkItem(contact.instagramUrl, `@${contact.instagram}`, true));
  values.appendChild(listItem(null, String(contact.year)));

  div.append(labels, values);
  return div;
}

// Ogni voce del footer dovrebbe stare su una riga. Sui telefoni stretti una
// mail o un indizio lunghi non ci stanno: allora va a capo solo la colonna di
// indizi piu' larga (le altre voci e i contatti restano su una riga) e il
// testo si riduce un poco, mai sotto MIN_FOOTER_SCALE.
function fitFooterText() {
  const footer = document.getElementById("footer");
  footer.style.fontSize = "";
  letWidestInfoColumnWrap(footer);
  const baseSize = parseFloat(getComputedStyle(footer).fontSize);
  let scale = 1;
  while (footerWraps(footer) && scale > MIN_FOOTER_SCALE) {
    scale = Math.max(MIN_FOOTER_SCALE, scale - 0.02);
    footer.style.fontSize = `${baseSize * scale}px`;
  }
}

// Misura le colonne quando nessuna puo' restringersi (larghezza naturale).
function letWidestInfoColumnWrap(footer) {
  const infoColumns = [...footer.querySelectorAll(".info")];
  infoColumns.forEach((column) => column.classList.remove("can-wrap"));
  const widest = infoColumns.reduce((a, b) => (b.offsetWidth > a.offsetWidth ? b : a));
  widest.classList.add("can-wrap");
}

// Lo spacer ("1.") e' sempre una riga sola: fa da metro per l'altezza di riga.
function footerWraps(footer) {
  const lineHeight = footer.querySelector(".spacer").offsetHeight;
  return [...footer.querySelectorAll("li")].some((item) => item.offsetHeight > lineHeight * 1.5);
}

function listItem(className, text) {
  const item = document.createElement("li");
  if (className) item.className = className;
  item.textContent = text;
  return item;
}

function linkItem(href, text, external) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  if (external) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  item.appendChild(link);
  return item;
}

// ---- Avatar in alto a sinistra (facoltativo: PUZZLE.avatars) ----

// Ogni voce di PUZZLE.avatars e' il percorso di un'immagine oppure
// { sprite, frames, frameMs } per un'animazione a sprite sheet. Con piu' di
// una voce compaiono le frecce; la scelta resta salvata nel browser.
function renderAvatar(avatars) {
  if (avatars.length === 0) return;

  const slot = document.createElement("div");
  slot.className = "avatar-slot";
  let current = savedAvatarIndex(avatars.length);
  slot.appendChild(avatarElement(avatars[current]));

  const container = document.createElement("div");
  container.className = "avatar";
  container.appendChild(slot);

  if (avatars.length > 1) {
    container.appendChild(
      avatarArrows((step) => {
        current = (current + step + avatars.length) % avatars.length;
        saveAvatarIndex(current);
        swapAvatar(slot, avatarElement(avatars[current]));
      })
    );
    preloadImages(avatars.filter((avatar) => typeof avatar === "string"));
  }

  document.body.appendChild(container);
}

function avatarElement(avatar) {
  return typeof avatar === "string" ? avatarImage(avatar) : avatarSprite(avatar);
}

function avatarImage(src) {
  const image = document.createElement("img");
  image.className = "avatar-image";
  image.src = src;
  image.alt = "";
  image.draggable = false;
  return image;
}

// steps() non accetta variabili CSS in modo affidabile: l'animazione si
// imposta qui, con il numero di frame e la durata presi da puzzle.js.
function avatarSprite({ sprite, frames, frameMs }) {
  const element = document.createElement("div");
  element.className = "walk";
  element.style.setProperty("--walk-frames", frames);
  element.style.backgroundImage = `url(${sprite})`;
  element.style.animation = `walk ${frames * frameMs}ms steps(${frames}) infinite`;
  return element;
}

function avatarArrows(onStep) {
  const arrows = document.createElement("div");
  arrows.className = "avatar-arrows";
  arrows.append(
    arrowButton("←", "Avatar precedente", () => onStep(-1)),
    arrowButton("→", "Avatar successivo", () => onStep(1))
  );
  return arrows;
}

function arrowButton(symbol, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = symbol;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

// Dissolvenza: l'avatar sfuma, viene sostituito e ricompare.
let avatarSwapTimer = null;

function swapAvatar(slot, element) {
  clearTimeout(avatarSwapTimer);
  slot.classList.add("is-changing");
  avatarSwapTimer = setTimeout(() => {
    slot.replaceChildren(element);
    slot.classList.remove("is-changing");
  }, AVATAR_FADE_MS);
}

// Le altre immagini si scaricano dopo il load, cosi' il cambio e' immediato
// senza rallentare la prima apertura.
function preloadImages(sources) {
  window.addEventListener("load", () => {
    for (const src of sources) new Image().src = src;
  });
}

// localStorage puo' mancare (navigazione privata, dati bloccati): in quel
// caso si parte dal primo avatar e la scelta vale solo per questa visita.
function savedAvatarIndex(count) {
  try {
    const index = Number(localStorage.getItem(AVATAR_STORAGE_KEY));
    return Number.isInteger(index) && index >= 0 && index < count ? index : 0;
  } catch {
    return 0;
  }
}

function saveAvatarIndex(index) {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, String(index));
  } catch {
    // Nessuno storage disponibile: niente da salvare.
  }
}

// ---- Layout ----

function selectLayout() {
  return PORTRAIT_BREAKPOINT.matches ? LAYOUTS.portrait : LAYOUTS.landscape;
}

function applyLayout(layout) {
  renderGrid(layout);
  for (const number of solvedNumbers) revealClue(number);
}

// Tutte le lettere sono pre-scritte ma nascoste; la prima cella di ogni
// parola mostra il numero della domanda e la sua lettera già rivelata.
function renderGrid(layout) {
  grid.style.setProperty("--cols", layout.cols);
  grid.style.setProperty("--rows", layout.rows);
  grid.innerHTML = "";
  cells = new Map();

  for (const word of layout.words) {
    word.answer.split("").forEach((letter, index) => {
      const cell = obtainCell(wordCell(word, index), letter);
      cell.words.push(word);
      if (index === 0) {
        addHintNumber(cell, word.number);
        revealCell(cell);
      }
    });
  }
}

function obtainCell({ col, row }, letter) {
  const key = cellKey({ col, row });
  if (cells.has(key)) return cells.get(key);

  const element = document.createElement("div");
  element.className = "square";
  element.dataset.key = key;
  element.style.gridColumn = col + 1;
  element.style.gridRow = row + 1;

  const content = document.createElement("span");
  content.className = "content hidden-letter";
  content.textContent = letter;
  element.appendChild(content);
  grid.appendChild(element);

  const cell = { element, letter, revealed: false, words: [] };
  cells.set(key, cell);
  return cell;
}

function addHintNumber(cell, number) {
  const mini = document.createElement("span");
  mini.className = "mini";
  mini.textContent = number;
  cell.element.appendChild(mini);
}

// ---- Interazione: il click su una cella rivela la sua lettera ----

function handleCellClick(event) {
  const square = event.target.closest(".square");
  if (!square) return;
  const cell = cells.get(square.dataset.key);
  if (cell.revealed) return;
  revealCell(cell);
  cell.words.forEach(checkWordCompletion);
}

function revealCell(cell) {
  cell.revealed = true;
  cell.element.querySelector(".content").classList.remove("hidden-letter");
}

// ---- Completamento e reveal degli indizi ----

function checkWordCompletion(word) {
  if (solvedNumbers.has(word.number)) return;
  const complete = word.answer
    .split("")
    .every((_, index) => cells.get(cellKey(wordCell(word, index))).revealed);
  if (!complete) return;
  solvedNumbers.add(word.number);
  revealClue(word.number);
  if (solvedNumbers.size === currentWordCount()) scheduleReload();
}

function revealClue(number) {
  document
    .querySelectorAll(`[data-clue="${number}"]`)
    .forEach((clue) => clue.classList.add("reveal"));
}

function currentWordCount() {
  return selectLayout().words.length;
}

// Come l'originale: a cruciverba completo la pagina si ricarica poco dopo
// (ed è per questo che al load compare il preloader col contatore —
// vedi preloader.js).
function scheduleReload() {
  setTimeout(() => location.reload(), RELOAD_AFTER_COMPLETION_MS);
}

// ---- Geometria condivisa ----

function wordCell(word, index) {
  return word.direction === "across"
    ? { col: word.col + index, row: word.row }
    : { col: word.col, row: word.row + index };
}

function cellKey({ col, row }) {
  return `${col},${row}`;
}

// ---- Validazione dei layout (solo dev: ?dev oppure localhost) ----

function isDevEnvironment() {
  return location.search.includes("dev")
    || location.hostname === "localhost"
    || location.hostname === "127.0.0.1";
}

// validateLayout() arriva da generator.js (stessa logica usata in generazione).
function runDevValidation() {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    const problems = validateLayout(layout);
    if (problems.length > 0) {
      console.error(`Layout ${name} non valido:`, problems);
    } else {
      console.info(`Layout ${name}: OK`);
    }
  }
}
