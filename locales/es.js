module.exports = {
  clickDismiss: 'Haz clic para cerrar',

  title: 'Creador de radio.txt',
  intro: 'Un sitio web para crear un archivo radio.txt personalizado para usar con ',
  hibyLink: 'Reproductores de audio digital Hiby',
  siteUse: 'Para usar el sitio',
  step1: 'Filtra emisoras por nombre o género (por ejemplo: somafm, hip hop, jazz), luego añade todas las emisoras que quieras incluir en tu archivo radio.txt.',
  step2: 'Cuando estés satisfecho con tu lista, presiona "Descargar" y guarda el archivo de texto en el directorio raíz del almacenamiento de tu reproductor Hiby.',
  closeButtonText: 'cerrar',

  filterLabel: 'Filtrar por nombre o género',
  downloadButtonText: 'descargar',
  volume: 'Volumen',

  thanks: 'Gracias por usar el sitio. Por favor, reporta cualquier problema de seguridad usando la información de contacto a continuación.',
  securityContact: 'Contacto de seguridad',

  addStation: 'añadir emisora',
  addCase1: 'La URL debe ser un servidor Icecast con un tipo de contenido "audio/mpeg" o "audio/mp3".',
  addCase2: 'La API obtendrá la otra información desde las cabeceras del stream.',
  stationURL: 'URL de la emisora',
  addButtonText: 'añadir',

  stations: 'emisoras',

  stationExists: 'La emisora ya existe',
  conTestFailed: error => `Prueba de conexión fallida: ${error}`,
  noName: 'No se pudo obtener el nombre de la emisora',
  stationSaved: id => `Emisora guardada, ID: ${id}`,
  addFail: error => `No se pudo añadir la emisora: ${error}`,

  dupLogged: 'Duplicado registrado',
  dupLogFail: error => `Error al registrar el duplicado: ${error}`,

  cspError: error => `Error al guardar el informe CSP: ${error}`,

  stationsFail: error => `Error al obtener las emisoras: ${error}`,

  errorLog: 'error registrado',
  errorLogFail: error => `Error al registrar el error: ${error}`,

  genresFail: error => `Error al obtener los géneros: ${error}`
};
