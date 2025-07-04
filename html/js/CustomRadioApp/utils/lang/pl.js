export const pl = {
  stations: (count) => `${count} stacji`,
  genreError: 'Nieprawidłowe dane wejściowe. Wprowadź poprawny gatunek.',
  stationsError: error => `Błąd podczas pobierania stacji: ${error}`,

  playing: name => `Odtwarzanie: ${name}`,
  homepage: 'strona główna',
  homepageTitle: homepage => `przejdź do ${homepage}`,
  markDup: 'oznacz jako duplikat',
  dupTitle: 'oznacz stację jako duplikat',
  playingError: error => `Błąd odtwarzania: ${error}`,
  noHome: 'Brak strony głównej',
  errorHome: error => `Błąd podczas otwierania strony głównej: ${error}`,
  invalidStation: `Nieprawidłowe dane stacji. Nie można odtworzyć strumienia.`,
  offline: 'Rozłączono: próba ponownego połączenia',
  online: 'Połączono ponownie: próba wznowienia odtwarzania',

  playTitle: 'Odtwórz strumień',
  addTitle: 'Dodaj do pliku',
  removeTitle: 'Usuń z pliku',

  appUpdated: 'Aplikacja zaktualizowana',
  pressToRefresh: 'Kliknij, aby odświeżyć',

  dismiss: 'Kliknij, aby zamknąć',
  moving: (newURL, currentURL) => `
    <h2>Uwaga! Nasza strona zmienia adres!</h2>
    <p>Przenosimy się na nowy adres internetowy:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Przez ograniczony czas zarówno ${currentURL}, jak i nowy adres będą dostępne. Zachęcamy do korzystania z nowego adresu i aktualizacji zapisanych zakładek.</p>
    <p>Dziękujemy za cierpliwość podczas tej zmiany!</p>
  `
};
