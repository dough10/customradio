const { WorkOS } = require('@workos-inc/node');

const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);
const clientId = process.env.WORKOS_CLIENT_ID;

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId,
});

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

async function compress(str) {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(str));
  writer.close();

  const compressed = await new Response(cs.readable).arrayBuffer();
  return Buffer.from(compressed).toString("base64url");
}

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
    user.lookup = await compress(user.id.replace('user_', ''));
    console.log(user);
    req.user = user;
    res.cookie('wos-session', sealedSession, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: THIRTY_DAYS
    });
    res.redirect(`/`);
  } catch(e) {
    log.error(`Error in auth callback: ${e.message}`);
    res.status(500).send({
      message: 'Internal Server Error',
    });
  }
}