module.exports = {
  clickDismiss: 'Click to dismiss',
  
  title: 'radio.txt creator',
  intro: 'A website for creating a custom radio.txt for use with ',
  hibyLink: 'Hiby digital audio players',
  siteUse: 'To use the site',
  step1: 'Filter stations by name or genre (e.g., somafm, hip hop, jazz), then add all the stations you would like to include in your radio.txt file.',
  step2: 'When you are happy with your list, press "Download" and save the text file to the root directory of the storage on your Hiby player.',
  closeButtonText: 'close',

  filterLabel: 'Filter by name or genre',
  downloadButtonText: 'download',
  volume: 'Volume',

  thanks: 'If you find this site useful and want to support its upkeep, you can make a contribution. Your support helps with hosting and continued development. Thanks!',
  securityContact: 'Security contact',

  addStation: 'add station',
  addCase1: 'URL should be an Icecast server with a content type of "audio/mpeg" or "audio/mp3"',
  addCase2: 'The API will get the other information from the stream headers.',
  stationURL: 'Station URL',
  addButtonText: 'add',

  stations: 'stations',

  stationExists: 'Station already exists',
  conTestFailed: error => `Connection test failed: ${error}`,
  noName: 'Failed to retrieve station name',
  stationSaved: id => `Station saved, ID: ${id}`,
  addFail: error => `Failed to add station: ${error}`,

  dupLogged: 'Duplicate logged',
  dupLogFail: error => `Failed to log error: ${error}`,

  cspError: error => `Error Saving CSP-Report: ${error}`,

  stationsFail: error => `Error fetching stations: ${error}`,

  errorLog: 'error logged',
  errorLogFail: error => `Failed to log error: ${error}`,

  genresFail: error => `Error getting genres: ${error}`
};