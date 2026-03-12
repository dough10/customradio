const { WorkOS } = require('@workos-inc/node');
const asyncHandler = require('../../util/asyncHandler.js');

const clientId = process.env.WORKOS_CLIENT_ID;

const COOKIE_NAME = 'wos-session';

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId,
});

module.exports = asyncHandler(async (req, res) => {
  if (req.user) req.user = null;

  const sessionCookie = req.cookies[COOKIE_NAME];

  if (!sessionCookie) {
    return res.redirect('/');
  }

  const session = workos.userManagement.loadSealedSession({
    sessionData: sessionCookie,
    cookiePassword: process.env.COOKIE_SECRET,
  });

  const url = await session.getLogoutUrl();

  res.clearCookie('wos-session');
  res.redirect(url);
});
