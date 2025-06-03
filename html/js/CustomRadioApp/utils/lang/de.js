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
    <h2>Achtung! Unsere Website bekommt ein neues Zuhause!</h2>
    <p>Wir wechseln zu einer neuen Webadresse:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Für eine begrenzte Zeit sind sowohl ${currentURL} als auch unsere neue URL vollständig zugänglich. Wir empfehlen Ihnen, die neue Adresse zu verwenden und alle gespeicherten Links zu aktualisieren.</p>
    <p>Vielen Dank für Ihre Geduld während dieses Übergangs!</p>
  `
};