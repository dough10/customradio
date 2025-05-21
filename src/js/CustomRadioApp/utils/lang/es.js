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
    <h2>¡Atención! ¡Nuestro sitio web tendrá un nuevo hogar!</h2>
    <p>Estamos haciendo la transición a una nueva dirección web:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Durante un tiempo limitado, tanto ${currentURL} como nuestra nueva URL estarán completamente accesibles. Te animamos a empezar a usar la nueva dirección y a actualizar cualquier enlace guardado.</p>
    <p>¡Gracias por tu paciencia durante esta transición!</p>
  `
};