export const ru = {
  stations: count => `${count} станций`,
  genreError: 'Неверный ввод. Пожалуйста, введите корректный жанр.',
  stationsError: error => `Ошибка при загрузке станций: ${error}`,

  playing: name => `Воспроизведение: ${name}`,
  homepage: 'домашняя страница',
  homepageTitle: homepage => `перейти на ${homepage}`, 
  markDup: 'отметить как дубликат',
  dupTitle: 'отметить станцию как дубликат',
  playingError: error => `Ошибка воспроизведения: ${error}`,
  noHome: 'Нет домашней страницы',
  errorHome: error => `Ошибка открытия домашней страницы: ${error}`,
  invalidStation: `Недействительные данные станции. Невозможно воспроизвести поток.`,
  offline: 'Отключено: попытка переподключения',
  online: 'Переподключено: попытка перезапуска воспроизведения',

  playTitle: 'Воспроизвести поток',
  addTitle: 'Добавить в файл', 
  removeTitle: 'Удалить из файла',

  appUpdated: 'Приложение обновлено',
  pressToRefresh: 'Нажмите для обновления',

  dismiss: 'Нажмите, чтобы закрыть',
  moving: (newURL, currentURL) => `
    <h2>Важное обновление: мы переезжаем!</h2>
    <p>Со следующего месяца наш сайт будет доступен только по новому адресу:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>До конца текущего месяца вы можете пользоваться <strong>${currentURL}</strong>. С 1 числа будет происходить автоматическое перенаправление.</p>
    <p>Пожалуйста, обновите закладки заранее.</p>
    <p>Спасибо, что остаетесь с нами!</p>
  `
};