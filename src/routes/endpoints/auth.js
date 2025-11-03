const { WorkOS } = require('@workos-inc/node');

const workos = new WorkOS(process.env.WORKOS_API_KEY);

module.exports = (req, res) => {
  res.redirect(workos.sso.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri: process.env.WORKOS_REDIRECT_URL,
    clientId: process.env.WORKOS_CLIENT_ID
  }));
};