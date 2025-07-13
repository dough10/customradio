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
  pressToRefresh: 'Presiona para actualizar',

  dismiss: 'Haz clic para descartar',
  moving: (newURL, currentURL) => `
    <h2>¡Nos mudamos! Toma nota</h2>
    <p>A partir del próximo mes, nuestra web estará disponible permanentemente en esta nueva dirección:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Hasta fin de mes, todavía puedes acceder a <strong>${currentURL}</strong>. Desde el día 1, serás redirigido automáticamente.</p>
    <p>Recomendamos actualizar tus marcadores cuanto antes.</p>
    <p>¡Gracias por acompañarnos en esta nueva etapa!</p>
  `
};