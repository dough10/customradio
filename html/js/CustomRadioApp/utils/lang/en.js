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
  pressToRefresh: 'Press to refresh',
  dismiss: 'Click to dismiss',
  news: `
    <h2>We've Updated – User List Storage!</h2>
    <p>You can now log in using the WorkOS user portal, and any stations you save to your list will no longer be randomly cleared by your browser.</p>
    <p>No user-identifying data is saved to this database. All user profile data is saved on WorkOS servers.</p>
    <p>This server only stores your WorkOS ID and station IDs, which are used to build your station list.</p>
    <p>Thanks!</p>
  `
};