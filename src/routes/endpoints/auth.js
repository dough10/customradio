const { WorkOS } = require('@workos-inc/node');

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;
const redirectUri = 'https://testradio.dough10.me/auth/callback';


module.exports = (req, res) => {
  res.redirect(workos.sso.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri,
    clientId,
  }));
};