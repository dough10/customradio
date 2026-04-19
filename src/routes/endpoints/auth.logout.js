const {workos} = require('../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const COOKIE_NAME = 'wos-session';


module.exports = asyncHandler(async (req, res) => {
  const sessionCookie = req.cookies[COOKIE_NAME];

  if (req.session) {
    await new Promise((resolve) => req.session.destroy(resolve));
  }

  res.clearCookie(COOKIE_NAME);
  res.clearCookie('connect.sid');

  if (!sessionCookie) {
    return res.redirect('/');
  }

  const session = await workos.userManagement.loadSealedSession({
    sessionData: sessionCookie,
    cookiePassword: process.env.COOKIE_SECRET,
  });

  const url = await session.getLogoutUrl();

  return res.redirect(url);
});
