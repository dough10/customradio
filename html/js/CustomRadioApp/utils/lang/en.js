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
    <h2>We're Relocating — Please Take Note!</h2>
    <p>Starting next month, our website will officially live at a new permanent address:</p>
    <p style="font-weight: bold; font-size: 1.1em;"><a href="${newURL}" target="_blank" rel="noopener noreferrer">${newURL}</a></p>
    <p>Until the end of this month, you can still access the site at <strong>${currentURL}</strong>, but after the 1st, all visits will redirect to the new URL automatically.</p>
    <p>To avoid disruption, we recommend updating your bookmarks and saved links now.</p>
    <p>We’re excited about the move and appreciate you coming along with us!</p>
  `
};