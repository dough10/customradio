export const cs = {
  stations: (count) => `${count} stanic`,
  genreError: 'Neplatný vstup. Zadejte prosím platný žánr.',
  stationsError: error => `Chyba při načítání stanic: ${error}`,

  playing: name => `Přehrává se: ${name}`,
  homepage: 'domovská stránka',
  homepageTitle: homepage => `přejít na ${homepage}`, 
  markDup: 'označit jako duplicitní',
  dupTitle: 'označit stanici jako duplicitní',
  playingError: error => `Chyba při přehrávání média: ${error}`,
  noHome: 'Bez domovské stránky',
  errorHome: error => `Chyba při otevírání domovské stránky: ${error}`,
  invalidStation: `Neplatná data stanice. Nelze přehrát stream.`,
  offline: 'Odpojeno: pokus o znovupřipojení',
  online: 'Znovu připojeno: pokus o opětovné spuštění',

  playTitle: 'Přehrát stream',
  addTitle: 'Přidat do souboru', 
  removeTitle: 'Odebrat ze souboru',

  appUpdated: 'Aplikace byla aktualizována',
  pressToRefresh: 'Klikněte pro obnovení',

  dismiss: 'Klikněte pro zavření',
  moving: (newURL, currentURL) => `
    <h2>Stěhujeme se — Věnujte pozornost!</h2>
    <p>Od příštího měsíce bude náš web oficiálně dostupný na nové trvalé adrese:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Do konce tohoto měsíce budete mít stále přístup na <strong>${currentURL}</strong>, ale po 1. dni budou všechny návštěvy automaticky přesměrovány na novou adresu.</p>
    <p>Abyste se vyhnuli problémům, doporučujeme si novou adresu uložit do záložek již nyní.</p>
    <p>Jsme nadšení z tohoto přesunu a děkujeme, že jste s námi!</p>
  `
};
