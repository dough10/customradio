export const es = {
  stations: count => `${count} estaciones`,
  genreError: 'Entrada no válida. Por favor, introduce un género válido.',
  stationsError: error => `Error al obtener estaciones: ${error}`,

  playing: name => `Reproduciendo: ${name}`,
  homepage: 'página principal',
  homepageTitle: homepage => `navegar a ${homepage}`, 
  markDup: 'marcar como duplicado',
  dupTitle: 'marcar estación como duplicada',
  playingError: error => `Error al reproducir el contenido: ${error}`,
  noHome: 'Sin página principal',
  errorHome: error => `Error al abrir la página principal: ${error}`,
  invalidStation: `Datos de la estación no válidos. No se puede reproducir el stream.`,
  offline: 'Desconectado: intentando reconectar',
  online: 'Reconectado: intentando reiniciar reproducción',

  playTitle: 'Reproducir stream',
  addTitle: 'Agregar al archivo', 
  removeTitle: 'Eliminar del archivo',

  appUpdated: 'Aplicación actualizada',
  pressToRefresh: 'Presiona para actualizar'
};
