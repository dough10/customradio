const express = require('express');
const router = express.Router();

const auth = require('../endpoints/auth.js');
const signup = require('../endpoints/signup.js');
const authCallback = require('../endpoints/auth.callback.js');
const authLogout = require('../endpoints/auth.logout.js');

/**
 * Endpoint for authentication using WorkOS SSO.
 */
router.get('/', auth);

/**
 * signup
 */
router.get('/signup', signup);

/**
 * Endpoint for handling the authentication callback from WorkOS.
 */
router.get('/callback', authCallback);

/**
 * Endpoint for logging out the user.
 */
router.get('/logout', authLogout);

module.exports = router;