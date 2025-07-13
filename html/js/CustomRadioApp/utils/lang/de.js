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
  pressToRefresh: 'Zum Aktualisieren drücken',

  dismiss: 'Zum Schließen klicken',
  moving: (newURL, currentURL) => `
    <h2>Wir ziehen um — bitte beachten!</h2>
    <p>Ab dem nächsten Monat ist unsere Website dauerhaft unter einer neuen Adresse erreichbar:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Bis Ende dieses Monats bleibt <strong>${currentURL}</strong> weiterhin verfügbar. Ab dem 1. erfolgt eine automatische Weiterleitung zur neuen Adresse.</p>
    <p>Bitte aktualisieren Sie jetzt Ihre Lesezeichen und gespeicherten Links.</p>
    <p>Wir freuen uns auf den Neustart und danken Ihnen für Ihre Unterstützung!</p>
  `
};