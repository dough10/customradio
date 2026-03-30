const { WorkOS } = require('@workos-inc/node');
const { logger } = require('./../services.js');

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const COOKIE_NAME = 'wos-session';
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

module.exports = async (req, res, next) => {
  const sealed = req.cookies[COOKIE_NAME];

  if (!sealed) {
    return next();
  }

  try {
    const session = await workos.userManagement.loadSealedSession({
      sessionData: sealed,
      cookiePassword: process.env.COOKIE_SECRET,
    });

    const { authenticated, user } = await session.authenticate();

    if (!authenticated || !user) {
      res.clearCookie(COOKIE_NAME);
      return next();
    }

    // try {
    //   const freshUser = await workos.userManagement.getUser({
    //     userId: sessionUser.id,
    //   });

    //   user = freshUser;
    // } catch (apiErr) {
    //   logger.warn('Failed to fetch fresh WorkOS user:', apiErr.message);
    // }

    req.user = user;

    const { sealedSession } = await session.refresh();

    if (sealedSession) {
      res.cookie(COOKIE_NAME, sealedSession, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: THIRTY_DAYS,
      });
    }

  } catch (err) {
    logger.warn('WorkOS session validation failed:', err.message);
    res.clearCookie(COOKIE_NAME);
  }

  return next();
};