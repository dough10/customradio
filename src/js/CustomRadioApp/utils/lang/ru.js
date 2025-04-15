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
  pressToRefresh: 'Нажмите для обновления'
};
