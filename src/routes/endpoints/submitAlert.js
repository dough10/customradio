const pug = require('pug');

const asyncHandler = require('./../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');
const {alerts} = require('./../../services.js');

module.exports = asyncHandler(async (req, res) => {
  if(!isAdmin(req)) return res.redirect('/');
  const allAlerts = await alerts.getActiveAlerts();
  req.count = allAlerts.length;
  res.send(pug.renderFile('./templates/submit.pug', {
    user: user ? {
      id: user.id,
      email: user.email,
      picture: user.profilePictureUrl,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.metadata?.role
    } : null,
    csrf: req.session.csrfToken,
    nonce: res.locals.nonce,
    alerts: allAlerts
  }));
});