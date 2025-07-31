const { WorkOS } = require('@workos-inc/node');
const pug = require('pug');

const { t } = require('../../util/i18n.js');
const Logger = require('../../util/logger.js');

const logLevel = process.env.LOG_LEVEL || 'info';
const log = new Logger(logLevel);

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

module.exports = async (req, res) => {

  try {
    let user = null;

    const sealed = req.cookies['wos-session'];
    if (sealed) {
      const session = await workos.userManagement.loadSealedSession({
        sessionData: sealed,
        cookiePassword: process.env.COOKIE_SECRET,
      });

      const { authenticated, user: u } = await session.authenticate();
      if (authenticated) {
        user = u;

        const { sealedSession } = await session.refresh();
        if (sealedSession) {
          res.cookie('wos-session', sealedSession, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
          });
        }
      }
    }
  
    res.send(pug.renderFile('./templates/index.pug', {
      user: user ? {
        id: user.id,
        email: user.email,
        picture: user.profilePictureUrl,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      lang: req.loadedLang,
      csrf: req.session.csrfToken,
      nonce: res.locals.nonce,
      title: t('title'),
      intro: t('intro'),
      hibyLink: t('hibyLink'),
      siteUse: t('siteUse'),
      step1: t('step1'),
      step2: t('step2'),
      filterLabel: t('filterLabel'),
      closeButtonText: t('closeButtonText'),
      downloadButtonText: t('downloadButtonText'),
      volume: t('volume'),
      thanks: t('thanks'),
      securityContact: t('securityContact'),
      clickDismiss: t('clickDismiss'),
      addStation: t('addStation'),
      addCase1: t('addCase1'),
      addCase2: t('addCase2'),
      stationURL: t('stationURL'),
      addButtonText: t('addButtonText'),
      stations: t('stations')
    }));
  } catch(e) {
    log.error(`index render: ${e.message}`);
    res.status(500).send({
      message: 'Internal Server Error',
    });
  }
};