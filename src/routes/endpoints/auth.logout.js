const {workos} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const COOKIE_NAME = 'wos-session';


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
