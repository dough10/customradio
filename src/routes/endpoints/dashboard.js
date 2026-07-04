const pug = require('pug');

const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');

const { mongo } = require('../../services.js');

module.exports = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    res.redirect('/auth?ref=/dashboard');
    return;
  }
  const admin = isAdmin(req);
  if (!admin) {
    res.redirect('/');
    return;
  };
  res.send(pug.renderFile('./templates/dashboard.pug', {
    user: user ? {
      id: user.id,
      email: user.email,
      picture: user.profilePictureUrl,
      firstName: user.firstName,
      lastName: user.lastName
    } : null,
    admin,
    lang: req.loadedLang,
    csrf: req.session.csrfToken,
    nonce: res.locals.nonce,
    requests: await mongo.getRequestCounts(24)
  }));
});