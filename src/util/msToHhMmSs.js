const unit = (value, singular, plural) =>
  `${value} ${value === 1 ? singular : plural}`;

/**
 * Convert milliseconds into a formatted string "HH hours MM minutes and SS seconds"
 * 
 * @param {Number} milliseconds - time in milliseconds
 * 
 * @returns {String} - formatted time as "HH hours MM minutes and SS seconds"
 */
module.exports = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const remainder = totalSeconds % 3600;
  const minutes = Math.floor(remainder / 60);
  const secs = remainder % 60;
  const parts = [];
  if (hours) parts.push(unit(hours, 'hour', 'hours'));
  if (minutes) parts.push(unit(minutes, 'minute', 'minutes'));
  if (secs) {
    if (parts.length) parts.push('and');
    parts.push(unit(secs, 'second', 'seconds'));
  }
  return parts.join(' ') || '0 seconds';
}