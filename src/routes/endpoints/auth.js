const {workos} = require('../../services.js');

module.exports = (req, res) => {
  res.redirect(workos.sso.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri: process.env.WORKOS_REDIRECT_URL,
    clientId: process.env.WORKOS_CLIENT_ID
  }));
};