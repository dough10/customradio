export const es = {
  stations: (count) => `${count} estaciones`,
  genreError: 'Entrada no válida. Por favor, introduzca un género válido.',
  stationsError: (error) => `Error al obtener estaciones: ${error}`,
  playing: (name) => `Jugando: ${name}`,
  homepage: 'página principal',
  homepageTitle: (homepage) => `navegar a ${homepage}`, 
  markDup: 'marcar duplicado',
  dupTitle: 'marcar estación duplicada',
  playingError: (error) => `Error al reproducir el medio: ${error}`,
  noHome: 'Sin encabezado de página de inicio',
  errorHome: (error) => `Error al abrir la página de inicio: ${error}`,
  offline: 'Desconectado: intentando reconectarse',
  online: 'Reconectado: intentando reiniciar el juego',
  playTitle: 'Reproducir transmisión',
  addTitle: 'Agregar al archivo', 
  removeTitle: 'Eliminar del archivo'
}