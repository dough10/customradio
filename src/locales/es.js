module.exports = {
  clickDismiss: 'Haz clic para cerrar',

  title: 'Creador de radio.txt',
  intro: 'Un sitio web para crear un archivo radio.txt personalizado para usar con ',
  hibyLink: 'reproductores de audio digital Hiby',
  siteUse: 'Para usar el sitio',
  step1: 'Filtra estaciones por nombre o género (por ejemplo, somafm, hip hop, jazz), luego agrega todas las estaciones que quieras incluir en tu archivo radio.txt.',
  step2: 'Cuando estés satisfecho con tu lista, presiona "Descargar" y guarda el archivo de texto en el directorio raíz del almacenamiento de tu reproductor Hiby.',
  closeButtonText: 'cerrar',

  filterLabel: 'Filtrar por nombre o género',
  downloadButtonText: 'descargar',
  volume: 'Volumen',

  thanks: 'Si encuentras útil este sitio y deseas apoyar su mantenimiento, puedes hacer una contribución. Tu apoyo ayuda con el alojamiento y el desarrollo continuo. ¡Gracias!',
  securityContact: 'Contacto de seguridad',

  addStation: 'agregar estación',
  addCase1: 'La URL debe ser un servidor Icecast con un tipo de contenido "audio/mpeg" o "audio/mp3".',
  addCase2: 'La API obtendrá la otra información de las cabeceras del stream.',
  stationURL: 'URL de la estación',
  addButtonText: 'agregar',

  stations: 'estaciones',

  stationExists: 'La estación ya existe',
  conTestFailed: error => `Error en la prueba de conexión: ${error}`,
  noName: 'No se pudo obtener el nombre de la estación',
  stationSaved: id => `Estación guardada, ID: ${id}`,
  addFail: error => `Error al agregar la estación: ${error}`,

  dupLogged: 'Duplicado registrado',
  dupLogFail: error => `Error al registrar el error: ${error}`,

  cspError: error => `Error al guardar el informe CSP: ${error}`,

  stationsFail: error => `Error al obtener estaciones: ${error}`,

  errorLog: 'error registrado',
  errorLogFail: error => `Error al registrar el error: ${error}`,

  genresFail: error => `Error al obtener géneros: ${error}`
};
