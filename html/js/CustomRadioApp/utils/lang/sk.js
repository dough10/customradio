export const sk = {
  stations: (count) => `${count} staníc`,
  genreError: 'Neplatný vstup. Zadajte platný žáner.',
  stationsError: error => `Chyba pri načítaní staníc: ${error}`,

  playing: name => `Prehráva sa: ${name}`,
  homepage: 'domovská stránka',
  homepageTitle: homepage => `prejsť na ${homepage}`,
  markDup: 'označiť ako duplikát',
  dupTitle: 'označiť stanicu ako duplikát',
  playingError: error => `Chyba pri prehrávaní média: ${error}`,
  noHome: 'Bez domovskej stránky',
  errorHome: error => `Chyba pri otváraní domovskej stránky: ${error}`,
  invalidStation: `Neplatné údaje o stanici. Nemožno prehrať stream.`,
  offline: 'Odpojené: prebieha pokus o opätovné pripojenie',
  online: 'Znovu pripojené: prebieha pokus o opätovné spustenie prehrávania',

  playTitle: 'Prehrať stream',
  addTitle: 'Pridať do súboru',
  removeTitle: 'Odstrániť zo súboru',

  appUpdated: 'Aplikácia bola aktualizovaná',
  pressToRefresh: 'Stlačte na obnovenie',

  dismiss: 'Kliknite na zatvorenie',
  moving: (newURL, currentURL) => `
    <h2>Pozor! Naša webstránka sa sťahuje!</h2>
    <p>Presúvame sa na novú webovú adresu:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Po obmedzený čas budú dostupné obe adresy: ${currentURL} aj nová. Odporúčame prejsť na novú adresu a aktualizovať si uložené odkazy.</p>
    <p>Ďakujeme za trpezlivosť počas tohto prechodu!</p>
  `
};
