export const it = {
  stations: count => `${count} stazioni`,
  genreError: 'Input non valido. Inserisci un genere valido.',
  stationsError: error => `Errore durante il recupero delle stazioni: ${error}`,

  playing: name => `In riproduzione: ${name}`,
  homepage: 'pagina principale',
  homepageTitle: homepage => `vai a ${homepage}`, 
  markDup: 'segna come duplicato',
  dupTitle: 'segna la stazione come duplicata',
  playingError: error => `Errore durante la riproduzione: ${error}`,
  noHome: 'Nessuna pagina principale',
  errorHome: error => `Errore nell'apertura della pagina principale: ${error}`,
  invalidStation: `Dati della stazione non validi. Impossibile riprodurre lo stream.`,
  offline: 'Disconnesso: tentativo di riconnessione in corso',
  online: 'Riconnesso: tentativo di riavviare la riproduzione',

  playTitle: 'Riproduci stream',
  addTitle: 'Aggiungi al file', 
  removeTitle: 'Rimuovi dal file',

  appUpdated: 'App aggiornata',
  pressToRefresh: 'Premi per aggiornare',

  dismiss: 'Clicca per chiudere',
  moving: (newURL, currentURL) => `
    <h2>Attenzione! Il nostro sito web sta per avere una nuova casa!</h2>
    <p>Stiamo passando a un nuovo indirizzo web:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Per un periodo limitato, sia ${currentURL} che il nostro nuovo URL saranno completamente accessibili. Ti invitiamo a iniziare a utilizzare il nuovo indirizzo e ad aggiornare tutti i link salvati.</p>
    <p>Grazie per la tua pazienza durante questa transizione!</p>
  `
};