// ============================================================================
//  PUZZLE.JS — L'UNICO FILE DA MODIFICARE PER CREARE UN CRUCIVERBA
// ============================================================================
//
//  Per fare il cruciverba di una nuova persona, cambia solo i valori qui sotto
//  e ricarica la pagina: la griglia (portrait + landscape) e il footer con gli
//  indizi si rigenerano da soli, in automatico.
//
//  Regole per le risposte (answer):
//   - una sola parola, senza spazi
//   - vengono messe in MAIUSCOLO in automatico; le lettere accentate vengono
//     tolte, non convertite: scrivi "BONARIETA", non "BONARIETÀ"
//   - le parole devono CONDIVIDERE QUALCHE LETTERA tra loro, altrimenti il
//     cruciverba non puo incrociarsi (in locale, con ?dev, vedrai un avviso)
//
//  Numero di indizi: libero (il footer si divide da solo in due colonne).
//
//  Avatar in alto a sinistra (facoltativo): il percorso di un'immagine in
//  assets/ ("assets/avatar.webp") oppure un'animazione a sprite sheet
//  ({ sprite, frames, frameMs }). Togli la riga per non mostrarlo.
// ============================================================================

const PUZZLE = {
  // Titolo della scheda del browser.
  title: "Thomas",

  // Gli indizi e le risposte. clue = la domanda mostrata sotto "INFO".
  clues: [
    { number: 1, clue: "Il mio nome",               answer: "THOMAS" },
    { number: 2, clue: "Ma mi chiamano",            answer: "PAVESINO" },
    { number: 3, clue: "Dove studio?",              answer: "NEWYORK" },
    { number: 4, clue: "Grazie al?",                answer: "CALCIO" },
    { number: 5, clue: "La mia passione è la",      answer: "FESTA" },
    { number: 6, clue: "Ma anche la",               answer: "FIG*" },
    { number: 7, clue: "Spendo molto in",           answer: "VESTITI" },
    { number: 8, clue: "Il mio più grande difetto", answer: "NESSUNO" },
  ],

  // Contatti mostrati sotto "CONTACT".
  contact: {
    mail: "lando.thomas04@gmail.com",
    tel: "+3933374769773", // usato nel link "chiama"
    telDisplay: "+39 33374769773", // come viene mostrato
    instagram: "thomaslandoo",
    instagramUrl: "https://instagram.com/thomaslandoo",
    year: 2026,
  },

  // Avatar in alto a sinistra (vedi in cima al file).
  avatar: "assets/avatar.webp",
};
