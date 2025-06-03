export const sv = {
  stations: count => `${count} stationer`,
  genreError: 'Ogiltig inmatning. Ange en giltig genre.',
  stationsError: error => `Fel vid hämtning av stationer: ${error}`,

  playing: name => `Spelar: ${name}`,
  homepage: 'hemsida',
  homepageTitle: homepage => `navigera till ${homepage}`,
  markDup: 'markera dubblett',
  dupTitle: 'markera station som dubblett',
  playingError: error => `Fel vid uppspelning av media: ${error}`,
  noHome: 'Ingen hemsida',
  errorHome: error => `Fel vid öppning av hemsida: ${error}`,
  invalidStation: `Ogiltig stationsdata. Kan inte spela upp strömmen.`,
  offline: 'Nedkopplad: försöker återansluta',
  online: 'Återansluten: försöker starta uppspelningen igen',

  playTitle: 'Spela ström',
  addTitle: 'Lägg till i fil',
  removeTitle: 'Ta bort från fil',

  appUpdated: 'Appen uppdaterad',
  pressToRefresh: 'Tryck för att uppdatera',

  dismiss: 'Klicka för att stänga',
  moving: (newURL, currentURL) => `
    <h2>Observera! Vår webbplats får ett nytt hem!</h2>
    <p>Vi övergår till en ny webbadress:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Under en begränsad tid kommer både ${currentURL} och vår nya URL att vara fullt tillgängliga. Vi uppmuntrar dig att börja använda den nya adressen och uppdatera alla sparade länkar.</p>
    <p>Tack för ditt tålamod under denna övergång!</p>
  `
};