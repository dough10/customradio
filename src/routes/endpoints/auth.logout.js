const { WorkOS } = require('@workos-inc/node');

const clientId = process.env.WORKOS_CLIENT_ID;

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId,
});

module.exports = async (req, res) => {
  const session = workos.userManagement.loadSealedSession({
    sessionData: req.cookies['wos-session'],
    cookiePassword: process.env.COOKIE_SECRET,
  });

  const url = await session.getLogoutUrl();

  res.clearCookie('wos-session');
  res.redirect(url);
};
