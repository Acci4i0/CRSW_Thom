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

// Distanza minima fra l'avatar e la griglia.
const AVATAR_CLEARANCE_PX = 12;

// Lo show dell'avatar quando lo si tocca (vedi playAvatarShow).
const AVATAR_SHOW_MS = 7500; // saltelli lenti, goffi ma non frenetici
const AVATAR_WIGGLE_MS = 700;
let avatarShow = null; // l'animazione in corso, se c'e'

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
  if (PUZZLE.avatar) renderAvatar(PUZZLE.avatar);
  window.addEventListener("resize", keepGridClearOfAvatar);

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

// ---- Avatar in alto a sinistra (facoltativo: PUZZLE.avatar) ----

// PUZZLE.avatar e' il percorso di un'immagine oppure { sprite, frames,
// frameMs } per un'animazione a sprite sheet (es. la camminata).
// Toccandolo l'avatar prende vita: vedi playAvatarShow().
function renderAvatar(avatar) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "avatar";
  button.setAttribute("aria-label", "Fai muovere l'avatar");
  button.appendChild(typeof avatar === "string" ? avatarImage(avatar) : avatarSprite(avatar));
  button.addEventListener("click", () => playAvatarShow(button));
  document.body.appendChild(button);
}

function avatarImage(src) {
  const image = document.createElement("img");
  image.className = "avatar-image";
  image.src = src;
  image.alt = "";
  image.draggable = false;
  return image;
}

// L'avatar e' fisso in alto a sinistra e la griglia, centrata, occupa piu'
// spazio possibile: su una finestra bassa e larga arriverebbe sotto
// l'avatar. Solo in quel caso si allarga il margine laterale della griglia
// fino a oltre l'avatar: la griglia si stringe un poco, resta centrata e alla
// stessa altezza, con l'avatar alla sua sinistra (--avatar-reserve in
// style.css).
function keepGridClearOfAvatar() {
  const avatar = document.querySelector(".avatar");
  // Durante lo show la posizione e' alterata dalla trasformazione: si
  // ricontrolla quando l'avatar e' tornato al suo posto.
  if (!avatar || avatarShow) return;
  const area = grid.parentElement;
  area.style.setProperty("--avatar-reserve", "0px");
  const avatarBox = avatar.getBoundingClientRect();
  if (!gridOverlaps(avatarBox)) return;
  area.style.setProperty("--avatar-reserve", `${avatarBox.right + AVATAR_CLEARANCE_PX}px`);
}

function gridOverlaps(box) {
  const gap = AVATAR_CLEARANCE_PX;
  return [...grid.children].some((cell) => {
    const r = cell.getBoundingClientRect();
    return r.left < box.right + gap && r.right > box.left - gap
      && r.top < box.bottom + gap && r.bottom > box.top - gap;
  });
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

// ---- L'avatar prende vita ----

// Al tocco l'avatar si stacca dall'angolo e, a saltelli goffi, va al centro
// dello schermo ingrandendosi; li' improvvisa (un gran salto, rimbalzi a
// destra e a sinistra, barcolla, si gira a mezz'aria) e poi torna piano piano
// al suo posto. Tutto con trasformazioni (Web Animations API, come il
// preloader): niente cambia nel layout della pagina.
function playAvatarShow(avatar) {
  if (avatarShow) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  avatarShow = reduceMotion
    ? avatar.animate(wiggleKeyframes(), { duration: AVATAR_WIGGLE_MS })
    : avatar.animate(clumsyShowKeyframes(avatar.getBoundingClientRect()), { duration: AVATAR_SHOW_MS });
  avatar.classList.add("is-alive");
  avatarShow.onfinish = () => {
    avatarShow = null;
    avatar.classList.remove("is-alive");
    keepGridClearOfAvatar();
  };
}

// Chi ha chiesto meno movimento vede solo una piccola oscillazione sul posto.
function wiggleKeyframes() {
  return [0, -8, 7, -4, 0].map((degrees) => ({ transform: `rotate(${degrees}deg)` }));
}

// Coordinate in pixel rispetto alla posizione di riposo; la trasformazione
// parte dal centro della base (transform-origin in style.css), cosi' gli
// schiacciamenti sembrano appoggiati a terra.
function clumsyShowKeyframes(box) {
  const size = box.height;
  const bigScale = Math.min(3.5, Math.max(2.5, (Math.min(innerWidth, innerHeight) * 0.3) / size));
  // la base dell'avatar ingrandito va sotto il centro dello schermo, cosi'
  // la figura risulta centrata
  const center = {
    x: innerWidth / 2 - (box.left + box.width / 2),
    y: innerHeight / 2 + (size * bigScale) / 2 - box.bottom,
  };
  const hop = size * bigScale * 0.35;
  const step = size * bigScale * 0.8;
  const rest = { x: 0, y: 0 };

  return [
    pose(0, rest, { scale: 1 }),
    pose(0.03, rest, { scale: 1, squash: 0.2, easing: "ease-out" }), // si prepara
    ...hopsBetween(rest, center, 1, bigScale, { from: 0.03, to: 0.25, count: 3, height: hop * 0.8 }),

    // al centro: si raddrizza, si accuccia e fa un gran salto
    pose(0.27, center, { scale: bigScale, squash: -0.05 }),
    pose(0.3, center, { scale: bigScale, squash: 0.22, easing: "ease-out" }),
    pose(0.36, at(center, 0, -hop * 2.2), { scale: bigScale, squash: -0.12, rotate: -6, easing: "ease-in" }),
    pose(0.41, center, { scale: bigScale, squash: 0.25, easing: "ease-out" }),
    pose(0.44, center, { scale: bigScale }),

    // rimbalza a sinistra, poi a destra inclinandosi in modo goffo
    pose(0.47, at(center, -step / 2, -hop), { scale: bigScale, rotate: -10, easing: "ease-in" }),
    pose(0.5, at(center, -step, 0), { scale: bigScale, squash: 0.18, rotate: -12, easing: "ease-out" }),
    pose(0.54, at(center, 0, -hop * 1.2), { scale: bigScale, rotate: 8, easing: "ease-in" }),
    pose(0.58, at(center, step, 0), { scale: bigScale, squash: 0.18, rotate: 14, easing: "ease-out" }),

    // barcolla come se perdesse l'equilibrio
    pose(0.61, at(center, step, 0), { scale: bigScale, rotate: -9 }),
    pose(0.64, at(center, step, 0), { scale: bigScale, rotate: 7 }),
    pose(0.66, at(center, step, 0), { scale: bigScale, rotate: -3, easing: "ease-out" }),

    // si gira a mezz'aria e torna al centro
    pose(0.7, at(center, step / 2, -hop * 1.3), { scale: bigScale, flip: true, easing: "ease-in" }),
    pose(0.73, center, { scale: bigScale, flip: true, squash: 0.2, easing: "ease-out" }),
    pose(0.75, center, { scale: bigScale }),

    // e se ne va piano piano: saltelli sempre piu' piccoli fino all'angolo
    ...hopsBetween(center, rest, bigScale, 1, { from: 0.75, to: 0.97, count: 4, height: hop * 0.7 }),
    pose(1, rest, { scale: 1 }),
  ];
}

// Una serie di saltelli da `from` a `to`: a ogni balzo sale, ondeggia e
// atterra schiacciandosi un poco; la scala passa da fromScale a toScale.
function hopsBetween(start, end, fromScale, toScale, { from, to, count, height }) {
  const frames = [];
  const span = (to - from) / count;
  for (let i = 1; i <= count; i++) {
    const midT = (i - 0.5) / count;
    const landT = i / count;
    const midScale = lerp(fromScale, toScale, midT);
    const lift = height * (midScale / Math.max(fromScale, toScale));
    frames.push(
      pose(from + span * (i - 0.5), at(lerpPoint(start, end, midT), 0, -lift), {
        scale: midScale,
        rotate: i % 2 ? -9 : 9,
        easing: "ease-in",
      }),
      pose(from + span * i, lerpPoint(start, end, landT), {
        scale: lerp(fromScale, toScale, landT),
        squash: 0.16,
        easing: "ease-out",
      })
    );
  }
  return frames;
}

// squash > 0 schiaccia (piu' largo e basso), < 0 allunga; flip lo specchia.
function pose(offset, { x, y }, { scale, squash = 0, rotate = 0, flip = false, easing = "ease-in-out" }) {
  const scaleX = scale * (1 + squash * 0.7) * (flip ? -1 : 1);
  const scaleY = scale * (1 - squash);
  return {
    offset,
    easing,
    transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`,
  };
}

function at({ x, y }, dx, dy) {
  return { x: x + dx, y: y + dy };
}

function lerpPoint(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ---- Layout ----

function selectLayout() {
  return PORTRAIT_BREAKPOINT.matches ? LAYOUTS.portrait : LAYOUTS.landscape;
}

function applyLayout(layout) {
  renderGrid(layout);
  for (const number of solvedNumbers) revealClue(number);
  keepGridClearOfAvatar();
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
