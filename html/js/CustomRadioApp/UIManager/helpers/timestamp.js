/**
 * tag file with date and origin
 * 
 * @function
 * 
 * @returns {String}
 */
export default function timestamp() {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  return `# created by ${window.location.origin} [${formattedDate}]\n`;
}