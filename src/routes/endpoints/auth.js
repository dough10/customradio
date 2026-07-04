const {workos} = require('../../services.js');

module.exports = (req, res) => {
  const ref = req.query.ref || '/';
  if (!ref.startsWith("/")) {
    return res.status(400).send("Invalid redirect");
  }
  res.redirect(workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri: process.env.WORKOS_REDIRECT_URL,
    clientId: process.env.WORKOS_CLIENT_ID,
    screenHint: 'sign-in',
    state: JSON.stringify({
      ref
    })
  }));
};