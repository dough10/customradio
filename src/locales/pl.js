module.exports = {
  clickDismiss: 'Kliknij, aby zamknąć',

  title: 'Kreator radio.txt',
  intro: 'Strona internetowa do tworzenia własnego pliku radio.txt do użycia z ',
  hibyLink: 'cyfrowymi odtwarzaczami audio Hiby',
  siteUse: 'Aby skorzystać ze strony',
  step1: 'Filtruj stacje według nazwy lub gatunku (np. somafm, hip hop, jazz), a następnie dodaj wszystkie stacje, które chcesz uwzględnić w swoim pliku radio.txt.',
  step2: 'Gdy lista będzie gotowa, kliknij "Pobierz" i zapisz plik tekstowy w głównym katalogu pamięci swojego odtwarzacza Hiby.',
  closeButtonText: 'zamknij',

  filterLabel: 'Filtruj według nazwy lub gatunku',
  downloadButtonText: 'pobierz',
  volume: 'Głośność',

  thanks: 'Jeśli uważasz, że ta strona jest przydatna i chcesz wesprzeć jej utrzymanie, możesz dokonać wpłaty. Twoje wsparcie pomaga w hostingu i dalszym rozwoju. Dziękujemy!',
  securityContact: 'Kontakt w sprawach bezpieczeństwa',

  addStation: 'dodaj stację',
  addCase1: 'URL musi prowadzić do serwera Icecast z typem zawartości "audio/mpeg" lub "audio/mp3"',
  addCase2: 'API pobierze pozostałe informacje z nagłówków strumienia.',
  stationURL: 'URL stacji',
  addButtonText: 'dodaj',

  stations: 'stacje',

  stationExists: 'Stacja już istnieje',
  conTestFailed: error => `Test połączenia nie powiódł się: ${error}`,
  noName: 'Nie udało się pobrać nazwy stacji',
  stationSaved: id => `Stacja zapisana, ID: ${id}`,
  addFail: error => `Nie udało się dodać stacji: ${error}`,

  dupLogged: 'Duplikat został zapisany',
  dupLogFail: error => `Nie udało się zapisać błędu: ${error}`,

  cspError: error => `Błąd podczas zapisywania raportu CSP: ${error}`,

  stationsFail: error => `Błąd podczas pobierania stacji: ${error}`,

  errorLog: 'błąd zapisany',
  errorLogFail: error => `Nie udało się zapisać błędu: ${error}`,

  genresFail: error => `Błąd podczas pobierania gatunków: ${error}`
};
