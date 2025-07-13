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
    <h2>Presúvame sa — dôležité oznámenie!</h2>
    <p>Od budúceho mesiaca nás nájdete na novej trvalej adrese:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Až do konca tohto mesiaca bude <strong>${currentURL}</strong> stále prístupná. Od 1. dňa nasledujúceho mesiaca vás automaticky presmerujeme.</p>
    <p>Nezabudnite si aktualizovať záložky.</p>
    <p>Ďakujeme, že ste s nami!</p>
  `
};
