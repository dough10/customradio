const { WorkOS } = require('@workos-inc/node');
const asyncHandler = require('../../util/asyncHandler.js');

const clientId = process.env.WORKOS_CLIENT_ID;

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId,
});

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

module.exports = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const { user, sealedSession } = await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID,
    code,
    session: {
      sealSession: true,
      cookiePassword: process.env.COOKIE_SECRET,
    },
  });
  req.user = user;
  res.cookie('wos-session', sealedSession, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS
  });
  res.redirect(`/`);
});