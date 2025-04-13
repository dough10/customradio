export const es = {
  stations: count => `${count} estaciones`,
  genreError: 'Entrada no válida. Por favor, introduzca un género válido.',
  stationsError: (error) => `Error al buscar estaciones: ${error}`,
  playing: name => `interpretando a: ${name}`,
  homepage: 'página de inicio',
  homepageTitle: homepage => `navegar a ${homepage}`, 
  markDup: 'marcar duplicado',
  dupTitle: 'marcar duplicado de estación',
  playingError: error => `Error al reproducir medios: ${error}`,
  noHome: 'No hay página de inicio',
  errorHome: error => `Error al abrir la página de inicio: ${error}`,
  offline: 'Desconectado: intentando reconectarse',
  online: 'Reconectado: intentando reiniciar el juego',
  playTitle: 'Reproducir transmisión',
  addTitle: 'Agregar al archivo', 
  removeTitle: 'Eliminar del archivo'
};