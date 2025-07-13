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
    <h2>Zmiana adresu strony — ważna informacja!</h2>
    <p>Od przyszłego miesiąca nasza strona będzie dostępna wyłącznie pod nowym, stałym adresem:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Do końca tego miesiąca <strong>${currentURL}</strong> nadal działa, ale od 1 dnia miesiąca nastąpi przekierowanie.</p>
    <p>Zalecamy zaktualizowanie zakładek już teraz.</p>
    <p>Dziękujemy, że jesteś z nami!</p>
  `
};
