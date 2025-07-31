const { WorkOS } = require('@workos-inc/node');

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);
const clientId = process.env.WORKOS_CLIENT_ID;

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId,
});

module.exports = async (req, res) => {
  try {
    const { code } = req.query;
    const { user, sealedSession } = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID,
      code,
      session: {
        sealSession: true,
        cookiePassword: process.env.COOKIE_SECRET,
      },
    });
    
    // log.info(`User authenticated: ${user.id} - ${user.email}`);
    res.cookie('wos-session', sealedSession, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    // console.log(user);
    res.redirect(`/`);
  } catch(e) {
    log.error(`Error in auth callback: ${e.message}`);
    res.status(500).send({
      message: 'Internal Server Error',
    });
  }
}