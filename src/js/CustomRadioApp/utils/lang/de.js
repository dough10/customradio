export const de = {
  stations: count => `${count} Stationen`,
  genreError: 'Ungültige Eingabe. Bitte geben Sie ein gültiges Genre ein.',
  stationsError: error => `Fehler beim Laden der Stationen: ${error}`,

  playing: name => `Wiedergabe: ${name}`,
  homepage: 'Startseite',
  homepageTitle: homepage => `Navigiere zu ${homepage}`, 
  markDup: 'Als Duplikat markieren',
  dupTitle: 'Station als Duplikat markieren',
  playingError: error => `Fehler bei der Wiedergabe: ${error}`,
  noHome: 'Keine Startseite',
  errorHome: error => `Fehler beim Öffnen der Startseite: ${error}`,
  invalidStation: `Ungültige Stationsdaten. Stream kann nicht abgespielt werden.`,
  offline: 'Verbindung getrennt: versuche erneut zu verbinden',
  online: 'Wieder verbunden: versuche Wiedergabe neu zu starten',

  playTitle: 'Stream abspielen',
  addTitle: 'Zur Datei hinzufügen', 
  removeTitle: 'Aus Datei entfernen',

  appUpdated: 'App aktualisiert',
  pressToRefresh: 'Zum Aktualisieren drücken'
};
