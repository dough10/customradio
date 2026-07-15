const express = require('express');
const router = express.Router();

const blog = require('../endpoints/blog.js');
const blogPost = require('../endpoints/blog.post.js');

/**
 * gets a list of all posts
 */
router.get('/', blog);

/**
 * gets an individual post
 */
router.get('/:postID', blogPost);

module.exports = router;