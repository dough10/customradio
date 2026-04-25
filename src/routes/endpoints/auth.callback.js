const {workos, userData, logger} = require('./../../services.js');
const asyncHandler = require('../../util/asyncHandler.js');

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

module.exports = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing code');
  }
  const { user, sealedSession } = await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID,
    code,
    session: {
      sealSession: true,
      cookiePassword: process.env.COOKIE_SECRET,
    },
  });
  if (!user.emailVerified) {
    return res.status(401).send('User must verify email');
  }
  try {
    // await userData.createUser(user);
    req.session.user = user;
  } catch (err) {
    logger.error(`Failed to persist ${user.id}: ${err}`);
    throw err;
  }
  res.cookie('wos-session', sealedSession, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS
  });
  res.redirect(`/`);
});