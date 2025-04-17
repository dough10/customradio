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
  pressToRefresh: 'Premi per aggiornare'
};
