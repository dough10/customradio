module.exports = {
  clickDismiss: 'Klikněte pro zavření',
  
  title: 'tvůrce radio.txt',
  intro: 'Web pro vytvoření vlastního souboru radio.txt pro použití s ',
  hibyLink: 'digitálními audio přehrávači Hiby',
  siteUse: 'Jak používat tento web',
  step1: 'Filtrovat stanice podle názvu nebo žánru (např. somafm, hip hop, jazz), poté přidat všechny stanice, které chcete zahrnout do svého souboru radio.txt.',
  step2: 'Až budete s výběrem spokojeni, klikněte na "Download" a uložte textový soubor do kořenového adresáře úložiště vašeho přehrávače Hiby.',
  closeButtonText: 'zavřít',

  filterLabel: 'Filtrovat podle názvu nebo žánru',
  downloadButtonText: 'stáhnout',
  volume: 'Hlasitost',

  thanks: 'Pokud je pro vás tento web užitečný a chcete podpořit jeho provoz, můžete přispět. Vaše podpora pomáhá s hostováním a dalším vývojem. Děkujeme!',
  securityContact: 'Bezpečnostní kontakt',

  addStation: 'přidat stanici',
  addCase1: 'URL musí být server Icecast s typem obsahu "audio/mpeg" nebo "audio/mp3"',
  addCase2: 'API získá další informace z hlaviček streamu.',
  stationURL: 'URL stanice',
  addButtonText: 'přidat',

  stations: 'stanice',

  stationExists: 'Stanice již existuje',
  conTestFailed: error => `Test připojení selhal: ${error}`,
  noName: 'Nepodařilo se načíst název stanice',
  stationSaved: id => `Stanice uložena, ID: ${id}`,
  addFail: error => `Nepodařilo se přidat stanici: ${error}`,

  dupLogged: 'Duplikát zaznamenán',
  dupLogFail: error => `Chyba při zaznamenání chyby: ${error}`,

  cspError: error => `Chyba při ukládání CSP-Reportu: ${error}`,

  stationsFail: error => `Chyba při načítání stanic: ${error}`,

  errorLog: 'chyba zaznamenána',
  errorLogFail: error => `Nepodařilo se zaznamenat chybu: ${error}`,

  genresFail: error => `Chyba při získávání žánrů: ${error}`
};
