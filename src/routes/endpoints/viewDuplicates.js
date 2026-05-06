const pug = require('pug');

const asyncHandler = require('../../util/asyncHandler.js');
const isAdmin = require('../../util/isAdmin.js');
const {stations} = require('../../services.js');

module.exports = asyncHandler(async ( req, res ) => {
  if(!isAdmin(req)) return res.redirect('/');
  const duplicates = await stations.getDuplicates();
  const {user} = req;
  req.count = duplicates.length;
  res.send(pug.renderFile('./templates/duplicates.pug', {
    user: user ? {
      id: user.id,
      email: user.email,
      picture: user.profilePictureUrl,
      firstName: user.firstName,
      lastName: user.lastName
    } : null,  
    lang: req.loadedLang,
    csrf: req.session.csrfToken,
    nonce: res.locals.nonce,
    duplicates
  }));
});