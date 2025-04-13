export const ru = {
  stations: count => `${count} станций`,
  genreError: 'Недопустимый ввод. Пожалуйста, введите допустимый жанр.',
  stationsError: error => `Ошибка при получении станций: ${error}`,
  playing: name => `Воспроизведение: ${name}`,
  homepage: 'домашняя страница',
  homepageTitle: homepage => `перейти на ${homepage}`, 
  markDup: 'отметить как дубликат',
  dupTitle: 'отметить станцию как дубликат',
  playingError: error => `Ошибка воспроизведения: ${error}`,
  noHome: 'Нет домашней страницы',
  errorHome: error => `Ошибка при открытии домашней страницы: ${error}`,
  offline: 'Отключено: попытка переподключения',
  online: 'Подключено: попытка возобновить воспроизведение',
  playTitle: 'Воспроизвести поток',
  addTitle: 'Добавить в файл', 
  removeTitle: 'Удалить из файла'
};
