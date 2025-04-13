export const en = {
  stations: (count) => `${count} stations`,
  genreError: 'Invalid input. Please enter valid genre.',
  stationsError: (error) => `Error fetching stations: ${error}`,
  playing: (name) => `Playing ${name}`,
  homepage: 'homepage',
  homepageTitle: (homepage) => `navigate to ${homepage}`, 
  markDup: 'mark duplicate',
  dupTitle: 'mark station duplicate',
  playingError: (error) => `Error playing media ${error}`,
  noHome: 'No homepage header',
  errorHome: (error) => `Error opening homepage: ${error}`,
  offline: 'Disconnected: attempting reconnect',
  online: 'Reconnected: attempting to restart play'
}