module.exports = {
  clickDismiss: 'Klicken zum Schließen',

  title: 'radio.txt-Ersteller',
  intro: 'Eine Website zum Erstellen einer benutzerdefinierten radio.txt zur Verwendung mit ',
  hibyLink: 'Hiby Digital Audio Playern',
  siteUse: 'So verwenden Sie die Website',
  step1: 'Filtern Sie Sender nach Name oder Genre (z. B. somafm, hip hop, jazz) und fügen Sie dann alle Sender hinzu, die Sie in Ihre radio.txt-Datei aufnehmen möchten.',
  step2: 'Wenn Sie mit Ihrer Liste zufrieden sind, klicken Sie auf „Download“ und speichern Sie die Textdatei im Stammverzeichnis des Speichers Ihres Hiby-Players.',
  closeButtonText: 'schließen',

  filterLabel: 'Nach Name oder Genre filtern',
  downloadButtonText: 'herunterladen',
  volume: 'Lautstärke',

  thanks: 'Vielen Dank für die Nutzung der Website. Bitte melden Sie Sicherheitsprobleme über die unten stehenden Kontaktinformationen.',
  securityContact: 'Sicherheitskontakt',

  addStation: 'Sender hinzufügen',
  addCase1: 'Die URL sollte ein Icecast-Server mit dem Inhaltstyp "audio/mpeg" oder "audio/mp3" sein.',
  addCase2: 'Die API ruft die weiteren Informationen aus den Stream-Headern ab.',
  stationURL: 'Sender-URL',
  addButtonText: 'hinzufügen',

  stations: 'Sender',

  stationExists: 'Sender ist bereits vorhanden',
  conTestFailed: error => `Verbindungstest fehlgeschlagen: ${error}`,
  noName: 'Name des Senders konnte nicht abgerufen werden',
  stationSaved: id => `Sender gespeichert, ID: ${id}`,
  addFail: error => `Sender konnte nicht hinzugefügt werden: ${error}`,

  dupLogged: 'Duplikat protokolliert',
  dupLogFail: error => `Fehler beim Protokollieren des Fehlers: ${error}`,

  cspError: error => `Fehler beim Speichern des CSP-Berichts: ${error}`,

  stationsFail: error => `Fehler beim Abrufen der Sender: ${error}`,

  errorLog: 'Fehler protokolliert',
  errorLogFail: error => `Fehler beim Protokollieren: ${error}`,

  genresFail: error => `Fehler beim Abrufen der Genres: ${error}`
};
