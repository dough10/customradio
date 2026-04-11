const pug = require('pug');

const {posts} = require('./../../services.js');

const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler(async (req, res) => {
  const user = req.user;
  res.send(pug.renderFile('./templates/blog.pug', {
    user: user ? {
      id: user.id,
      email: user.email,
      picture: user.profilePictureUrl,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.metadata?.role
    } : null,  
    lang: req.loadedLang,
    csrf: req.session.csrfToken,
    nonce: res.locals.nonce,
    posts: await posts.getPostList()
  }));
});