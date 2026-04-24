module.exports = (req) => {
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const host = (req.hostname || '').replace(/[\r\n]/g, '');
  return `# created by ${req.protocol}://${host} [${formattedDate}]\n`;
}