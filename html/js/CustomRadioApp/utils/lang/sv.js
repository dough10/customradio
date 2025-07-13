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
    <h2>Vi flyttar — viktigt att veta!</h2>
    <p>Från och med nästa månad kommer vår webbplats att finnas på en ny permanent adress:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Du kan fortsätta använda <strong>${currentURL}</strong> fram till månadens slut. Efter den 1:a omdirigeras du automatiskt.</p>
    <p>Uppdatera gärna dina bokmärken redan nu.</p>
    <p>Tack för att du följer med oss vidare!</p>
  `
};