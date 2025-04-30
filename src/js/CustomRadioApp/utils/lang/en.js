export const en = {
  stations: (count) => `${count} stations`,
  genreError: 'Invalid input. Please enter valid genre.',
  stationsError: error => `Error fetching stations: ${error}`,

  playing: name => `Playing: ${name}`,
  homepage: 'homepage',
  homepageTitle: homepage => `navigate to ${homepage}`, 
  markDup: 'mark duplicate',
  dupTitle: 'mark station duplicate',
  playingError: error => `Error playing media: ${error}`,
  noHome: 'No homepage',
  errorHome: error => `Error opening homepage: ${error}`,
  invalidStation: `Invalid station data. Unable to play stream.`,
  offline: 'Disconnected: attempting reconnect',
  online: 'Reconnected: attempting to restart play',

  playTitle: 'Play stream',
  addTitle: 'Add to file', 
  removeTitle: 'Remove from file',

  appUpdated: 'App updated',
  pressToRefresh: 'Press to refresh'
};