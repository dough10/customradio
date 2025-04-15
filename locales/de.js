module.exports = {
  clickDismiss: 'Klicken zum Schließen',

  title: 'radio.txt-Ersteller',
  intro: 'Eine Website zum Erstellen einer benutzerdefinierten radio.txt für die Verwendung mit ',
  hibyLink: 'Hiby Digital Audio Playern',
  siteUse: 'So verwendest du die Seite',
  step1: 'Filtere Sender nach Name oder Genre (z. B. somafm, hip hop, jazz) und füge alle Sender hinzu, die du in deine radio.txt-Datei aufnehmen möchtest.',
  step2: 'Wenn du mit deiner Liste zufrieden bist, klicke auf „Download“ und speichere die Textdatei im Stammverzeichnis des Speichers deines Hiby-Players.',
  closeButtonText: 'schließen',

  filterLabel: 'Nach Name oder Genre filtern',
  downloadButtonText: 'herunterladen',
  volume: 'Lautstärke',

  thanks: 'Wenn dir diese Seite gefällt und du ihren Betrieb unterstützen möchtest, kannst du einen Beitrag leisten. Deine Unterstützung hilft bei Hosting und Weiterentwicklung. Vielen Dank!',
  securityContact: 'Sicherheitskontakt',

  addStation: 'Sender hinzufügen',
  addCase1: 'Die URL sollte ein Icecast-Server mit dem Content-Type "audio/mpeg" oder "audio/mp3" sein.',
  addCase2: 'Die API liest die weiteren Informationen aus den Stream-Headern.',
  stationURL: 'Sender-URL',
  addButtonText: 'hinzufügen',

  stations: 'Sender',

  stationExists: 'Sender existiert bereits',
  conTestFailed: error => `Verbindungstest fehlgeschlagen: ${error}`,
  noName: 'Name des Senders konnte nicht abgerufen werden',
  stationSaved: id => `Sender gespeichert, ID: ${id}`,
  addFail: error => `Fehler beim Hinzufügen des Senders: ${error}`,

  dupLogged: 'Duplikat protokolliert',
  dupLogFail: error => `Fehler beim Protokollieren des Fehlers: ${error}`,

  cspError: error => `Fehler beim Speichern des CSP-Berichts: ${error}`,

  stationsFail: error => `Fehler beim Laden der Sender: ${error}`,

  errorLog: 'Fehler protokolliert',
  errorLogFail: error => `Fehler beim Protokollieren des Fehlers: ${error}`,

  genresFail: error => `Fehler beim Abrufen der Genres: ${error}`
};
