const { WorkOS } = require('@workos-inc/node');

const Logger = require('./logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

module.exports = async (req, res, next) => {
  try {
    const sealed = req.cookies['wos-session'];
    if (sealed) {
      const session = await workos.userManagement.loadSealedSession({
        sessionData: sealed,
        cookiePassword: process.env.COOKIE_SECRET,
      });
      
      const { authenticated, user } = await session.authenticate();
      if (authenticated) {
        req.user = user;
        const { sealedSession } = await session.refresh();
        if (sealedSession) {
          res.cookie('wos-session', sealedSession, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: THIRTY_DAYS,
          });
        }
      }
    }
    next();
  } catch (error) {
    log.error(`WorkOS session error: ${error.message}`);
    res.status(500).send('Internal Server Error');
    return;
  }
};