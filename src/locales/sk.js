module.exports = {
  clickDismiss: 'Kliknite na zatvorenie',

  title: 'Tvorca súboru radio.txt',
  intro: 'Webstránka na vytvorenie vlastného radio.txt pre použitie s ',
  hibyLink: 'digitálnymi audio prehrávačmi Hiby',
  siteUse: 'Na použitie stránky',
  step1: 'Filtrovať stanice podľa názvu alebo žánru (napr. somafm, hip hop, jazz), potom pridať všetky stanice, ktoré chcete zahrnúť do súboru radio.txt.',
  step2: 'Keď budete spokojní so zoznamom, stlačte "Stiahnuť" a uložte textový súbor do hlavného adresára úložiska vo vašom Hiby prehrávači.',
  closeButtonText: 'zatvoriť',

  filterLabel: 'Filtrovať podľa názvu alebo žánru',
  downloadButtonText: 'stiahnuť',
  volume: 'Hlasitosť',

  thanks: 'Ak je pre vás táto stránka užitočná a chcete podporiť jej prevádzku, môžete prispieť. Vaša podpora pomáha s hostingom a ďalším vývojom. Ďakujeme!',
  securityContact: 'Bezpečnostný kontakt',

  addStation: 'pridať stanicu',
  addCase1: 'URL musí byť server Icecast s typom obsahu "audio/mpeg" alebo "audio/mp3"',
  addCase2: 'API získa ostatné informácie z hlavičiek streamu.',
  stationURL: 'URL stanice',
  addButtonText: 'pridať',

  stations: 'stanice',

  stationExists: 'Stanica už existuje',
  conTestFailed: error => `Test pripojenia zlyhal: ${error}`,
  noName: 'Nepodarilo sa získať názov stanice',
  stationSaved: id => `Stanica uložená, ID: ${id}`,
  addFail: error => `Nepodarilo sa pridať stanicu: ${error}`,

  dupLogged: 'Duplikát zaznamenaný',
  dupLogFail: error => `Nepodarilo sa zaznamenať chybu: ${error}`,

  cspError: error => `Chyba pri ukladaní CSP hlásenia: ${error}`,

  stationsFail: error => `Chyba pri načítaní staníc: ${error}`,

  errorLog: 'chyba zaznamenaná',
  errorLogFail: error => `Nepodarilo sa zaznamenať chybu: ${error}`,

  genresFail: error => `Chyba pri načítaní žánrov: ${error}`
};
