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
  moving: (newURL, currentURL) => `
    <h2>Heads Up! Our Website is Getting a New Home!</h2>
    <p>We're transitioning to a new web address:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>For a limited time, both ${currentURL} and our new URL will be fully accessible. We encourage you to start using the new address and update any saved links.</p>
    <p>Thanks for your patience during this transition!</p>
  `
};