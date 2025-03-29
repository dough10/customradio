/**
 * tag file with date and origin
 * 
 * @function
 * 
 * @returns {String}
 */
function stamp() {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  return `# created by ${window.location.origin} [${formattedDate}]\n`;
}

export { stamp };