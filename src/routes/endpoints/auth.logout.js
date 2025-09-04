const { WorkOS } = require('@workos-inc/node');

const clientId = process.env.WORKOS_CLIENT_ID;

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId,
});

module.exports = async (req, res) => {
  try{
    const session = workos.userManagement.loadSealedSession({
      sessionData: req.cookies['wos-session'],
      cookiePassword: process.env.COOKIE_SECRET,
    });
  
    const url = await session.getLogoutUrl();
  
    res.clearCookie('wos-session');
    res.redirect(url);
  } catch(e) {
    log.error(`Error in auth logout: ${e.message}`);
    res.status(500).send({
      message: 'Internal Server Error',
    });
  }
};
