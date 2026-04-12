const pug = require('pug');

const {posts} = require('./../../services.js');

const asyncHandler = require('../../util/asyncHandler.js');

module.exports = asyncHandler(async (req, res) => {
  const data = await posts.getPostList();
  const user = req.user;
  req.count = data.length;
  res.send(pug.renderFile('./templates/blog.pug', {
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
    posts: data
  }));
});