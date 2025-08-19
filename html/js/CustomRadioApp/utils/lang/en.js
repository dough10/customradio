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
    <h2>We Updated - User list storage!</h2>
    <p>You can now login using the WorkOS user portal and any stations you save to your list will not be cleared when your browser randomly decides.</p>
    <p>No user identifying data is saved to this database. WorkOs used a sealed session cookie to hold user session info. all user profile info is saved to WorkOS servers.</p>
    <p>On this server. I only save the WorkOS id and station id used for lookup of a users station list.</p>
    <p>Thanks!</p>
  `
};