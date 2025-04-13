export const it = {
  stations: count => `${count} stazioni`,
  genreError: 'Input non valido. Inserisci un genere valido.',
  stationsError: error => `Errore durante il recupero delle stazioni: ${error}`,
  playing: name => `In riproduzione: ${name}`,
  homepage: 'pagina principale',
  homepageTitle: homepage => `vai a ${homepage}`, 
  markDup: 'segna come duplicato',
  dupTitle: 'segna la stazione come duplicato',
  playingError: error => `Errore durante la riproduzione: ${error}`,
  noHome: 'Nessuna pagina principale',
  errorHome: error => `Errore nell'apertura della pagina principale: ${error}`,
  offline: 'Disconnesso: tentativo di riconnessione in corso',
  online: 'Riconnesso: tentativo di riprendere la riproduzione',
  playTitle: 'Riproduci lo streaming',
  addTitle: 'Aggiungi al file', 
  removeTitle: 'Rimuovi dal file'
};
