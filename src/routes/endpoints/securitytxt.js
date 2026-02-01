module.exports = (req, res) => {
  const email = process.env.SECURITY_CONTACT || 'admin@dough10.me';
  const nextYear = new Date().getUTCFullYear() + 1;
  const expiresDate = new Date(Date.UTC(nextYear, 0, 1)).toISOString();
  
  const securityTxt = [
    `Contact: mailto:${email}`,
    `Expires: ${expiresDate}`,
  ].join('\n');
  
  res.type('text/plain');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(securityTxt);
};