module.exports = {
  clickDismiss: 'Нажмите, чтобы закрыть',

  title: 'Генератор radio.txt',
  intro: 'Веб-сайт для создания собственного файла radio.txt для использования с ',
  hibyLink: 'цифровыми аудиоплеерами Hiby',
  siteUse: 'Как пользоваться сайтом',
  step1: 'Отфильтруйте станции по названию или жанру (например: somafm, hip hop, jazz), затем добавьте все станции, которые хотите включить в ваш файл radio.txt.',
  step2: 'Когда список готов, нажмите "Скачать" и сохраните текстовый файл в корневой каталог накопителя вашего плеера Hiby.',
  closeButtonText: 'закрыть',

  filterLabel: 'Фильтр по названию или жанру',
  downloadButtonText: 'скачать',
  volume: 'Громкость',

  thanks: 'Спасибо за использование сайта. Пожалуйста, сообщайте о проблемах безопасности по контактной информации ниже.',
  securityContact: 'Контакт для вопросов безопасности',

  addStation: 'добавить станцию',
  addCase1: 'URL должен вести на сервер Icecast с типом содержимого "audio/mpeg" или "audio/mp3".',
  addCase2: 'API получит остальную информацию из заголовков потока.',
  stationURL: 'URL станции',
  addButtonText: 'добавить',

  stations: 'станции',

  stationExists: 'Станция уже добавлена',
  conTestFailed: error => `Сбой подключения: ${error}`,
  noName: 'Не удалось получить название станции',
  stationSaved: id => `Станция сохранена, ID: ${id}`,
  addFail: error => `Ошибка при добавлении станции: ${error}`,

  dupLogged: 'Дубликат зарегистрирован',
  dupLogFail: error => `Ошибка при регистрации дубликата: ${error}`,

  cspError: error => `Ошибка при сохранении отчёта CSP: ${error}`,

  stationsFail: error => `Ошибка при получении станций: ${error}`,

  errorLog: 'ошибка зарегистрирована',
  errorLogFail: error => `Ошибка при регистрации: ${error}`,

  genresFail: error => `Ошибка при получении жанров: ${error}`
};
