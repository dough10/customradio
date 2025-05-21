module.exports = {
  clickDismiss: 'Klicka för att stänga',
  
  title: 'radio.txt skapare',
  intro: 'En webbplats för att skapa en anpassad radio.txt för användning med ',
  hibyLink: 'Hiby digitala ljudspelare',
  siteUse: 'Så här använder du webbplatsen',
  step1: 'Filtrera stationer efter namn eller genre (t.ex. somafm, hiphop, jazz), lägg sedan till alla stationer du vill inkludera i din radio.txt-fil.',
  step2: 'När du är nöjd med din lista, tryck på "Ladda ner" och spara textfilen i rotkatalogen för lagringen på din Hiby-spelare.',
  closeButtonText: 'stäng',

  filterLabel: 'Filtrera efter namn eller genre',
  downloadButtonText: 'ladda ner',
  volume: 'Volym',

  thanks: 'Om du tycker att den här webbplatsen är användbar och vill stödja dess underhåll kan du ge ett bidrag. Ditt stöd hjälper till med hosting och fortsatt utveckling. Tack!',
  securityContact: 'Säkerhetskontakt',

  addStation: 'lägg till station',
  addCase1: 'URL:en ska vara en Icecast-server med innehållstypen "audio/mpeg" eller "audio/mp3"',
  addCase2: 'API:et hämtar övrig information från strömhuvudena.',
  stationURL: 'Stations-URL',
  addButtonText: 'lägg till',

  stations: 'stationer',

  stationExists: 'Stationen finns redan',
  conTestFailed: error => `Anslutningstest misslyckades: ${error}`,
  noName: 'Kunde inte hämta stationsnamn',
  stationSaved: id => `Station sparad, ID: ${id}`,
  addFail: error => `Misslyckades med att lägga till station: ${error}`,

  dupLogged: 'Dubblett loggad',
  dupLogFail: error => `Misslyckades med att logga fel: ${error}`,

  cspError: error => `Fel vid spara CSP-rapport: ${error}`,

  stationsFail: error => `Fel vid hämtning av stationer: ${error}`,

  errorLog: 'fel loggat',
  errorLogFail: error => `Misslyckades med att logga fel: ${error}`,

  genresFail: error => `Fel vid hämtning av genrer: ${error}`
};