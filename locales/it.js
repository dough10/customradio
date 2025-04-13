module.exports = {
  clickDismiss: 'Clicca per chiudere',

  title: 'Creatore di radio.txt',
  intro: 'Un sito web per creare un file radio.txt personalizzato da usare con ',
  hibyLink: 'i lettori audio digitali Hiby',
  siteUse: 'Per utilizzare il sito',
  step1: 'Filtra le stazioni per nome o genere (es. somafm, hip hop, jazz), poi aggiungi tutte le stazioni che vuoi includere nel tuo file radio.txt.',
  step2: 'Quando sei soddisfatto della tua lista, clicca su "Scarica" e salva il file di testo nella directory principale della memoria del tuo lettore Hiby.',
  closeButtonText: 'chiudi',

  filterLabel: 'Filtra per nome o genere',
  downloadButtonText: 'scarica',
  volume: 'Volume',

  thanks: 'Grazie per aver utilizzato il sito. Segnala eventuali problemi di sicurezza ai contatti qui sotto.',
  securityContact: 'Contatto per la sicurezza',

  addStation: 'aggiungi stazione',
  addCase1: 'L’URL deve essere un server Icecast con tipo di contenuto "audio/mpeg" o "audio/mp3".',
  addCase2: 'L’API recupererà le altre informazioni dagli header dello stream.',
  stationURL: 'URL della stazione',
  addButtonText: 'aggiungi',

  stations: 'stazioni',

  stationExists: 'La stazione esiste già',
  conTestFailed: error => `Test di connessione fallito: ${error}`,
  noName: 'Impossibile recuperare il nome della stazione',
  stationSaved: id => `Stazione salvata, ID: ${id}`,
  addFail: error => `Errore nell’aggiunta della stazione: ${error}`,

  dupLogged: 'Duplicato registrato',
  dupLogFail: error => `Errore nella registrazione del duplicato: ${error}`,

  cspError: error => `Errore nel salvataggio del report CSP: ${error}`,

  stationsFail: error => `Errore nel recupero delle stazioni: ${error}`,

  errorLog: 'errore registrato',
  errorLogFail: error => `Errore nella registrazione: ${error}`,

  genresFail: error => `Errore nel recupero dei generi: ${error}`
};
