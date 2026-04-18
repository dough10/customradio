const { logger, workos } = require('../../services.js');

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