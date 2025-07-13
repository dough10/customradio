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
    <h2>Ci trasferiamo — è importante!</h2>
    <p>Dal prossimo mese, il nostro sito sarà raggiungibile in modo permanente al nuovo indirizzo:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Fino alla fine del mese, <strong>${currentURL}</strong> rimarrà accessibile. Dal 1°, verrai reindirizzato automaticamente.</p>
    <p>Ti consigliamo di aggiornare subito i tuoi segnalibri.</p>
    <p>Grazie per seguirci anche in questa nuova fase!</p>
  `
};