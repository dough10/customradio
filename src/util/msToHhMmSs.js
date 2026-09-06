const unit = (value, singular, plural) =>
  `${value} ${value === 1 ? singular : plural}`;

/**
 * Convert milliseconds into a formatted string
 *
 * @param {Number} milliseconds - time in milliseconds
 *
 * @returns {String} - formatted time
 */
module.exports = (milliseconds) => {
  if (milliseconds < 1000) return '< 1 second';

  const totalSeconds = Math.floor(milliseconds / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const remainderAfterDays = totalSeconds % 86400;

  const hours = Math.floor(remainderAfterDays / 3600);
  const remainder = remainderAfterDays % 3600;

  const minutes = Math.floor(remainder / 60);
  const secs = remainder % 60;

  const parts = [];

  if (days) parts.push(unit(days, 'day', 'days'));
  if (hours) parts.push(unit(hours, 'hour', 'hours'));
  if (minutes) parts.push(unit(minutes, 'minute', 'minutes'));

  if (hours > 1) {
    return parts.join(' ');
  }

  if (secs) {
    if (parts.length) parts.push('and');
    parts.push(unit(secs, 'second', 'seconds'));
  }

  return parts.join(' ') || '0 seconds';
};