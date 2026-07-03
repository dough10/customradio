const pug = require('pug');

const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('./../../util/isAdmin.js');

module.exports = asyncHandler(async (req, res) => {
  const admin = isAdmin(req);
  if (!admin) {
    res.redirect('/');
    return;
  };
  const user = req.user;
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
  }));
});